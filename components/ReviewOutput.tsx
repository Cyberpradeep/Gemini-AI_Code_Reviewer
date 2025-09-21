import React from 'react';
import Spinner from './Spinner';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15.5.0';
import { vscDarkPlus, vs } from 'https://esm.sh/react-syntax-highlighter@15.5.0/dist/esm/styles/prism';
import type { Theme } from '../App';


interface ReviewOutputProps {
  review: string;
  isLoading: boolean;
  error: string | null;
  selectedHistoryId: string | null;
  theme: Theme;
}

const ReviewOutput: React.FC<ReviewOutputProps> = ({ review, isLoading, error, selectedHistoryId, theme }) => {
  const contentKey = isLoading 
    ? 'loading' 
    : error 
    ? 'error' 
    : selectedHistoryId || (review ? 'new-review' : 'placeholder');

  const syntaxTheme = theme === 'dark' ? vscDarkPlus : vs;
  const codeBgColor = theme === 'dark' ? '#1C1C1E' : '#F9F9F9';
  const codeHeaderBgColor = theme === 'dark' ? 'bg-ios-dark-header' : 'bg-ios-light-header';
  const codeBorderColor = theme === 'dark' ? 'border-ios-dark-tertiary/50' : 'border-ios-light-tertiary';


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-ios-light-text-secondary dark:text-ios-dark-secondary">
          <Spinner />
          <p className="mt-4 text-lg">AI is reviewing your code...</p>
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

    if (!review) {
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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-5 pb-3 border-b border-ios-light-header dark:border-ios-dark-header" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-8 mb-4 pb-2 border-b border-ios-light-header dark:border-ios-dark-header" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-6 mb-3 text-cyan-600 dark:text-cyan-400" {...props} />,
            p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-ios-light-text-secondary dark:text-gray-300" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-outside mb-4 pl-6 space-y-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-outside mb-4 pl-6 space-y-2" {...props} />,
            li: ({node, ...props}) => <li className="mb-1" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 my-4 bg-ios-light-header dark:bg-ios-dark-header text-ios-light-text-secondary dark:text-gray-300 italic" {...props} />,
            code: ({node, inline, className, children, ...props}) => {
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match) {
                return (
                  <div className={`bg-black/5 dark:bg-black rounded-xl my-4 border ${codeBorderColor} overflow-hidden text-sm`}>
                    <div className={`${codeHeaderBgColor} text-ios-light-text-primary dark:text-white px-4 py-2 text-xs font-sans font-medium flex justify-between items-center`}>
                        <span className="capitalize">{match[1]}</span>
                    </div>
                    <SyntaxHighlighter
                        style={syntaxTheme}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, padding: '1.25rem', backgroundColor: codeBgColor }}
                        codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return (
                <code className="bg-ios-light-header dark:bg-ios-dark-header text-cyan-700 dark:text-cyan-300 rounded-md px-1.5 py-1 font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
            {review}
        </ReactMarkdown>
    );
  };

  return (
    <div className="bg-ios-light-panel dark:bg-ios-dark-panel rounded-2xl shadow-lg h-full overflow-y-auto border border-ios-light-tertiary dark:border-ios-dark-tertiary/50">
      <div className="p-4 border-b border-ios-light-header dark:border-ios-dark-header sticky top-0 bg-ios-light-panel/80 dark:bg-ios-dark-panel/80 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-ios-light-text-primary dark:text-white">Code Review</h2>
      </div>
      <div className="p-6 prose prose-invert max-w-none prose-p:text-ios-light-text-primary dark:prose-p:text-gray-300">
        <div key={contentKey} className="animate-fade-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReviewOutput;