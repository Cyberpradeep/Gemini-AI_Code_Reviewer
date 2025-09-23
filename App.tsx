import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Content } from "@google/genai";

import CodeInput from './components/CodeInput';
import ReviewOutput from './components/ReviewOutput';
import PreviewModal from './components/PreviewModal';
import { performCodeReview, sendFollowUpMessage, generateUnitTests, generateDocumentation } from './services/geminiService';
import { HISTORY_STORAGE_KEY, REVIEW_FOCUS_AREAS, AI_PERSONAS, SUPPORTED_LANGUAGES } from './constants';
import HistorySidebar from './components/HistorySidebar';

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ReviewFinding {
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  title: string;
  summary: string;
  filePath: string;
  suggestion?: {
    before: string;
    after: string;
  };
  learnMoreUrl?: string;
}

export type ChatMessage = {
  role: 'user' | 'model';
  content: string | ReviewFinding[];
  prompt?: string;
};

export type Theme = 'light' | 'dark';
export type InputMode = 'snippet' | 'project';

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputMode: InputMode;
  projectFiles: ProjectFile[]; // Used for both modes; snippet is a single file array
  conversation: ChatMessage[];
  language: string;
  persona: string;
  focusAreas: string[];
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Core state
  const [inputMode, setInputMode] = useState<InputMode>('snippet');
  const [code, setCode] = useState<string>(''); // For snippet mode
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]); // For project mode
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<Content[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review configuration
  const [language, setLanguage] = useState<string>('javascript');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [persona, setPersona] = useState<string>('mentor');
  
  // Modal states
  const [preview, setPreview] = useState<{ before: string; after: string; language: string; filePath?: string } | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);


  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
    
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  }, []);

  const saveToHistory = useCallback((updatedConversation: ChatMessage[], files: ProjectFile[]) => {
    if (files.length === 0 || updatedConversation.length === 0) return;

    // Ensure the conversation has content to save
    const firstMessage = updatedConversation[0];
    if(Array.isArray(firstMessage.content) && firstMessage.content.length === 0) return;
    
    const newItem: HistoryItem = {
      id: currentHistoryId || crypto.randomUUID(),
      timestamp: Date.now(),
      inputMode,
      projectFiles: files,
      conversation: updatedConversation,
      language,
      persona,
      focusAreas,
    };

    const newHistory = [newItem, ...history.filter(item => item.id !== newItem.id)];
    setHistory(newHistory);
    setCurrentHistoryId(newItem.id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
  }, [inputMode, language, persona, focusAreas, history, currentHistoryId]);

  const handleReview = useCallback(async () => {
    let filesToReview: ProjectFile[];

    if (inputMode === 'snippet') {
      if (code.trim() === '') {
        setError("Please enter some code to review.");
        return;
      }
      const extension = SUPPORTED_LANGUAGES.find(l => l.value === language)?.extensions[0] || 'txt';
      filesToReview = [{ path: `snippet.${extension}`, content: code }];
    } else {
      if (projectFiles.length === 0) {
        setError("Please import a project to review.");
        return;
      }
      filesToReview = projectFiles;
    }
    
    setIsLoading(true);
    setError(null);
    setConversation([]);
    setChatHistory([]);
    
    const personaInstruction = AI_PERSONAS.find(p => p.value === persona)?.instruction || '';
    let userPromptForHistory = '';
    const collectedFindings: ReviewFinding[] = [];

    try {
      // Initialize conversation for streaming UI
      setConversation([{ role: 'model', content: [] }]);

      const { userPrompt } = await performCodeReview(
          filesToReview, 
          focusAreas, 
          personaInstruction,
          (finding) => { // onChunkReceived callback
              collectedFindings.push(finding);
              setConversation(prev => {
                  const newConversation = [...prev];
                  const firstMessage = newConversation[0];
                  if (firstMessage && firstMessage.role === 'model' && Array.isArray(firstMessage.content)) {
                      // We are sure `content` is ReviewFinding[] here
                      firstMessage.content = [...(firstMessage.content as ReviewFinding[]), finding];
                  }
                  return newConversation;
              });
          }
      );
      userPromptForHistory = userPrompt;
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setConversation([]); // Clear partial results on error
    } finally {
      setIsLoading(false);
      // Save the complete conversation to history once streaming is done
      if (collectedFindings.length > 0) {
        const finalConversation: ChatMessage[] = [{ role: 'model', content: collectedFindings, prompt: userPromptForHistory }];
        saveToHistory(finalConversation, filesToReview);
      }
    }
  }, [inputMode, code, projectFiles, language, focusAreas, persona, saveToHistory]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // FIX: Explicitly create message objects to ensure correct typing and prevent type widening on the 'role' property.
    const userMessage: ChatMessage = { role: 'user', content: message };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setIsChatting(true);
    setError(null);
    
    try {
      const { response, updatedHistory } = await sendFollowUpMessage(message, chatHistory);
      const modelMessage: ChatMessage = { role: 'model', content: response };
      const finalConversation = [...newConversation, modelMessage];
      setConversation(finalConversation);
      setChatHistory(updatedHistory);
      // Determine files to save from current state
      const files = inputMode === 'project' ? projectFiles : [{ path: `snippet.${SUPPORTED_LANGUAGES.find(l => l.value === language)?.extensions[0] || 'txt'}`, content: code }];
      saveToHistory(finalConversation, files);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while sending the message.');
      setConversation(conversation); // Revert on error
    } finally {
      setIsChatting(false);
    }
  }, [conversation, chatHistory, saveToHistory, inputMode, projectFiles, code, language]);
  
  const handleGenerateAction = useCallback(async (action: 'test' | 'docs') => {
    let filesToReview: ProjectFile[];
    let targetPath: string;
    let targetContent: string;

    if (inputMode === 'snippet') {
        if (code.trim() === '') return;
        const extension = SUPPORTED_LANGUAGES.find(l => l.value === language)?.extensions[0] || 'txt';
        targetPath = `snippet.${extension}`;
        targetContent = code;
        filesToReview = [{ path: targetPath, content: targetContent }];
    } else {
        if (!activeFilePath) return;
        const file = projectFiles.find(f => f.path === activeFilePath);
        if (!file) return;
        targetPath = activeFilePath;
        targetContent = file.content;
        filesToReview = projectFiles;
    }

    setIsLoading(true);
    setError(null);
    setConversation([]);
    setChatHistory([]);

    const personaInstruction = AI_PERSONAS.find(p => p.value === persona)?.instruction || '';

    try {
      let result;
      if (action === 'test') {
        result = await generateUnitTests(targetContent, language, filesToReview, targetPath, personaInstruction);
      } else {
        result = await generateDocumentation(targetContent, language, filesToReview, targetPath, personaInstruction);
      }
      const newConversation: ChatMessage[] = [{ role: 'model', content: result.response, prompt: result.userPrompt }];
      setConversation(newConversation);
      saveToHistory(newConversation, filesToReview);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [inputMode, activeFilePath, language, persona, code, projectFiles, saveToHistory]);


  const handleApplyFix = useCallback((before: string, after: string, filePath?: string) => {
    const targetPath = filePath || (inputMode === 'project' ? activeFilePath : '');
    
    if (inputMode === 'project' && targetPath) {
        setProjectFiles(prevFiles => {
          return prevFiles.map(file => {
            if (file.path === targetPath) {
              return { ...file, content: file.content.replace(before, after) };
            }
            return file;
          });
        });
    } else if (inputMode === 'snippet') {
        setCode(prevCode => prevCode.replace(before, after));
    }
    setPreview(null);
  }, [activeFilePath, inputMode]);

  const handlePreviewFix = (before: string, after: string, lang: string, filePath?: string) => {
    setPreview({ before, after, language: lang, filePath });
  };
  
  const handleProjectImport = (files: ProjectFile[]) => {
    setProjectFiles(files);
    setActiveFilePath(files[0]?.path || null);
    setInputMode('project');
    setCode(''); // Clear snippet code
    
    const extensionCounts = files.reduce((acc, file) => {
      const ext = file.path.split('.').pop() || '';
      if (ext) {
        acc[ext] = (acc[ext] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostCommonExt = Object.keys(extensionCounts).sort((a,b) => extensionCounts[b] - extensionCounts[a])[0];
    const detectedLang = SUPPORTED_LANGUAGES.find(lang => lang.extensions.includes(mostCommonExt));
    if (detectedLang) {
      setLanguage(detectedLang.value);
    }

    setConversation([]);
    setChatHistory([]);
    setCurrentHistoryId(null);
    setError(null);
  };
  
  const handleFileContentChange = (path: string, newContent: string) => {
    setProjectFiles(files => files.map(f => f.path === path ? { ...f, content: newContent } : f));
  };
  
  const startNewReview = () => {
    setConversation([]);
    setChatHistory([]);
    setProjectFiles([]);
    setActiveFilePath(null);
    setCurrentHistoryId(null);
    setError(null);
    setInputMode('snippet');
    setCode('');
  };
  
  const loadFromHistory = (item: HistoryItem) => {
    setInputMode(item.inputMode);
    setProjectFiles(item.projectFiles);
    setConversation(item.conversation);
    setLanguage(item.language);
    setPersona(item.persona);
    setFocusAreas(item.focusAreas);
    setCurrentHistoryId(item.id);
    setError(null);
    
    if (item.inputMode === 'project') {
        setActiveFilePath(item.projectFiles[0]?.path || null);
        setCode('');
    } else {
        setActiveFilePath(null);
        setCode(item.projectFiles[0]?.content || '');
    }

    setIsSidebarOpen(false);
  };
  
  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    if (currentHistoryId === id) {
      startNewReview();
    }
  };


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.theme = newTheme;
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const activeFileInProject = useMemo(() => projectFiles.find(f => f.path === activeFilePath), [projectFiles, activeFilePath]);

  return (
    <div className="flex h-screen bg-light-bg-base dark:bg-dark-bg-base font-sans transition-colors duration-300">
       <HistorySidebar 
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}
         history={history}
         onLoad={loadFromHistory}
         onDelete={deleteFromHistory}
         onNew={startNewReview}
         theme={theme}
         onToggleTheme={toggleTheme}
       />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto lg:overflow-hidden min-h-0">
          <CodeInput
            inputMode={inputMode}
            code={code}
            onCodeChange={setCode}
            projectFiles={projectFiles}
            activeFile={activeFileInProject}
            onFileSelect={setActiveFilePath}
            onFileContentChange={handleFileContentChange}
            language={language}
            onLanguageChange={setLanguage}
            focusAreas={focusAreas}
            onFocusAreaChange={setFocusAreas}
            persona={persona}
            onPersonaChange={setPersona}
            onReview={handleReview}
            onGenerate={handleGenerateAction}
            isLoading={isLoading}
            onProjectImport={handleProjectImport}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNewReview={startNewReview}
          />

          <ReviewOutput
            conversation={conversation}
            isLoading={isLoading}
            isChatting={isChatting}
            error={error}
            theme={theme}
            language={language}
            onSendMessage={handleSendMessage}
            onApplyFix={handleApplyFix}
            onPreviewFix={handlePreviewFix}
            projectFiles={projectFiles}
          />
        </main>
      </div>

      <PreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        onApply={() => preview && handleApplyFix(preview.before, preview.after, preview.filePath)}
        beforeCode={preview?.before || ''}
        afterCode={preview?.after || ''}
        language={preview?.language || language}
        theme={theme}
        filePath={preview?.filePath}
      />
    </div>
  );
};

export default App;
