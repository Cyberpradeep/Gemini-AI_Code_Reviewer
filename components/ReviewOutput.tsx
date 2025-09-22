import React, { useState } from 'react';
import Spinner from './Spinner';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15.5.0';
import { vscDarkPlus, vs } from 'https://esm.sh/react-syntax-highlighter@15.5.0/dist/esm/styles/prism';
import type { Theme, ChatMessage, ReviewFinding } from '../App';
import ChatInput from './ChatInput';
import ExportModal from './ExportModal';
import { ApplyIcon } from './icons/ApplyIcon';
import { EyeIcon } from './icons/EyeIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { InfoIcon } from './icons/InfoIcon';
import { WarningIcon } from './icons/WarningIcon';
import { CriticalIcon } from './icons/CriticalIcon';
import CopyButton from './CopyButton';


interface ReviewOutputProps {
  conversation: ChatMessage[];
  isLoading: boolean;
  isChatting: boolean;
  error: string | null;
  theme: Theme;
  code: string;
  language: string;
  onSendMessage: (message: string) => void;
  onApplyFix: (before: string, after: string) => void;
  onPreviewFix: (before: string, after: string, language: string) => void;
}

const severityStyles = {
    'Critical': { icon: CriticalIcon, color: 'text-red-500 dark:text-red-400', ring: 'ring-red-500/30' },
    'High': { icon: WarningIcon, color: 'text-orange-500 dark:text-orange-400', ring: 'ring-orange-500/30' },
    'Medium': { icon: WarningIcon, color: 'text-yellow-500 dark:text-yellow-400', ring: 'ring-yellow-500/30' },
    'Low': { icon: InfoIcon, color: 'text-blue-500 dark:text-blue-400', ring: 'ring-blue-500/30' },
    'Info': { icon: InfoIcon, color: 'text-gray-500 dark:text-gray-400', ring: 'ring-gray-500/30' },
};

const SuggestionBlock: React.FC<{
  suggestion: { before: string; after: string };
  language: string;
  theme: Theme;
  onApplyFix: (before: string, after: string) => void;
  onPreviewFix: (before: string, after: string, language: string) => void;
  codeBorderColor: string;
  codeBgColor: string;
  syntaxTheme: any;
}> = ({ suggestion, language, theme, onApplyFix, onPreviewFix, codeBorderColor, codeBgColor, syntaxTheme }) => (
  <div className="my-4 space-y-4">
    <div>
      <p className="text-sm font-medium text-ios-light-text-secondary dark:text-ios-dark-secondary mb-2">Before:</p>
      <div className="relative group">
        <SyntaxHighlighter language={language} style={syntaxTheme} customStyle={{ margin: 0, padding: '1rem', backgroundColor: codeBgColor, borderRadius: '0.5rem' }} codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}>
          {suggestion.before || ''}
        </SyntaxHighlighter>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <CopyButton textToCopy={suggestion.before || ''} />
        </div>
      </div>
    </div>
    <div>
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <p className="text-sm font-medium text-green-600 dark:text-green-400">After:</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreviewFix(suggestion.before || '', suggestion.after || '', language || '')}
            className="flex items-center gap-2 bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-secondary dark:text-ios-dark-secondary font-semibold py-1.5 px-3 rounded-full transition-colors text-xs"
          >
            <EyeIcon className="h-4 w-4" /> Preview
          </button>
          <button 
            onClick={() => onApplyFix(suggestion.before || '', suggestion.after || '')}
            className="flex items-center gap-2 bg-green-600/10 dark:bg-green-500/10 hover:bg-green-600/20 dark:hover:bg-green-500/20 text-green-700 dark:text-green-300 font-semibold py-1.5 px-3 rounded-full transition-colors text-xs"
          >
            <ApplyIcon className="h-4 w-4" /> Apply
          </button>
        </div>
      </div>
      <div className="relative group">
        <SyntaxHighlighter language={language} style={syntaxTheme} customStyle={{ margin: 0, padding: '1rem', backgroundColor: codeBgColor, borderRadius: '0.5rem' }} codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}>
          {suggestion.after || ''}
        </SyntaxHighlighter>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <CopyButton textToCopy={suggestion.after || ''} />
        </div>
      </div>
    </div>
  </div>
);

