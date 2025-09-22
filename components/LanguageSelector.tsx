import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import LanguageIcon from './LanguageIcon';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
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
  
  const handleSelect = (langValue: string) => {
    onLanguageChange(langValue);
    setIsOpen(false);
  }

  const getButtonText = () => {
    return SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.label || 'Select Language';
  };

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full sm:w-44 bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary text-light-label-primary dark:text-dark-label-primary font-medium py-2 px-3 rounded-full transition-colors duration-200 text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <CodeBracketIcon className="h-4 w-4 mr-2 text-light-label-secondary dark:text-dark-label-secondary"/>
        <span className="flex-grow text-left truncate">{getButtonText()}</span>
        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform duration-200 text-light-label-tertiary dark:text-dark-label-tertiary ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full sm:w-64 bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl border border-light-separator dark:border-dark-separator rounded-xl shadow-xl z-10 animate-slide-up-fade">
          <div className="p-2">
            <div className="px-2 pt-1 pb-2">
                <p className="text-xs font-semibold text-light-label-secondary dark:text-dark-label-secondary uppercase">Project Language</p>
            </div>
            <ul role="listbox" className="max-h-60 overflow-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <li
                  key={lang.value}
                  onClick={() => handleSelect(lang.value)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary"
                  role="option"
                  aria-selected={selectedLanguage === lang.value}
                >
                    <div className="flex items-center gap-3">
                        <LanguageIcon language={lang.value} className="h-5 w-5 text-light-label-secondary dark:text-dark-label-secondary" />
                        <span className="font-medium text-sm text-light-label-primary dark:text-dark-label-primary">{lang.label}</span>
                    </div>
                  {selectedLanguage === lang.value && <CheckIcon className="h-5 w-5 text-light-accent dark:text-dark-accent" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;