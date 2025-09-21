import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface FocusSelectorProps {
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

const FocusSelector: React.FC<FocusSelectorProps> = ({ options, selectedOptions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleToggleOption = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    onChange(newSelected);
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  }

  const getButtonText = () => {
    if (selectedOptions.length === 0) return 'General Review';
    if (selectedOptions.length === 1) return selectedOptions[0];
    return `${selectedOptions.length} Areas Selected`;
  };

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full sm:w-52 bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-primary dark:text-white font-medium py-3 px-4 rounded-full transition-colors duration-200 text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <SparklesIcon className="h-4 w-4 mr-2 text-cyan-500"/>
        <span className="flex-grow text-left truncate">{getButtonText()}</span>
        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-64 bg-ios-light-panel dark:bg-ios-dark-panel border border-ios-light-tertiary dark:border-ios-dark-tertiary/50 rounded-2xl shadow-xl z-10 animate-fade-in" style={{ animationDuration: '0.2s'}}>
          <div className="p-2">
            <div className="flex justify-between items-center px-2 pt-1 pb-2">
                <p className="text-xs font-semibold text-ios-light-text-secondary dark:text-ios-dark-secondary uppercase">Focus Review On</p>
                {selectedOptions.length > 0 && (
                    <button onClick={handleClear} className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline">Clear</button>
                )}
            </div>
            <ul role="listbox" className="max-h-60 overflow-auto">
              {options.map((option) => (
                <li
                  key={option}
                  onClick={() => handleToggleOption(option)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-ios-light-header dark:hover:bg-ios-dark-header"
                  role="option"
                  aria-selected={selectedOptions.includes(option)}
                >
                  <span className="font-medium text-sm text-ios-light-text-primary dark:text-white">{option}</span>
                  {selectedOptions.includes(option) && <CheckIcon className="h-5 w-5 text-cyan-500" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusSelector;