const MarkdownContent: React.FC<{ content: string; theme: Theme }> = ({ content, theme }) => {
    const syntaxTheme = theme === 'dark' ? vscDarkPlus : vs;
    const codeBgColor = theme === 'dark' ? '#2C2C2E' : '#F0F0F0';
    const codeBorderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 pb-2 border-b" style={{borderColor: codeBorderColor}} {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-6 mb-3 pb-1 border-b" style={{borderColor: codeBorderColor}} {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside mb-4 pl-6 space-y-2" {...props} />,
                code: ({node, inline, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                        const codeString = String(children).replace(/\n$/, '');
                        return (
                            <div className="relative group my-4">
                                <SyntaxHighlighter style={syntaxTheme} language={match[1]} PreTag="div" customStyle={{ padding: '1rem', backgroundColor: codeBgColor, borderRadius: '0.5rem' }} codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }} {...props}>
                                    {codeString}
                                </SyntaxHighlighter>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <CopyButton textToCopy={codeString} />
                                </div>
                            </div>
                        );
                    }
                    return <code className="bg-ios-light-header dark:bg-ios-dark-header text-cyan-700 dark:text-cyan-300 rounded-md px-1.5 py-1 font-mono text-sm" {...props}>{children}</code>;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

const ReviewOutput: React.FC<ReviewOutputProps> = ({ conversation, isLoading, isChatting, error, theme, code, language, onSendMessage, onApplyFix, onPreviewFix }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const syntaxTheme = theme === 'dark' ? vscDarkPlus : vs;
  const codeBgColor = theme === 'dark' ? '#2C2C2E' : '#F0F0F0';
  const codeBorderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-ios-light-text-secondary dark:text-ios-dark-secondary">
          <Spinner />
          <p className="mt-4 text-lg">AI is analyzing your code...</p>
          <p className="text-sm">This may take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-400 p-4">
          <div className="bg-red-900/50 border border-red-700 p-6 rounded-2xl text-center w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">An Error Occurred</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      );
    }

    if (conversation.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-ios-light-text-secondary dark:text-ios-dark-secondary">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-500 dark:text-gray-400">Ready for Review</h3>
            <p>Your code analysis will appear here.</p>
          </div>
        </div>
      );
    }

    return (
       <div className="space-y-6">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex flex-col animate-fade-in ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`w-full max-w-[95%] lg:max-w-[90%] rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white p-4' : 'bg-transparent'}`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content as string}</p>
              ) : (
                <>
                  {Array.isArray(msg.content) ? (
                    <div className="space-y-4">
                      {msg.content.map((finding, findIndex) => {
                        const SeverityIcon = severityStyles[finding.severity]?.icon || InfoIcon;
                        const severityColor = severityStyles[finding.severity]?.color || 'text-gray-500';
                        return (
                          <div key={findIndex} className="bg-ios-light-header dark:bg-ios-dark-header p-4 rounded-xl border border-ios-light-tertiary dark:border-ios-dark-tertiary/50">
                            <div className="flex items-center gap-3 mb-2">
                               <SeverityIcon className={`h-5 w-5 ${severityColor}`} />
                               <span className={`font-semibold text-sm ${severityColor}`}>{finding.severity}</span>
                               <span className="text-xs font-medium text-ios-light-text-secondary dark:text-ios-dark-secondary bg-ios-light-tertiary dark:bg-ios-dark-tertiary px-2 py-0.5 rounded-full">{finding.category}</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-ios-light-text-primary dark:text-white">{finding.title}</h3>
                            <div className="text-sm text-ios-light-text-secondary dark:text-ios-dark-secondary prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownContent content={finding.summary} theme={theme} />
                            </div>
                            {finding.suggestion && (
                                <SuggestionBlock suggestion={finding.suggestion} language={language} theme={theme} onApplyFix={onApplyFix} onPreviewFix={onPreviewFix} codeBorderColor={codeBorderColor} codeBgColor={codeBgColor} syntaxTheme={syntaxTheme} />
                            )}
                            {finding.learnMoreUrl && (
                                <div className="mt-4">
                                    <a href={finding.learnMoreUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                                        Learn More &rarr;
                                    </a>
                                </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-ios-light-header dark:bg-ios-dark-header p-4 rounded-xl">
                      <MarkdownContent content={msg.content as string} theme={theme} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {isChatting && (
            <div className="flex justify-start">
                <div className="px-5 py-3.5 rounded-2xl bg-ios-light-header dark:bg-ios-dark-header">
                    <Spinner className="h-6 w-6" />
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-ios-light-panel dark:bg-ios-dark-panel rounded-2xl shadow-lg h-full flex flex-col border border-ios-light-tertiary dark:border-ios-dark-tertiary/50">
        <div className="p-4 border-b border-ios-light-header dark:border-ios-dark-header sticky top-0 bg-ios-light-panel/80 dark:bg-ios-dark-panel/80 backdrop-blur-md z-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ios-light-text-primary dark:text-white">AI Assistant</h2>
           {(conversation.length > 0 && !isLoading) && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 rounded-full hover:bg-ios-light-header dark:hover:bg-ios-dark-header text-ios-light-text-secondary dark:text-ios-dark-secondary"
              aria-label="Export review"
            >
              <DownloadIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-grow p-6 overflow-y-auto">
          {renderContent()}
        </div>
        {(conversation.length > 0 && !isLoading) && (
          <ChatInput onSendMessage={onSendMessage} isSending={isChatting} />
        )}
      </div>
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        conversation={conversation}
        code={code}
        language={language}
        theme={theme}
      />
    </>
  );
};

export default ReviewOutput;
