import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import FocusSelector from './FocusSelector';
import PersonaSelector from './PersonaSelector';
import { REVIEW_FOCUS_AREAS } from '../constants';
import type { AiAction } from '../App';

interface Language {
  value: string;
  label: string;
}

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  languages: Language[];
  onAiAction: (action: AiAction) => void;
  isLoading: boolean;
  reviewFocus: string[];
  setReviewFocus: (focus: string[]) => void;
  persona: string;
  setPersona: (persona: string) => void;
}

const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  cpp: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  rb: 'ruby',
  php: 'php',
  html: 'html',
  css: 'css',
  sql: 'sql',
};

const CodeInput: React.FC<CodeInputProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  languages,
  onAiAction,
  isLoading,
  reviewFocus,
  setReviewFocus,
  persona,
  setPersona,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCode(text);

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && languageMap[extension]) {
        const langValue = languageMap[extension];
        if (languages.some(l => l.value === langValue)) {
            setLanguage(langValue);
        }
      }
    };
    reader.onerror = (e) => {
        console.error("Failed to read file:", e);
    }
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`bg-ios-light-panel dark:bg-ios-dark-panel rounded-2xl shadow-lg flex flex-col h-full border border-ios-light-tertiary dark:border-ios-dark-tertiary/50 transition-opacity duration-300 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="p-4 border-b border-ios-light-header dark:border-ios-dark-header flex items-center justify-between flex-wrap gap-2 sm:gap-4">
        <h2 className="text-lg font-semibold text-ios-light-text-primary dark:text-white">Your Code</h2>
        <div className="flex items-center gap-2 flex-grow justify-end">
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".js,.jsx,.ts,.tsx,.py,.java,.cs,.go,.rs,.cpp,.h,.hpp,.rb,.php,.html,.css,.sql"
          />
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-primary dark:text-white font-medium py-2 px-3 rounded-full transition-colors duration-200 text-sm"
            aria-label="Upload a code file"
          >
            <UploadIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-ios-light-header dark:bg-ios-dark-header border-none text-ios-light-text-primary dark:text-white text-sm rounded-full focus:ring-2 focus:ring-cyan-500 block p-2 appearance-none pr-8"
            aria-label="Select programming language"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-ios-light-panel dark:bg-ios-dark-header">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-grow p-1">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here or upload a file..."
          className="w-full h-full bg-transparent text-ios-light-text-secondary dark:text-gray-300 font-mono resize-none focus:outline-none p-4 text-sm leading-relaxed min-h-[300px] sm:min-h-[400px]"
        />
      </div>
      <div className="p-4 border-t border-ios-light-header dark:border-ios-dark-header flex flex-col sm:flex-row items-center gap-4 flex-wrap">
        <FocusSelector 
          options={REVIEW_FOCUS_AREAS}
          selectedOptions={reviewFocus}
          onChange={setReviewFocus}
        />
        <PersonaSelector
          selectedPersona={persona}
          onPersonaChange={setPersona}
        />
        <div className="w-full flex items-center gap-2">
            <button
              onClick={() => onAiAction('review')}
              disabled={isLoading || !code.trim()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-ios-light-header dark:disabled:bg-ios-dark-header disabled:text-ios-light-text-secondary dark:disabled:text-ios-dark-secondary disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-full transition-colors duration-200 flex items-center justify-center text-base"
            >
              {isLoading ? 'Analyzing...' : 'Review Code'}
            </button>
            <button
              onClick={() => onAiAction('test')}
              disabled={isLoading || !code.trim()}
              className="px-4 py-3 bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-primary dark:text-white font-medium rounded-full transition-colors duration-200 disabled:opacity-50"
              title="Generate Unit Tests"
            >
              Tests
            </button>
             <button
              onClick={() => onAiAction('docs')}
              disabled={isLoading || !code.trim()}
              className="px-4 py-3 bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-primary dark:text-white font-medium rounded-full transition-colors duration-200 disabled:opacity-50"
              title="Generate Documentation"
            >
              Docs
            </button>
        </div>
      </div>
    </div>
  );
};

export default CodeInput;
