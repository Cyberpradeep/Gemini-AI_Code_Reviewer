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
        <div className="p-3 border-t border-light-separator dark:border-dark-separator">
            <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-light-fill-primary dark:bg-dark-fill-primary p-1.5 rounded-xl">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up..."
                    className="flex-1 bg-transparent text-light-label-primary dark:text-dark-label-primary font-sans resize-none focus:outline-none p-2 text-sm"
                    rows={1}
                />
                <button
                    type="submit"
                    disabled={isSending || !message.trim()}
                    className="bg-light-accent dark:bg-dark-accent hover:opacity-90 disabled:bg-light-fill-secondary dark:disabled:bg-dark-fill-secondary disabled:cursor-not-allowed text-white p-2 rounded-full transition-all duration-200 flex-shrink-0"
                    aria-label="Send message"
                >
                    <SendIcon className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;