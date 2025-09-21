import React, { useMemo } from 'react';
import * as Diff from 'https://esm.sh/diff@5.2.0';
import type { Theme } from '../App';
import { XIcon } from './icons/XIcon';
import { ApplyIcon } from './icons/ApplyIcon';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  beforeCode: string;
  afterCode: string;
  language: string;
  theme: Theme;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  onApply,
  beforeCode,
  afterCode,
  theme,
}) => {
  const diff = useMemo(() => {
    return Diff.diffLines(beforeCode, afterCode);
  }, [beforeCode, afterCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4" style={{ animationDuration: '0.2s' }}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-[95vw] max-w-4xl h-full max-h-[90vh] bg-ios-light-panel dark:bg-ios-dark-panel rounded-2xl shadow-2xl flex flex-col border border-ios-light-tertiary dark:border-ios-dark-tertiary/50 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-ios-light-header dark:border-ios-dark-header flex-shrink-0">
          <h2 className="text-lg font-semibold text-ios-light-text-primary dark:text-white">
            Preview Changes
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-ios-light-header dark:hover:bg-ios-dark-header text-ios-light-text-secondary dark:text-ios-dark-secondary"
            aria-label="Close preview"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-grow overflow-y-auto p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
            <code>
              {diff.map((part, partIndex) => {
                const isAdded = part.added;
                const isRemoved = part.removed;
                
                let bgColor = 'transparent';
                if (isAdded) bgColor = theme === 'dark' ? 'rgba(46, 139, 87, 0.15)' : 'rgba(220, 252, 231, 1)';
                if (isRemoved) bgColor = theme === 'dark' ? 'rgba(139, 0, 0, 0.2)' : 'rgba(254, 226, 226, 1)';
                
                let textColor = theme === 'dark' ? '#E2E8F0' : '#334155';
                if (isAdded) textColor = theme === 'dark' ? '#6EE7B7' : '#15803D';
                if (isRemoved) textColor = theme === 'dark' ? '#FCA5A5' : '#B91C1C';


                const lines = part.value.split('\n').filter((line, index, arr) => line || index < arr.length -1);
                
                return lines.map((line, lineIndex) => (
                   <div
                    key={`${partIndex}-${lineIndex}`}
                    className="flex"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span
                      className="w-8 text-center flex-shrink-0 select-none"
                      style={{ color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}
                    >
                      {isAdded ? '+' : isRemoved ? '-' : ' '}
                    </span>
                    <span style={{color: textColor}}>{line}</span>
                  </div>
                ));
              })}
            </code>
          </pre>
        </main>

        <footer className="flex items-center justify-center sm:justify-end flex-wrap gap-4 p-4 border-t border-ios-light-header dark:border-ios-dark-header flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-primary dark:text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center gap-2"
          >
            <ApplyIcon className="h-5 w-5" />
            Apply Changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PreviewModal;