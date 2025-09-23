import React, { useState } from 'react';
import type { ProjectFile, InputMode } from '../App';
import { SUPPORTED_LANGUAGES, REVIEW_FOCUS_AREAS } from '../constants';
import LanguageDisplay from './LanguageDisplay';
import FocusSelector from './FocusSelector';
import PersonaSelector from './PersonaSelector';
import ProjectImportModal from './ProjectImportModal';
import FileExplorer from './FileExplorer';
import { UploadIcon } from './icons/UploadIcon';
import Spinner from './Spinner';
import { MenuIcon } from './icons/MenuIcon';
import { CodeIcon } from './icons/CodeIcon';
import LanguageIcon from './LanguageIcon';
import { PlusIcon } from './icons/PlusIcon';

interface CodeInputProps {
  inputMode: InputMode;
  code: string;
  onCodeChange: (code: string) => void;
  projectFiles: ProjectFile[];
  activeFile: ProjectFile | undefined;
  onFileSelect: (path: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  language: string;
  focusAreas: string[];
  onFocusAreaChange: (areas: string[]) => void;
  persona: string;
  onPersonaChange: (persona: string) => void;
  onReview: () => void;
  isLoading: boolean;
  onProjectImport: (files: ProjectFile[]) => void;
  onMenuClick: () => void;
  onNewReview: () => void;
}

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const CodeInput: React.FC<CodeInputProps> = ({
  inputMode,
  code,
  onCodeChange,
  projectFiles,
  activeFile,
  onFileSelect,
  onFileContentChange,
  language,
  focusAreas,
  onFocusAreaChange,
  persona,
  onPersonaChange,
  onReview,
  isLoading,
  onProjectImport,
  onMenuClick,
  onNewReview,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (inputMode === 'project' && activeFile) {
      onFileContentChange(activeFile.path, e.target.value);
    } else if (inputMode === 'snippet') {
      onCodeChange(e.target.value);
    }
  };
  
  const handleProjectImportSuccess = (files: ProjectFile[]) => {
    onProjectImport(files);
    setIsImportModalOpen(false);
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onNewReview(); // Resets to snippet mode
        onCodeChange(content);
        // Language will be auto-detected by App.tsx effect
      };
      reader.readAsText(file);
    }
    event.target.value = ''; // Reset file input
  };
  
  const canRunActions = inputMode === 'snippet' ? code.trim().length > 0 : projectFiles.length > 0;

  return (
    <>
      <div className="bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl rounded-2xl shadow-lg flex flex-col border border-light-separator dark:border-dark-separator overflow-hidden h-full">
        <header className="p-3 border-b border-light-separator dark:border-dark-separator flex items-center justify-between flex-wrap gap-2 h-16">
            <div className="flex items-center gap-2">
                <button onClick={onMenuClick} className="lg:hidden p-2 -ml-1 rounded-full text-light-label-secondary dark:text-dark-label-secondary hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary">
                    <MenuIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-light-accent/10 dark:bg-dark-accent/20 p-2 rounded-lg flex-shrink-0">
                        <CodeIcon className="h-6 w-6 text-light-accent dark:text-dark-accent" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-light-label-primary dark:text-dark-label-primary whitespace-nowrap">
                            AI Code Reviewer
                        </h1>
                        <p className="text-sm text-light-label-secondary dark:text-dark-label-secondary -mt-0.5">
                          {inputMode === 'project' ? 'Project Input' : 'Code Snippet'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {inputMode === 'snippet' && (
                    <>
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />
                        <label htmlFor="file-upload" className="flex items-center gap-2 bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary text-light-label-secondary dark:text-dark-label-secondary font-medium py-1.5 px-3 rounded-full transition-colors text-xs cursor-pointer">
                            <UploadIcon className="h-4 w-4" />
                            Upload
                        </label>
                    </>
                )}
                <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary text-light-label-secondary dark:text-dark-label-secondary font-medium py-1.5 px-3 rounded-full transition-colors text-xs"
                >
                <PlusIcon className="h-4 w-4" />
                Import
                </button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {inputMode === 'project' ? (
             <>
                <div className="w-48 xl:w-56 bg-light-bg-elevated/60 dark:bg-dark-bg-elevated/60 border-r border-light-separator dark:border-dark-separator flex-shrink-0 overflow-y-auto">
                    {projectFiles.length > 0 ? (
                        <FileExplorer files={projectFiles} activeFile={activeFile?.path || null} onSelectFile={onFileSelect} />
                    ) : (
                        <div className="p-4 text-center text-sm text-light-label-secondary dark:text-dark-label-secondary h-full flex flex-col items-center justify-center">
                            <CodeIcon className="h-10 w-10 mb-2" />
                            <p>Import a project to get started.</p>
                        </div>
                    )}
                </div>
                <div className="flex-1 flex flex-col">
                    {activeFile ? (
                    <>
                        <div className="flex-shrink-0 p-2.5 border-b border-light-separator dark:border-dark-separator flex items-center gap-2">
                        <LanguageIcon language={language} className="h-4 w-4" />
                        <span className="font-mono text-sm text-light-label-secondary dark:text-dark-label-secondary">{activeFile.path}</span>
                        </div>
                        <div className="flex-1 relative">
                        <textarea
                            value={activeFile.content}
                            onChange={handleTextChange}
                            className="w-full h-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm leading-6 text-light-label-primary dark:text-dark-label-secondary absolute inset-0"
                            placeholder="File content will appear here..."
                            spellCheck="false"
                        />
                        </div>
                    </>
                    ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-light-label-secondary dark:text-dark-label-secondary">
                        <p>Select a file to view its content.</p>
                    </div>
                    )}
                </div>
            </>
          ) : (
            <textarea
                value={code}
                onChange={handleTextChange}
                className="w-full h-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm leading-6 text-light-label-primary dark:text-dark-label-secondary"
                placeholder="Paste your code here..."
                spellCheck="false"
            />
          )}
        </div>

        <footer className="p-3 border-t border-light-separator dark:border-dark-separator flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap justify-center">
            <LanguageDisplay language={language} />
             <FocusSelector
              options={REVIEW_FOCUS_AREAS}
              selectedOptions={focusAreas}
              onChange={onFocusAreaChange}
            />
            <PersonaSelector selectedPersona={persona} onPersonaChange={onPersonaChange}/>
          </div>
          
           <div className="flex items-center gap-2">
              <button
                onClick={onReview}
                disabled={isLoading || !canRunActions}
                className="flex-1 sm:flex-auto flex items-center justify-center gap-2 bg-light-accent dark:bg-dark-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-wait text-white font-bold py-2.5 px-5 rounded-full transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Spinner className="h-5 w-5" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 -ml-1" />
                    Run Review
                  </>
                )}
              </button>
          </div>
        </footer>
      </div>
      <ProjectImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onProjectImport={handleProjectImportSuccess}
      />
    </>
  );
};

export default CodeInput;