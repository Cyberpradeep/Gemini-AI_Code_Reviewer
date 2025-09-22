import { GoogleGenAI, Content } from "@google/genai";
import { REVIEW_FOCUS_AREAS } from '../constants';
import type { ReviewFinding, ProjectFile } from '../App';

let aiPromise: Promise<GoogleGenAI> | null = null;

const getAiClient = (): Promise<GoogleGenAI> => {
  if (!aiPromise) {
    aiPromise = (async () => {
      try {
        const response = await fetch('/api/get-key');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from API key endpoint.' }));
          throw new Error(errorData.error || `Failed to fetch API key. Status: ${response.status}`);
        }
        const { apiKey } = await response.json();
        if (!apiKey) {
          throw new Error('API key not found in server response. Ensure it is set in Vercel environment variables.');
        }
        return new GoogleGenAI({ apiKey });
      } catch (error) {
        console.error("Fatal error during AI client initialization:", error);
        aiPromise = null; // Reset promise on failure to allow potential future retries
        throw new Error("Could not initialize the AI service. Please verify the API Key is configured correctly in the project's deployment settings.");
      }
    })();
  }
  return aiPromise;
};


const formatProjectFiles = (files: ProjectFile[]): string => {
    if (files.length === 1 && files[0].path.startsWith('snippet.')) {
        return files[0].content;
    }
    return files.map(file => 
        `--- FILE: ${file.path} ---\n${file.content}\n--- END OF FILE: ${file.path} ---`
    ).join('\n\n');
};

const generateStreamReviewPrompt = (files: ProjectFile[], focusAreas: string[]): string => {
  const isProject = files.length > 1 || (files.length === 1 && !files[0].path.startsWith('snippet.'));
  const reviewSubject = isProject ? 'project, which consists of multiple files' : 'code file';
  const fileHeader = isProject ? '**Project Files:**' : '**Code:**';

  const focusPrompt = focusAreas.length > 0
    ? `Please pay special attention to these areas: ${focusAreas.join(', ')}.`
    : `Analyze all aspects of the code, including: ${REVIEW_FOCUS_AREAS.join(', ')}.`;

  return `You are an AI code reviewer. Your task is to analyze the provided code and stream back your findings as a series of individual JSON objects.
${focusPrompt}

**CRITICAL INSTRUCTIONS:**
1.  **JSON ONLY:** Your entire output MUST be a stream of valid JSON objects. Nothing else. No conversational text, no introductions, no summaries, no markdown formatting like \`\`\`json.
2.  **ONE OBJECT PER LINE:** Each JSON object must be a single, minified line of text, separated by a newline.
3.  **IMMEDIATE STREAMING:** Begin streaming the JSON objects immediately without any preamble.
4.  **SCHEMA ADHERENCE:** Every JSON object MUST strictly conform to this exact TypeScript interface:
    \`\`\`typescript
    interface ReviewFinding {
      category: "${REVIEW_FOCUS_AREAS.join('" | "')}";
      severity: "Critical" | "High" | "Medium" | "Low" | "Info";
      title: string;
      summary: string; // Markdown format is allowed here
      filePath: string;
      suggestion?: {
        before: string;
        after: string;
      };
      learnMoreUrl?: string;
    }
    \`\`\`

Now, review the following ${reviewSubject}.

${fileHeader}
${formatProjectFiles(files)}
`;
};

