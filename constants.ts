export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extensions: ['js', 'jsx'] },
  { value: 'typescript', label: 'TypeScript', extensions: ['ts', 'tsx'] },
  { value: 'python', label: 'Python', extensions: ['py'] },
  { value: 'java', label: 'Java', extensions: ['java'] },
  { value: 'csharp', label: 'C#', extensions: ['cs'] },
  { value: 'go', label: 'Go', extensions: ['go'] },
  { value: 'rust', label: 'Rust', extensions: ['rs'] },
  { value: 'cpp', label: 'C++', extensions: ['cpp', 'cxx', 'h', 'hpp'] },
  { value: 'ruby', label: 'Ruby', extensions: ['rb'] },
  { value: 'php', label: 'PHP', extensions: ['php'] },
  { value: 'html', label: 'HTML', extensions: ['html', 'htm'] },
  { value: 'css', label: 'CSS', extensions: ['css'] },
  { value: 'sql', label: 'SQL', extensions: ['sql'] },
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
