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
  filePath?: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  onApply,
  beforeCode,
  afterCode,
  theme,
  filePath
}) => {
  const diff = useMemo(() => {
    return Diff.diffLines(beforeCode, afterCode);
  }, [beforeCode, afterCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-[95vw] max-w-4xl h-full max-h-[90vh] bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-light-separator dark:border-dark-separator overflow-hidden animate-slide-up-fade">
        <header className="flex items-center justify-between p-4 border-b border-light-separator dark:border-dark-separator flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-light-label-primary dark:text-dark-label-primary">
              Preview Changes
            </h2>
            {filePath && <p className="text-xs font-mono text-light-accent dark:text-dark-accent mt-1">{filePath}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary text-light-label-secondary dark:text-dark-label-secondary"
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

        <footer className="flex items-center justify-center sm:justify-end flex-wrap gap-4 p-4 border-t border-light-separator dark:border-dark-separator flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary text-light-label-primary dark:text-dark-label-primary font-bold py-2 px-4 rounded-full transition-colors"
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