import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import type { ProjectFile } from '../App';
import { XIcon } from './icons/XIcon';
import { ZipIcon } from './icons/ZipIcon';
import { GitIcon } from './icons/GitIcon';
import Spinner from './Spinner';

interface ProjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectImport: (files: ProjectFile[]) => void;
}

const ProjectImportModal: React.FC<ProjectImportModalProps> = ({ isOpen, onClose, onProjectImport }) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'git'>('zip');
  const [gitUrl, setGitUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    // Delay state reset to allow for closing animation
    setTimeout(() => {
        setIsLoading(false);
        setError(null);
        setGitUrl('');
        setActiveTab('zip');
    }, 300);
  };

  const handleZipFile = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const zip = await JSZip.loadAsync(file);
      const projectFiles: ProjectFile[] = [];
      const promises: Promise<void>[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async('string').then(content => {
            if (!relativePath.startsWith('__MACOSX/') && !relativePath.endsWith('.DS_Store')) {
               projectFiles.push({ path: relativePath, content });
            }
          });
          promises.push(promise);
        }
      });

      await Promise.all(promises);
      if (projectFiles.length > 0) {
        onProjectImport(projectFiles);
      } else {
        setError("No valid files found in the ZIP archive.");
      }
    } catch (e) {
      console.error(e);
      setError('Failed to process ZIP file. Please ensure it is a valid .zip archive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleZipFile(file);
    event.target.value = '';
  };
  
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type === "application/zip" || file.type === "application/x-zip-compressed")) {
      handleZipFile(file);
    } else {
      setError("Please drop a valid .zip file.");
    }
  }, [onProjectImport]);
  
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleGitImport = async () => {
    if (!gitUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/import-git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gitUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to import repository (HTTP ${response.status})`);
      }

      if (data.length === 0) {
        setError("No usable text files found in the repository.");
        setIsLoading(false);
        return;
      }
      
      onProjectImport(data);

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred during import.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose}></div>
      <div className="relative z-10 w-full max-w-lg bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-light-separator dark:border-dark-separator overflow-hidden animate-slide-up-fade">
        <header className="flex items-center justify-between p-4 border-b border-light-separator dark:border-dark-separator flex-shrink-0">
          <h2 className="text-lg font-semibold text-light-label-primary dark:text-dark-label-primary">Import Project</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary text-light-label-secondary dark:text-dark-label-secondary" aria-label="Close import dialog">
            <XIcon className="h-5 w-5" />
          </button>
        </header>
        
        <div className="p-3 border-b border-light-separator dark:border-dark-separator">
            <div className="flex bg-light-fill-primary dark:bg-dark-fill-primary rounded-full p-1 text-sm font-semibold">
                <button 
                    onClick={() => setActiveTab('zip')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full transition-colors ${activeTab === 'zip' ? 'bg-white dark:bg-dark-fill-secondary text-light-label-primary dark:text-dark-label-primary shadow-sm' : 'text-light-label-secondary dark:text-dark-label-secondary'}`}
                >
                    <ZipIcon className="h-5 w-5" /> Upload .ZIP
                </button>
                 <button 
                    onClick={() => setActiveTab('git')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full transition-colors ${activeTab === 'git' ? 'bg-white dark:bg-dark-fill-secondary text-light-label-primary dark:text-dark-label-primary shadow-sm' : 'text-light-label-secondary dark:text-dark-label-secondary'}`}
                >
                    <GitIcon className="h-5 w-5" /> From GitHub
                </button>
            </div>
        </div>

        <main className="p-6 min-h-[250px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Spinner />
              <p className="mt-4 text-light-label-secondary dark:text-dark-label-secondary">Importing project...</p>
            </div>
          ) : (
            <>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>}
              
              {activeTab === 'zip' && (
                  <div 
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      className="border-2 border-dashed border-light-separator dark:border-dark-separator rounded-xl p-8 text-center cursor-pointer hover:border-light-accent dark:hover:border-dark-accent hover:bg-light-fill-primary/50 dark:hover:bg-dark-fill-primary/50 transition-colors"
                      onClick={() => document.getElementById('zip-upload')?.click()}
                  >
                    <input type="file" id="zip-upload" accept=".zip,application/zip,application/x-zip-compressed" onChange={handleFileChange} className="hidden" />
                    <ZipIcon className="h-12 w-12 mx-auto text-light-label-tertiary dark:text-dark-label-tertiary mb-4" />
                    <p className="font-semibold text-light-label-primary dark:text-dark-label-primary">Drop your .zip file here</p>
                    <p className="text-sm text-light-label-secondary dark:text-dark-label-secondary mt-1">or click to browse</p>
                  </div>
              )}

              {activeTab === 'git' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="git-url" className="block text-sm font-medium text-light-label-secondary dark:text-dark-label-secondary mb-2">
                        Public GitHub Repository URL
                    </label>
                    <div className="relative">
                        <GitIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-light-label-tertiary dark:text-dark-label-tertiary"/>
                        <input
                            type="text"
                            id="git-url"
                            value={gitUrl}
                            onChange={(e) => setGitUrl(e.target.value)}
                            placeholder="https://github.com/owner/repo"
                            className="w-full bg-light-fill-primary dark:bg-dark-fill-primary rounded-lg border-2 border-transparent focus:border-light-accent dark:focus:border-dark-accent focus:ring-0 pl-10 pr-4 py-2 transition-colors"
                        />
                    </div>
                  </div>
                  <button
                    onClick={handleGitImport}
                    className="w-full flex items-center justify-center gap-2 bg-light-accent dark:bg-dark-accent hover:opacity-90 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-full transition-all duration-200"
                  >
                    Import from URL
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectImportModal;