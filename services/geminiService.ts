
import { GoogleGenAI, Content } from "@google/genai";
import { REVIEW_FOCUS_AREAS, SUPPORTED_LANGUAGES } from '../constants';
import type { ReviewFinding, ProjectFile } from '../App';

// This function initializes the AI client directly using the API key from environment variables.
// It includes a check to provide a clear error message if the key is missing,
// which is common in browser environments without a specific build step to inject the variable.
const initializeAiClient = (): GoogleGenAI => {
    // This check is crucial for browser environments where 'process' is not defined.
    if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
        console.error("API_KEY environment variable not found.");
        // This specific error message will be shown to the user.
        throw new Error("Could not initialize the AI service. Please verify the API Key is configured correctly in the project's deployment settings.");
    }

    try {
        // Initialize the client as per the guidelines.
        return new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (error) {
        console.error("Error initializing GoogleGenAI:", error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Could not initialize the AI service: ${message}`);
    }
};

// Initialize the client once at the module level.
// If initialization fails, it will throw an error immediately, preventing the app from running in a broken state.
const ai = initializeAiClient();


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
    const userPrompt = generateStreamReviewPrompt(files, focusAreas);

    const resultStream = await ai.models.generateContentStream({
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

export const sendFollowUpMessage = async (
  message: string,
  history: Content[],
): Promise<{ response: string; updatedHistory: Content[] }> => {
  try {
    const chat = ai.chats.create({
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

export const detectLanguage = async (codeSnippet: string): Promise<string | null> => {
    if (!codeSnippet || codeSnippet.trim().length < 20) {
        return null; // Not enough code to detect
    }
    try {
        const supportedLanguageValues = SUPPORTED_LANGUAGES.map(l => l.value).join(', ');

        const prompt = `Analyze the following code snippet and identify the programming language.
Your response MUST be a single word from this list: [${supportedLanguageValues}].
Do not provide any explanation, markdown, or any other text.

Code:
---
${codeSnippet.substring(0, 2000)}
---`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: 0,
                thinkingConfig: { thinkingBudget: 0 } 
            }
        });

        const detectedLang = result.text.trim().toLowerCase();
        const isValid = SUPPORTED_LANGUAGES.some(l => l.value === detectedLang);

        if (isValid) {
            return detectedLang;
        }
        console.warn(`Language detection returned an unsupported value: "${detectedLang}"`);
        return null;

    } catch (error) {
        console.error("Error in detectLanguage:", error);
        return null;
    }
};