export const performCodeReview = async (
  files: ProjectFile[],
  focusAreas: string[],
  personaInstruction: string,
  onChunkReceived: (finding: ReviewFinding) => void,
): Promise<{ userPrompt: string; }> => {
  try {
    const aiClient = await getAiClient();
    const userPrompt = generateStreamReviewPrompt(files, focusAreas);

    const resultStream = await aiClient.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
            systemInstruction: personaInstruction,
        },
    });

    let buffer = '';
    for await (const chunk of resultStream) {
        buffer += chunk.text;
        
        while (true) {
            const startIndex = buffer.indexOf('{');
            if (startIndex === -1) {
                // No start of a JSON object found, can break and wait for more data
                break;
            }

            // Discard any text before the first '{' (e.g., conversational filler)
            if (startIndex > 0) {
                buffer = buffer.substring(startIndex);
            }

            let braceCount = 1;
            let endIndex = -1;
            for (let i = 1; i < buffer.length; i++) {
                if (buffer[i] === '{') braceCount++;
                else if (buffer[i] === '}') braceCount--;
                
                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }

            if (endIndex !== -1) {
                const jsonString = buffer.substring(0, endIndex + 1);
                try {
                    const finding = JSON.parse(jsonString) as ReviewFinding;
                    onChunkReceived(finding);
                    // Move buffer past the processed object
                    buffer = buffer.substring(endIndex + 1);
                } catch (e) {
                    console.warn("Could not parse streamed JSON object:", jsonString, e);
                    // Skip the malformed opening brace and try to find the next object
                    buffer = buffer.substring(1); 
                }
            } else {
                // Incomplete object, wait for more data
                break;
            }
        }
    }

    return { userPrompt };
  } catch (error) {
    console.error("Error in performCodeReview:", error);
    if (error instanceof Error) throw error;
    throw new Error("An unexpected error occurred while reviewing the code.");
  }
};


const generateActionPrompt = (
    code: string,
    language: string,
    projectFiles: ProjectFile[],
    targetFilePath: string,
    action: 'test' | 'docs'
): string => {
    let task: string;
    const projectContextFiles = projectFiles.filter(f => f.path !== targetFilePath);
    const hasProjectContext = projectContextFiles.length > 0;
    
    const contextPrompt = hasProjectContext 
        ? `Use the other provided project files for context if needed.\n\n**Full Project Context (for reference):**\n${formatProjectFiles(projectContextFiles)}`
        : '';

    if (action === 'test') {
        const framework = (language === 'javascript' || language === 'typescript') ? 'Jest' : 'a suitable standard testing framework for the language';
        task = `Generate a complete unit test suite for the file \`${targetFilePath}\` using ${framework}. The tests should cover the main functionality, edge cases, and potential error conditions. The response should be a single markdown code block containing the test code.`;
    } else { // docs
        const format = (language === 'javascript' || language === 'typescript') ? 'JSDoc' : 'the standard documentation format for the language (e.g., Python Docstrings)';
        task = `Generate comprehensive documentation for the file \`${targetFilePath}\`. Use the ${format} format. The response should be a single markdown code block containing only the documented code.`;
    }

    return `${task}

**Target File: \`${targetFilePath}\`**
\`\`\`${language}
${code}
\`\`\`

${contextPrompt}
`;
};

const generateAiAction = async (
  code: string,
  language: string,
  projectFiles: ProjectFile[],
  targetFilePath: string,
  personaInstruction: string,
  action: 'test' | 'docs'
): Promise<{ response: string; userPrompt: string; }> => {
  try {
    const aiClient = await getAiClient();
    const userPrompt = generateActionPrompt(code, language, projectFiles, targetFilePath, action);

    const result = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
            systemInstruction: personaInstruction,
        },
    });

    return { response: result.text, userPrompt };
  } catch (error) {
    console.error(`Error in generateAiAction (${action}):`, error);
    if (error instanceof Error) throw error;
    throw new Error(`An unexpected error occurred while generating ${action}.`);
  }
};

export const generateUnitTests = (code: string, language: string, projectFiles: ProjectFile[], targetFilePath: string, personaInstruction: string) => 
    generateAiAction(code, language, projectFiles, targetFilePath, personaInstruction, 'test');

export const generateDocumentation = (code: string, language: string, projectFiles: ProjectFile[], targetFilePath: string, personaInstruction: string) =>
    generateAiAction(code, language, projectFiles, targetFilePath, personaInstruction, 'docs');


export const sendFollowUpMessage = async (
  message: string,
  history: Content[],
): Promise<{ response: string; updatedHistory: Content[] }> => {
  try {
    const aiClient = await getAiClient();
    const chat = aiClient.chats.create({
      model: 'gemini-2.5-flash',
      history,
    });

    const result = await chat.sendMessage({ message });
    const response = result.text;
    const updatedHistory = await chat.getHistory();

    return { response, updatedHistory };

  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("An unexpected error occurred in sendFollowUpMessage:", error);
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
};