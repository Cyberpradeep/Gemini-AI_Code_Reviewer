import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckIcon } from './icons/CheckIcon';
import { UserIcon } from './icons/UserIcon';
import { AI_PERSONAS } from '../constants';

interface PersonaSelectorProps {
  selectedPersona: string;
  onPersonaChange: (persona: string) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ selectedPersona, onPersonaChange }) => {
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
  
  const handleSelect = (personaValue: string) => {
    onPersonaChange(personaValue);
    setIsOpen(false);
  }

  const getButtonText = () => {
    return AI_PERSONAS.find(p => p.value === selectedPersona)?.label || 'Select Persona';
  };

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full sm:w-44 bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary text-light-label-primary dark:text-dark-label-primary font-medium py-2 px-3 rounded-full transition-colors duration-200 text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <UserIcon className="h-4 w-4 mr-2 text-light-label-secondary dark:text-dark-label-secondary"/>
        <span className="flex-grow text-left truncate">{getButtonText()}</span>
        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform duration-200 text-light-label-tertiary dark:text-dark-label-tertiary ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full sm:w-64 bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl border border-light-separator dark:border-dark-separator rounded-xl shadow-xl z-10 animate-slide-up-fade">
          <div className="p-2">
            <div className="px-2 pt-1 pb-2">
                <p className="text-xs font-semibold text-light-label-secondary dark:text-dark-label-secondary uppercase">AI Persona</p>
            </div>
            <ul role="listbox" className="max-h-60 overflow-auto">
              {AI_PERSONAS.map((persona) => (
                <li
                  key={persona.value}
                  onClick={() => handleSelect(persona.value)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary"
                  role="option"
                  aria-selected={selectedPersona === persona.value}
                >
                  <span className="font-medium text-sm text-light-label-primary dark:text-dark-label-primary">{persona.label}</span>
                  {selectedPersona === persona.value && <CheckIcon className="h-5 w-5 text-light-accent dark:text-dark-accent" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaSelector;