export interface ParsedSegment {
    type: 'text' | 'suggestion';
    content: string; 
    title?: string;
    before?: string;
    after?: string;
    language?: string;
}

const suggestionRegex = /\*\*Suggestion: (.*?)\*\*\s*>\s*\*\*Before:\*\*\s*```(\w+)?\n([\s\S]*?)\n```\s*>\s*\*\*After:\*\*\s*```(\w+)?\n([\s\S]*?)\n```/gs;

export const parseReview = (markdown: string): ParsedSegment[] => {
    if (!markdown) return [];

    const segments: ParsedSegment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = suggestionRegex.exec(markdown)) !== null) {
        if (match.index > lastIndex) {
            segments.push({
                type: 'text',
                content: markdown.substring(lastIndex, match.index),
            });
        }

        segments.push({
            type: 'suggestion',
            content: '',
            title: match[1].trim(),
            language: match[2] || match[4] || '',
            before: match[3].trim(),
            after: match[5].trim(),
        });

        lastIndex = suggestionRegex.lastIndex;
    }

    if (lastIndex < markdown.length) {
        segments.push({
            type: 'text',
            content: markdown.substring(lastIndex),
        });
    }
    
    // If no suggestions were found, return the whole text as one segment
    if(segments.length === 0 && markdown.length > 0) {
        return [{ type: 'text', content: markdown }];
    }

    return segments;
};
