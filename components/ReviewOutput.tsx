import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15.5.0';
import { vscDarkPlus, vs } from 'https://esm.sh/react-syntax-highlighter@15.5.0/dist/esm/styles/prism';
import type { Theme, ChatMessage, ReviewFinding, ProjectFile } from '../App';
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
  language: string;
  onSendMessage: (message: string) => void;
  onApplyFix: (before: string, after: string, filePath?: string) => void;
  onPreviewFix: (before: string, after: string, language: string, filePath?: string) => void;
  projectFiles: ProjectFile[];
}

const severityStyles = {
    'Critical': { icon: CriticalIcon, color: 'text-red-500 dark:text-red-400' },
    'High': { icon: WarningIcon, color: 'text-orange-500 dark:text-orange-400' },
    'Medium': { icon: WarningIcon, color: 'text-yellow-500 dark:text-yellow-400' },
    'Low': { icon: InfoIcon, color: 'text-blue-500 dark:text-blue-400' },
    'Info': { icon: InfoIcon, color: 'text-gray-500 dark:text-gray-400' },
};

const SuggestionBlock: React.FC<{
  suggestion: { before: string; after: string };
  language: string;
  theme: Theme;
  onApplyFix: (before: string, after: string) => void;
  onPreviewFix: (before: string, after: string, language: string) => void;
  syntaxTheme: any;
}> = ({ suggestion, language, theme, onApplyFix, onPreviewFix, syntaxTheme }) => (
  <div className="my-4 space-y-4">
    <div>
      <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1.5">BEFORE</p>
      <div className="relative group rounded-lg overflow-hidden bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          customStyle={{ margin: 0, padding: '0.75rem', backgroundColor: 'transparent', fontSize: '0.8125rem' }}
          codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}
          showLineNumbers={true}
          lineNumberStyle={{ opacity: 0.6, minWidth: '2.25em' }}
        >
          {suggestion.before || ''}
        </SyntaxHighlighter>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <CopyButton textToCopy={suggestion.before || ''} />
        </div>
      </div>
    </div>
    <div>
      <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
        <p className="text-xs font-medium text-green-600 dark:text-green-400">AFTER</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreviewFix(suggestion.before || '', suggestion.after || '', language || '')}
            className="flex items-center gap-1.5 bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary text-light-label-secondary dark:text-dark-label-secondary font-medium py-1 px-2.5 rounded-full transition-colors text-xs"
          >
            <EyeIcon className="h-4 w-4" /> Preview
          </button>
          <button 
            onClick={() => onApplyFix(suggestion.before || '', suggestion.after || '')}
            className="flex items-center gap-1.5 bg-green-600/10 dark:bg-green-500/10 hover:bg-green-600/20 dark:hover:bg-green-500/20 text-green-700 dark:text-green-300 font-medium py-1 px-2.5 rounded-full transition-colors text-xs"
          >
            <ApplyIcon className="h-4 w-4" /> Apply
          </button>
        </div>
      </div>
      <div className="relative group rounded-lg overflow-hidden bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          customStyle={{ margin: 0, padding: '0.75rem', backgroundColor: 'transparent', fontSize: '0.8125rem' }}
          codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}
          showLineNumbers={true}
          lineNumberStyle={{ opacity: 0.6, minWidth: '2.25em' }}
        >
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
    const codeBgColor = theme === 'dark' ? 'rgba(128, 128, 128, 0.2)' : 'rgba(128, 128, 128, 0.12)';
    const separatorColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-4 pb-2 border-b" style={{borderColor: separatorColor}} {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-6 mb-3 pb-1 border-b" style={{borderColor: separatorColor}} {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-sm" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside mb-4 pl-5 space-y-2 text-sm" {...props} />,
                code: ({node, inline, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                        const codeString = String(children).replace(/\n$/, '');
                        return (
                            <div className="relative group my-4 rounded-lg overflow-hidden" style={{backgroundColor: codeBgColor}}>
                                <SyntaxHighlighter style={syntaxTheme} language={match[1]} PreTag="div" customStyle={{ padding: '0.75rem', backgroundColor: 'transparent', fontSize: '0.8125rem' }} codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }} {...props} showLineNumbers lineNumberStyle={{opacity: 0.6, minWidth: '2.25em'}}>
                                    {codeString}
                                </SyntaxHighlighter>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <CopyButton textToCopy={codeString} />
                                </div>
                            </div>
                        );
                    }
                    return <code className="text-light-accent dark:text-dark-accent rounded-md px-1 py-0.5 font-mono text-sm" style={{backgroundColor: codeBgColor}} {...props}>{children}</code>;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

const loadingMessages = [
    "Connecting to Gemini...",
    "Analyzing code structure...",
    "Evaluating for best practices...",
    "Checking for security vulnerabilities...",
    "Assessing performance...",
    "Compiling suggestions...",
];

