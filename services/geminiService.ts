import { GoogleGenAI, Content } from "@google/genai";
import { REVIEW_FOCUS_AREAS } from '../constants';
import type { ReviewFinding, ProjectFile } from '../App';

let ai: GoogleGenAI | null = null;

const getAiClient = async (): Promise<GoogleGenAI> => {
  if (ai) return ai;
  try {
    const response = await fetch('/api/get-key');
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch API key from server.' }));
        throw new Error(errorData.error);
    }
    const { apiKey } = await response.json();
    if (!apiKey) throw new Error("API key was not returned from the server.");
    
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error("Error initializing AI client:", error);
    throw new Error("Could not connect to the AI service. Please ensure the API_KEY is set correctly in your Vercel project settings.");
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

  return `Please perform a holistic code review of the following ${reviewSubject}. Analyze the code for bugs, performance issues, security vulnerabilities, and adherence to best practices. For projects with multiple files, consider the interactions between them.
${focusPrompt}

Your entire response must be a stream of individual JSON objects, with each object separated by a newline. Each JSON object represents a single finding and MUST conform to this exact schema:
{
  "category": "string (one of: ${REVIEW_FOCUS_AREAS.join(', ')})",
  "severity": "string (one of: 'Critical', 'High', 'Medium', 'Low', 'Info')",
  "title": "string",
  "summary": "string (in Markdown format)",
  "filePath": "string",
  "suggestion": { "before": "string", "after": "string" } | null,
  "learnMoreUrl": "string" | null
}

IMPORTANT:
- Each JSON object MUST be a single, minified line of text. DO NOT use pretty-print formatting.
- DO NOT wrap the output in a JSON array or use commas between objects.
- DO NOT output ANY other text, introductions, summaries, or markdown formatting like \`\`\`json before or after the stream.

Start streaming the JSON objects immediately.

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
        contents: userPrompt,
        config: {
            systemInstruction: personaInstruction,
        },
    });

    let buffer = '';
    for await (const chunk of resultStream) {
        buffer += chunk.text;
        
        let lastProcessedIndex = 0;
        while (true) {
            const startIndex = buffer.indexOf('{', lastProcessedIndex);
            if (startIndex === -1) break;

            let braceCount = 1;
            let endIndex = -1;
            for (let i = startIndex + 1; i < buffer.length; i++) {
                if (buffer[i] === '{') braceCount++;
                else if (buffer[i] === '}') braceCount--;
                
                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }

            if (endIndex !== -1) {
                const jsonString = buffer.substring(startIndex, endIndex + 1);
                try {
                    const finding = JSON.parse(jsonString) as ReviewFinding;
                    onChunkReceived(finding);
                    lastProcessedIndex = endIndex + 1;
                } catch (e) {
                    console.warn("Could not parse streamed JSON object:", jsonString, e);
                    lastProcessedIndex = startIndex + 1; // Skip malformed start
                }
            } else {
                // Incomplete object, wait for more data
                break;
            }
        }

        if (lastProcessedIndex > 0) {
            buffer = buffer.substring(lastProcessedIndex);
        }
    }

    // Final cleanup and parse for any remaining buffer content
    const cleanedBuffer = buffer.replace(/```/g, '').trim();
    if (cleanedBuffer.startsWith('{') && cleanedBuffer.endsWith('}')) {
        try {
            const finding = JSON.parse(cleanedBuffer) as ReviewFinding;
            onChunkReceived(finding);
        } catch (e) {
            console.warn("Could not parse final buffered JSON object:", cleanedBuffer, e);
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
        contents: userPrompt,
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