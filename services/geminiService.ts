import { GoogleGenAI, Content } from "@google/genai";
import { REVIEW_FOCUS_AREAS } from '../constants';
import type { ReviewFinding, ProjectFile } from '../App';

// Singleton pattern to hold the initialized AI client and the API key fetching promise
let ai: GoogleGenAI | null = null;
let apiKeyPromise: Promise<string> | null = null;

const fetchApiKey = async (): Promise<string> => {
    try {
        const response = await fetch('/api/get-key');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // try to parse error
            const errorMessage = errorData.error || `Failed to fetch API key from server (status: ${response.status}).`;
            console.error("API Key fetch failed:", errorMessage);
            throw new Error(errorMessage);
        }
        const { apiKey } = await response.json();
        if (!apiKey) {
            throw new Error("API key is missing in the server's response.");
        }
        return apiKey;
    } catch (err) {
        console.error("Fatal error during API key fetch:", err);
        // Re-throw a more user-friendly error for the UI.
        throw new Error("Could not get API Key from server. Please ensure it is configured in your project's deployment settings.");
    }
};

const getAiClient = async (): Promise<GoogleGenAI> => {
    if (ai) {
        return ai;
    }
    
    if (!apiKeyPromise) {
        apiKeyPromise = fetchApiKey();
    }

    try {
        const apiKey = await apiKeyPromise;
        ai = new GoogleGenAI({ apiKey });
        return ai;
    } catch (error) {
        apiKeyPromise = null; // Reset promise on failure to allow retries
        console.error("Fatal error during AI client initialization:", error);
        throw error; // Propagate the user-friendly error
    }
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
1.  **START WITH AN OVERVIEW:** Your very first JSON object MUST be a "Code Overview". It should have \`severity: "Info"\`, \`category: "Best Practices & Readability"\`, and a \`title\` of "Code Purpose & Overview". In its \`summary\`, provide a high-level explanation of what the code does.
2.  **EXPLAIN FINDINGS CLEARLY:** For each subsequent finding, the \`summary\` field must clearly explain the issue, why it's a problem, and how the suggested solution fixes it. Maintain a helpful and clear tone.
3.  **JSON ONLY:** Your entire output MUST be a stream of valid JSON objects. Nothing else. No conversational text, no introductions, no summaries outside of the JSON structure.
4.  **ONE OBJECT PER LINE:** Each JSON object must be a single, minified line of text, separated by a newline.
5.  **IMMEDIATE STREAMING:** Begin streaming the JSON objects immediately without any preamble.
6.  **SCHEMA ADHERENCE:** Every JSON object MUST strictly conform to this exact TypeScript interface:
    \`\`\`typescript
    interface ReviewFinding {
      category: "${REVIEW_FOCUS_AREAS.join('" | "')}";
      severity: "Critical" | "High" | "Medium" | "Low" | "Info";
      title: string;
      summary: string; // Markdown format is allowed here. This is where you explain the issue.
      filePath: string;
      suggestion?: {
        before: string;
        after: string;
      };
      learnMoreUrl?: string;
    }
    \`\`\`

Now, review the following ${reviewSubject}, following all instructions above.

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
    const localAi = await getAiClient();
    const userPrompt = generateStreamReviewPrompt(files, focusAreas);

    const resultStream = await localAi.models.generateContentStream({
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
        task = `Generate a complete unit test suite for the file \`${targetFilePath}\` using ${framework}. The tests should cover the main functionality, edge cases, and potential error conditions. The response must be ONLY the code, inside a single markdown code block. Do not add any explanation or introductory text.`;
    } else { // docs
        const format = (language === 'javascript' || language === 'typescript') ? 'JSDoc' : 'the standard documentation format for the language (e.g., Python Docstrings)';
        task = `Generate comprehensive documentation for the file \`${targetFilePath}\`. Use the ${format} format. The response must be ONLY the documented code, inside a single markdown code block. Do not add any explanation or introductory text.`;
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
    const localAi = await getAiClient();
    const userPrompt = generateActionPrompt(code, language, projectFiles, targetFilePath, action);

    const result = await localAi.models.generateContent({
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
    const localAi = await getAiClient();
    const chat = localAi.chats.create({
      model: 'gemini-2.5-flash',
      history,
      config: {
        systemInstruction: "You are a helpful AI code review assistant. The user has already received an initial code review. Your task is now to answer follow-up questions conversationally. Your responses should be in clear, formatted Markdown. Do NOT output JSON.",
      },
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