// A simple markdown to plain text converter.
// It's not exhaustive but handles common cases for this app.
export const stripMarkdown = (markdown: string): string => {
  return markdown
    // Remove suggestion blocks first to avoid mangling them
    .replace(/\*\*Suggestion: (.*?)\*\*\s*>\s*\*\*Before:\*\*\s*```(\w+)?\n([\s\S]*?)\n```\s*>\s*\*\*After:\*\*\s*```(\w+)?\n([\s\S]*?)\n```/gs, 
      (match, title, lang1, before, lang2, after) => 
      `Suggestion: ${title}\n\nBefore:\n${before.trim()}\n\nAfter:\n${after.trim()}\n\n`
    )
    // Remove headers
    .replace(/^#{1,6}\s*(.*)/gm, '$1')
    // Remove bold and italics
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```(\w+)?\n([\s\S]*?)\n```/g, '$2')
    // Remove blockquotes
    .replace(/^>\s?(.*)/gm, '$1')
    // Remove list items
    .replace(/^\s*[-*+]\s+(.*)/gm, '$1')
    // Remove links but keep the text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
