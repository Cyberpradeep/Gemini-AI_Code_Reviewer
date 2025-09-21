
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generatePrompt = (code: string, language: string): string => {
  return `Act as a world-class senior software engineer and an expert in ${language}.
Your task is to provide a thorough and constructive code review of the following code snippet.

Your review should cover these key areas:
1.  **Correctness & Bugs:** Identify any potential bugs, logical errors, or edge cases that are not handled.
2.  **Best Practices & Readability:** Suggest improvements for code style, clarity, naming conventions, and overall structure. Adhere to the idiomatic conventions of ${language}.
3.  **Performance:** Point out any performance bottlenecks or suggest more efficient alternatives.
4.  **Security:** Highlight any potential security vulnerabilities (e.g., injection attacks, data exposure).
5.  **Maintainability:** Comment on how easy the code is to understand, modify, and extend. Suggest refactoring if necessary.

Provide your feedback in Markdown format. Use code blocks (\`\`\`) for examples and syntax highlighting.
Start with a brief, high-level summary of the code's quality, then provide a list of specific, actionable suggestions. For each suggestion, explain the problem and the proposed solution clearly.

Here is the code to review:
\`\`\`${language}
${code}
\`\`\`
`;
};

export const reviewCode = async (code: string, language: string): Promise<string> => {
  const prompt = generatePrompt(code, language);

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get review from Gemini API.");
  }
};
