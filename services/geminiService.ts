
import { GoogleGenAI, Content } from "@google/genai";
import { REVIEW_FOCUS_AREAS } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateInitialPrompt = (code: string, language: string, focusAreas: string[]): string => {
  const focusPrompt = focusAreas.length > 0 
    ? `Your review should focus specifically on these areas: ${focusAreas.join(', ')}.`
    : `Your review should cover these key areas: ${REVIEW_FOCUS_AREAS.join(', ')}.`;
  
  return `Act as a friendly and helpful programming assistant who is an expert in ${language}. Your goal is to review the following code snippet and explain your suggestions in simple, easy-to-understand words. Avoid jargon where possible, and be encouraging!

${focusPrompt}

Provide your feedback in Markdown format. Use code blocks (\`\`\`) for examples.
Start with a friendly, high-level summary of what the code does well. Then, offer a list of clear, actionable suggestions for improvement.

IMPORTANT: For any suggestions that involve changing the code, you MUST provide them in the following structured format. This is critical for the application to parse your response. Do not include this format for suggestions that are purely conceptual.

**Suggestion: [A brief, clear title for the change]**
> **Before:**
> \`\`\`${language}
> // The original code snippet that should be replaced
> \`\`\`
> **After:**
> \`\`\`${language}
> // The new, improved code snippet
> \`\`\`

Here is the code to review. Let's take a look together!
\`\`\`${language}
${code}
\`\`\`
`;
};


export const sendChatMessage = async (
  message: string,
  history: Content[],
  isNewReview: boolean,
  code?: string,
  language?: string,
  focusAreas?: string[]
): Promise<{ response: string; updatedHistory: Content[] }> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history,
    });

    const prompt = isNewReview && code && language && focusAreas
      ? generateInitialPrompt(code, language, focusAreas)
      : message;

    const result = await chat.sendMessage({ message: prompt });
    const response = result.text;
    const updatedHistory = await chat.getHistory();

    return { response, updatedHistory };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("Invalid API Key. Please check your configuration.");
    }
    throw new Error("Failed to get response from Gemini API.");
  }
};