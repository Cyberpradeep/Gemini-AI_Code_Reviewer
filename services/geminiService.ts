import { GoogleGenAI, Content, Type } from "@google/genai";
import { REVIEW_FOCUS_AREAS } from '../constants';
import type { ReviewFinding } from '../App';

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

const reviewSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            category: { type: Type.STRING, enum: REVIEW_FOCUS_AREAS, description: "The category of the finding." },
            severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'], description: "The severity of the issue." },
            title: { type: Type.STRING, description: "A short, descriptive title for the finding." },
            summary: { type: Type.STRING, description: "A clear and simple explanation of the issue and why it matters. This should be in Markdown format." },
            suggestion: {
                type: Type.OBJECT,
                properties: {
                    before: { type: Type.STRING, description: "The exact code snippet to be replaced." },
                    after: { type: Type.STRING, description: "The new, improved code snippet." }
                },
                propertyOrdering: ["before", "after"],
                description: "The suggested code change. Omit this field if no direct code change is applicable."
            },
            learnMoreUrl: { type: Type.STRING, description: "An optional URL to a resource that explains the concept further." }
        },
        propertyOrdering: ["category", "severity", "title", "summary", "suggestion", "learnMoreUrl"],
        required: ["category", "severity", "title", "summary"]
    }
};

const generateReviewPrompt = (code: string, language: string, focusAreas: string[]): string => {
  const focusPrompt = focusAreas.length > 0
    ? `Please pay special attention to these areas: ${focusAreas.join(', ')}.`
    : `Analyze all aspects of the code, including: ${REVIEW_FOCUS_AREAS.join(', ')}.`;

  return `Please review the following ${language} code snippet. 
${focusPrompt}
Provide your feedback as a JSON array that adheres to the defined schema. Each item in the array should represent a single finding. For each finding, provide a category, severity, a concise title, a detailed summary in Markdown, and an optional code suggestion and a "learn more" URL.

\`\`\`${language}
${code}
\`\`\`
`;
};

export const performCodeReview = async (
  code: string,
  language: string,
  focusAreas: string[],
  personaInstruction: string
): Promise<{ response: ReviewFinding[]; userPrompt: string; }> => {
  try {
    const aiClient = await getAiClient();
    const userPrompt = generateReviewPrompt(code, language, focusAreas);

    const result = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: reviewSchema,
            systemInstruction: personaInstruction,
        },
    });

    const response = JSON.parse(result.text);
    return { response, userPrompt };
  } catch (error) {
    console.error("Error in performCodeReview:", error);
    if (error instanceof Error) throw error;
    throw new Error("An unexpected error occurred while reviewing the code.");
  }
};


const generateActionPrompt = (code: string, language: string, action: 'test' | 'docs'): string => {
    let task: string;
    if (action === 'test') {
        const framework = (language === 'javascript' || language === 'typescript') ? 'Jest' : 'a suitable standard testing framework for the language';
        task = `Generate a complete unit test suite for the following ${language} code using ${framework}. The tests should cover the main functionality, edge cases, and potential error conditions. The response should be a single markdown code block containing the test code.`;
    } else { // docs
        const format = (language === 'javascript' || language === 'typescript') ? 'JSDoc' : 'the standard documentation format for the language (e.g., Python Docstrings)';
        task = `Generate comprehensive documentation for the following ${language} code. Use the ${format} format. The response should be a single markdown code block containing only the documented code.`;
    }
    return `${task}\n\n\`\`\`${language}\n${code}\n\`\`\``;
};

const generateAiAction = async (
  code: string,
  language: string,
  personaInstruction: string,
  action: 'test' | 'docs'
): Promise<{ response: string; userPrompt: string; }> => {
  try {
    const aiClient = await getAiClient();
    const userPrompt = generateActionPrompt(code, language, action);

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

export const generateUnitTests = (code: string, language: string, personaInstruction: string) => 
    generateAiAction(code, language, personaInstruction, 'test');

export const generateDocumentation = (code: string, language: string, personaInstruction: string) =>
    generateAiAction(code, language, personaInstruction, 'docs');


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
