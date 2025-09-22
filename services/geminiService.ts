

import { GoogleGenAI, Content } from "@google/genai";
import { REVIEW_FOCUS_AREAS } from '../constants';

// We will hold the initialized client in memory to avoid re-initializing on every call.
let ai: GoogleGenAI | null = null;

/**
 * Gets the initialized GoogleGenAI client.
 * On the first call, it fetches the API key from a secure serverless function
 * and creates a new client instance. Subsequent calls return the cached instance.
 */
const getAiClient = async (): Promise<GoogleGenAI> => {
  if (ai) {
    return ai;
  }

  try {
    const response = await fetch('/api/get-key');
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch API key from server.' }));
        throw new Error(errorData.error);
    }
    const { apiKey } = await response.json();

    if (!apiKey) {
      throw new Error("API key was not returned from the server.");
    }

    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error("Error initializing AI client:", error);
    // Provide a user-friendly error message that hints at the solution.
    throw new Error("Could not connect to the AI service. Please ensure the API_KEY is set correctly in your Vercel project settings.");
  }
};


const generateInitialPrompt = (code: string, language: string, focusAreas: string[]): string => {
  const focusPrompt = focusAreas.length > 0 
    ? `Please pay special attention to these areas: ${focusAreas.join(', ')}.`
    : `Take a look at things like: ${REVIEW_FOCUS_AREAS.join(', ')}.`;
  
  return `Act as a super friendly and encouraging coding buddy. Your goal is to review the following code snippet and explain your suggestions in a simple, conversational, and helpful way. Imagine you're pair-programming with a friend. Be positive, avoid jargon, and never sound bossy or overly formal.

When reviewing the ${language} code:
1.  Start with a cheerful and positive summary.
2.  Explain suggestions clearly and simply.
3.  Be encouraging throughout your review!

${focusPrompt}

Provide your feedback in Markdown format. Use code blocks (\`\`\`) for examples.

IMPORTANT: For any suggestions that involve changing the code, you MUST provide them in the following structured format. This is critical for the application to parse your response.

**Suggestion: [A brief, clear title for the change]**
> **Before:**
> \`\`\`${language}
> // The original code snippet that should be replaced
> \`\`\`
> **After:**
> \`\`\`${language}
> // The new, improved code snippet
> \`\`\`

Alright, let's take a look at this code together!
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
    // This now ensures the client is ready before making a request.
    const aiClient = await getAiClient();

    const chat = aiClient.chats.create({
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
    // Re-throw the error so the UI layer can catch it and display it.
    // The error from getAiClient will be more informative for the user.
    if (error instanceof Error) {
      throw error;
    }
    console.error("An unexpected error occurred in sendChatMessage:", error);
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
};