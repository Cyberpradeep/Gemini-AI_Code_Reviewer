import React from 'react';
import type { HistoryItem, Theme } from '../App';
import { ThemeToggle } from './ThemeToggle';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { PlusIcon } from './icons/PlusIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import LanguageIcon from './LanguageIcon';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ProjectIcon } from './icons/ProjectIcon';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onLoad,
  onDelete,
  onNew,
  theme,
  onToggleTheme,
}) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>
      <aside
        className={`bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl border-r border-light-separator dark:border-dark-separator flex flex-col h-full w-64 md:w-72 transition-transform duration-300 ease-in-out z-40 fixed lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-light-separator dark:border-dark-separator flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-light-label-primary dark:text-dark-label-primary">History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full lg:hidden text-light-label-secondary dark:text-dark-label-secondary hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-2">
            <button
                onClick={onNew}
                className="w-full flex items-center justify-center gap-2 bg-light-accent dark:bg-dark-accent hover:opacity-90 text-white font-semibold py-2 px-3 rounded-lg transition-opacity text-sm"
            >
                <PlusIcon className="h-5 w-5" /> New Review
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
          {history.length > 0 && (
             <div className="px-2 pt-4 pb-1">
                <p className="text-xs font-semibold text-light-label-secondary dark:text-dark-label-secondary uppercase">Recent</p>
            </div>
          )}
          {history.map(item => {
            const isProject = item.inputMode === 'project';
            const title = isProject 
              ? item.projectFiles[0]?.path.split('/')[0] || 'Project Review'
              : `${SUPPORTED_LANGUAGES.find(l => l.value === item.language)?.label || 'Code'} Snippet`;
            
            return (
              <div key={item.id} className="group relative rounded-md">
                <button
                  onClick={() => onLoad(item)}
                  className="w-full text-left p-2 rounded-md hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                      {isProject ? (
                          <ProjectIcon className="h-5 w-5 flex-shrink-0 text-light-label-secondary dark:text-dark-label-secondary"/>
                      ) : (
                          <LanguageIcon language={item.language} className="h-5 w-5 flex-shrink-0 text-light-label-secondary dark:text-dark-label-secondary"/>
                      )}
                      <div className="flex-1 truncate">
                          <p className="font-medium text-sm truncate text-light-label-primary dark:text-dark-label-primary">
                            {title}
                          </p>
                          <p className="text-xs text-light-label-secondary dark:text-dark-label-secondary">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                      </div>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full text-light-label-secondary dark:text-dark-label-secondary hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity"
                  aria-label="Delete history item"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {history.length === 0 && (
            <div className="p-4 text-center text-sm text-light-label-secondary dark:text-dark-label-secondary flex flex-col items-center justify-center h-full">
                <HistoryIcon className="h-10 w-10 mb-2" />
                <p>No past reviews found.</p>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-light-separator dark:border-dark-separator">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;