const ReviewOutput: React.FC<ReviewOutputProps> = ({ conversation, isLoading, isChatting, error, theme, language, onSendMessage, onApplyFix, onPreviewFix, projectFiles }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  
  const syntaxTheme = theme === 'dark' ? vscDarkPlus : vs;
  
  useEffect(() => {
    let interval: number | undefined;
    if (isLoading) {
        let i = 0;
        setCurrentLoadingMessage(loadingMessages[0]); // Reset on new load
        interval = window.setInterval(() => {
            i = (i + 1) % loadingMessages.length;
            setCurrentLoadingMessage(loadingMessages[i]);
        }, 1800);
    }
    return () => {
        if (interval) {
            clearInterval(interval);
        }
    };
  }, [isLoading]);

  const renderContent = () => {
    const firstMessageContent = conversation[0]?.content;
    const hasContent = conversation.length > 0 && Array.isArray(firstMessageContent) && firstMessageContent.length > 0;

    if (isLoading && !hasContent) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-light-label-secondary dark:text-dark-label-secondary">
          <Spinner />
          <p className="mt-4 text-base">AI is analyzing your project...</p>
          <p className="text-sm transition-opacity duration-300">{currentLoadingMessage}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-400 p-4">
          <div className="bg-red-900/50 border border-red-700 p-6 rounded-2xl text-center w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">An Error Occurred</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      );
    }

    if (!hasContent && !isLoading) {
      return (
        <div className="flex items-center justify-center h-full text-light-label-secondary dark:text-dark-label-secondary">
          <div className="text-center">
            <h3 className="text-xl font-semibold">Ready for Review</h3>
            <p>Your project analysis will appear here.</p>
          </div>
        </div>
      );
    }

    return (
       <div className="space-y-6">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex flex-col animate-fade-in ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`w-full max-w-[90%] lg:max-w-[85%]`}>
              {Array.isArray(msg.content) ? (
                <div className="space-y-3">
                  {msg.content.map((finding, findIndex) => {
                    const SeverityIcon = severityStyles[finding.severity]?.icon || InfoIcon;
                    const severityColor = severityStyles[finding.severity]?.color || 'text-gray-500';
                    return (
                      <div key={findIndex} className="bg-light-fill-primary/50 dark:bg-dark-fill-primary/50 p-4 rounded-xl border border-light-separator dark:border-dark-separator">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                           <SeverityIcon className={`h-5 w-5 ${severityColor}`} />
                           <span className={`font-semibold text-sm ${severityColor}`}>{finding.severity}</span>
                           <span className="text-xs font-medium text-light-label-secondary dark:text-dark-label-secondary bg-light-fill-secondary dark:bg-dark-fill-secondary px-2 py-0.5 rounded-full">{finding.category}</span>
                        </div>
                        <h3 className="text-base font-semibold mb-1 text-light-label-primary dark:text-dark-label-primary">{finding.title}</h3>
                        {finding.filePath && <p className="text-xs font-mono text-light-accent dark:text-dark-accent mb-2 truncate">{finding.filePath}</p>}
                        <div className="text-sm text-light-label-secondary dark:text-dark-label-secondary prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownContent content={finding.summary} theme={theme} />
                        </div>
                        {finding.suggestion && (
                            <SuggestionBlock 
                                suggestion={finding.suggestion} 
                                language={language} 
                                theme={theme} 
                                onApplyFix={(before, after) => onApplyFix(before, after, finding.filePath)} 
                                onPreviewFix={(before, after, lang) => onPreviewFix(before, after, lang, finding.filePath)} 
                                syntaxTheme={syntaxTheme} 
                            />
                        )}
                        {finding.learnMoreUrl && (
                            <div className="mt-4">
                                <a href={finding.learnMoreUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-light-accent dark:text-dark-accent hover:underline">
                                    Learn More &rarr;
                                </a>
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                 <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-light-accent dark:bg-dark-accent text-white' : 'bg-light-fill-primary dark:bg-dark-fill-primary text-light-label-primary dark:text-dark-label-primary'}`}>
                    <MarkdownContent content={msg.content as string} theme={theme} />
                 </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && hasContent && (
             <div className="flex items-center p-4 animate-fade-in">
                <Spinner className="h-6 w-6" />
                <p className="ml-3 text-sm text-light-label-secondary dark:text-dark-label-secondary">AI is thinking...</p>
            </div>
        )}
        {isChatting && (
            <div className="flex justify-start">
                <div className="p-3.5 rounded-2xl bg-light-fill-primary dark:bg-dark-fill-primary">
                    <Spinner className="h-6 w-6" />
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl rounded-2xl shadow-lg h-full flex flex-col border border-light-separator dark:border-dark-separator">
        <div className="p-3 border-b border-light-separator dark:border-dark-separator sticky top-0 z-10 flex items-center justify-between h-16">
          <h2 className="text-base font-semibold text-light-label-primary dark:text-dark-label-primary">AI Assistant</h2>
           {(conversation.length > 0 && !isLoading) && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 rounded-full hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary text-light-label-secondary dark:text-dark-label-secondary"
              aria-label="Export review"
            >
              <DownloadIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
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
        projectFiles={projectFiles}
        language={language}
        theme={theme}
      />
    </>
  );
};

export default ReviewOutput;