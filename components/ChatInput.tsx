import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isSending: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isSending) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <div className="p-4 border-t border-ios-light-header dark:border-ios-dark-header bg-ios-light-panel/80 dark:bg-ios-dark-panel/80 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question..."
                    className="w-full bg-ios-light-header dark:bg-ios-dark-header text-ios-light-text-secondary dark:text-gray-300 font-sans resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 p-3 text-base rounded-2xl"
                    rows={1}
                />
                <button
                    type="submit"
                    disabled={isSending || !message.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-ios-light-header dark:disabled:bg-ios-dark-header disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors duration-200 flex-shrink-0"
                    aria-label="Send message"
                >
                    <SendIcon className="h-6 w-6" />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
