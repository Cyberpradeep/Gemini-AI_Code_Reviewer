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
        className="flex items-center justify-between w-full sm:w-52 bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-primary dark:text-white font-medium py-3 px-4 rounded-full transition-colors duration-200 text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <UserIcon className="h-4 w-4 mr-2 text-cyan-500"/>
        <span className="flex-grow text-left truncate">{getButtonText()}</span>
        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full sm:w-64 bg-ios-light-panel dark:bg-ios-dark-panel border border-ios-light-tertiary dark:border-ios-dark-tertiary/50 rounded-2xl shadow-xl z-10 animate-fade-in" style={{ animationDuration: '0.2s'}}>
          <div className="p-2">
            <div className="px-2 pt-1 pb-2">
                <p className="text-xs font-semibold text-ios-light-text-secondary dark:text-ios-dark-secondary uppercase">AI Persona</p>
            </div>
            <ul role="listbox" className="max-h-60 overflow-auto">
              {AI_PERSONAS.map((persona) => (
                <li
                  key={persona.value}
                  onClick={() => handleSelect(persona.value)}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-ios-light-header dark:hover:bg-ios-dark-header"
                  role="option"
                  aria-selected={selectedPersona === persona.value}
                >
                  <span className="font-medium text-sm text-ios-light-text-primary dark:text-white">{persona.label}</span>
                  {selectedPersona === persona.value && <CheckIcon className="h-5 w-5 text-cyan-500" />}
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
