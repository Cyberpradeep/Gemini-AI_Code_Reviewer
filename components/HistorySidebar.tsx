import React from 'react';
import type { ReviewHistoryItem, Theme } from '../App';
import { PlusIcon } from './icons/PlusIcon';
import { ThemeToggle } from './ThemeToggle';
import LanguageIcon from './LanguageIcon';

interface Language {
  value: string;
  label: string;
}

interface HistorySidebarProps {
  history: ReviewHistoryItem[];
  languages: Language[];
  selectedId: string | null;
  onSelectItem: (id: string) => void;
  onNewReview: () => void;
  isOpen: boolean;
  onToggle: () => void;
  theme: Theme;
  onThemeToggle: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  history, languages, selectedId, onSelectItem, onNewReview, isOpen, onToggle, theme, onThemeToggle 
}) => {
  const getLanguageLabel = (value: string) => {
    return languages.find(l => l.value === value)?.label || value;
  };

  return (
    <>
      {/* Backdrop for mobile, which also closes the sidebar */}
      <div 
        className={`fixed inset-0 bg-black/20 z-30 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
        aria-hidden="true"
      ></div>

      {/* Sidebar container */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-ios-light-header/80 dark:bg-ios-dark-header/80 backdrop-blur-xl z-40
                         border-r border-ios-light-tertiary/70 dark:border-ios-dark-tertiary/70
                         transition-transform duration-300 ease-in-out
                         lg:static lg:w-80 lg:bg-ios-light-bg lg:dark:bg-black lg:border-r lg:border-ios-light-header lg:dark:border-ios-dark-panel lg:backdrop-blur-none
                         ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center justify-between flex-shrink-0 lg:p-5 lg:pt-6">
              <h1 className="text-2xl font-bold text-ios-light-text-primary dark:text-white ml-2">History</h1>
          </div>

          {/* New Review Button */}
          <div className="px-4 pb-2 flex-shrink-0">
            <button
                onClick={onNewReview}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 text-base shadow-md"
                aria-label="Start a new review"
            >
                <PlusIcon className="h-5 w-5" />
                New Review
            </button>
          </div>

          {/* History List */}
          <div className="flex-grow overflow-y-auto px-4 py-4">
            {history.length === 0 ? (
              <div className="text-center text-ios-light-text-secondary dark:text-ios-dark-secondary px-4 py-8">
                <p className="text-sm">Your previous code reviews will be saved here.</p>
              </div>
            ) : (
              <div className="bg-ios-light-panel dark:bg-ios-dark-panel rounded-xl shadow-inner">
                 <ul className="divide-y divide-ios-light-header dark:divide-ios-dark-header">
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => onSelectItem(item.id)}
                        className={`w-full text-left p-3 transition-colors duration-150 flex items-center gap-4 ${
                          selectedId === item.id
                            ? 'bg-cyan-600'
                            : 'hover:bg-ios-light-header/50 dark:hover:bg-ios-dark-header/50'
                        }`}
                      >
                        <div className={`flex-shrink-0 rounded-lg p-2 ${selectedId === item.id ? 'bg-white/20' : 'bg-ios-light-header dark:bg-ios-dark-header'}`}>
                           <LanguageIcon language={item.language} className={`h-6 w-6 ${selectedId === item.id ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'}`} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className={`font-semibold truncate ${selectedId === item.id ? 'text-white' : 'text-ios-light-text-primary dark:text-white'}`}>{getLanguageLabel(item.language)}</p>
                           <p className={`text-xs mt-1 truncate ${selectedId === item.id ? 'text-cyan-100' : 'text-ios-light-text-secondary dark:text-ios-dark-secondary'}`}>
                              {new Date(item.timestamp).toLocaleString()}
                           </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer with Theme Toggle */}
          <div className="p-4 flex-shrink-0">
             <div className="bg-ios-light-panel dark:bg-ios-dark-panel rounded-xl p-2 shadow-inner">
                <ThemeToggle theme={theme} onToggle={onThemeToggle} />
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;