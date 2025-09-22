import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import type { ProjectFile } from '../App';
import { XIcon } from './icons/XIcon';
import { ZipIcon } from './icons/ZipIcon';
import Spinner from './Spinner';

interface ProjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectImport: (files: ProjectFile[]) => void;
}

const ProjectImportModal: React.FC<ProjectImportModalProps> = ({ isOpen, onClose, onProjectImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            // Basic filter for unwanted files often found in zips
            if (!relativePath.startsWith('__MACOSX/') && !relativePath.endsWith('.DS_Store')) {
               projectFiles.push({ path: relativePath, content });
            }
          });
          promises.push(promise);
        }
      });

      await Promise.all(promises);
      onProjectImport(projectFiles);
    } catch (e) {
      console.error(e);
      setError('Failed to process ZIP file. Please ensure it is a valid .zip archive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleZipFile(file);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-lg bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-light-separator dark:border-dark-separator overflow-hidden animate-slide-up-fade">
        <header className="flex items-center justify-between p-4 border-b border-light-separator dark:border-dark-separator flex-shrink-0">
          <h2 className="text-lg font-semibold text-light-label-primary dark:text-dark-label-primary">Import Project from .ZIP</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary text-light-label-secondary dark:text-dark-label-secondary" aria-label="Close import dialog">
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="p-6">
          {isLoading ? (
            <div className="h-48 flex flex-col items-center justify-center">
              <Spinner />
              <p className="mt-4 text-light-label-secondary dark:text-dark-label-secondary">Importing project...</p>
            </div>
          ) : (
            <>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>}
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectImportModal;