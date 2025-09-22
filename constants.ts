export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
];

export const HISTORY_STORAGE_KEY = 'aiCodeReviewerHistory';

export const REVIEW_FOCUS_AREAS = [
  'Correctness & Bugs',
  'Best Practices & Readability',
  'Performance',
  'Security',
  'Maintainability',
];

export const AI_PERSONAS = [
  { value: 'mentor', label: 'Friendly Mentor', instruction: "Act as a super friendly and encouraging coding buddy. Your goal is to review the following code snippet and explain your suggestions in a simple, conversational, and helpful way. Imagine you're pair-programming with a friend. Be positive, avoid jargon, and never sound bossy or overly formal." },
  { value: 'tech_lead', label: 'Strict Tech Lead', instruction: "Act as a senior software architect and tech lead. Your feedback should be direct, concise, and adhere to the highest industry standards for code quality, performance, and security. Be formal and focus on technical accuracy and best practices. Do not use conversational filler." },
  { value: 'comedian', label: 'Sarcastic Comedian', instruction: "Act as a sarcastic comedian who happens to be an expert programmer. Roasting the code is encouraged, but your underlying suggestions must be technically sound and genuinely helpful. Your tone should be witty, dry, and a little bit cynical. Wrap your valid points in humor." },
];
