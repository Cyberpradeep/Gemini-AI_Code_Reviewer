import React, { useState, useCallback, useEffect } from 'react';
import CodeInput from './components/CodeInput';
import ReviewOutput from './components/ReviewOutput';
import HistorySidebar from './components/HistorySidebar';
import PreviewModal from './components/PreviewModal';
import { performCodeReview, generateUnitTests, generateDocumentation, sendFollowUpMessage } from './services/geminiService';
import { SUPPORTED_LANGUAGES, HISTORY_STORAGE_KEY, AI_PERSONAS } from './constants';
import { MenuIcon } from './components/icons/MenuIcon';
import type { Content } from "@google/genai";

export interface ReviewFinding {
  category: 'Correctness & Bugs' | 'Best Practices & Readability' | 'Performance' | 'Security' | 'Maintainability';
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  title: string;
  summary: string;
  suggestion?: {
    before: string;
    after: string;
  };
  learnMoreUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string | ReviewFinding[];
}
export interface ReviewHistoryItem {
  id: string;
  code: string;
  language: string;
  review: string | ReviewFinding[]; // The initial review object or string
  timestamp: number;
  chatHistory: Content[];
}

export type Theme = 'light' | 'dark';
export type AiAction = 'review' | 'test' | 'docs';

interface PreviewState {
  before: string;
  after: string;
  language: string;
}

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
  const [activeConversation, setActiveConversation] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 1024);
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [reviewFocus, setReviewFocus] = useState<string[]>([]);
  const [persona, setPersona] = useState<string>(AI_PERSONAS[0].value);
  const [previewingFix, setPreviewingFix] = useState<PreviewState | null>(null);


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setReviewHistory(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error("Failed to load or parse review history from localStorage:", err);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
    
    const timer = setTimeout(() => setIsMounted(true), 100);

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleAiAction = useCallback(async (action: AiAction) => {
    if (!code.trim()) {
      setError('Please enter some code first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveConversation([]);
    setSelectedHistoryId(null);

    try {
        let response: string | ReviewFinding[];
        let userPrompt: string;
        let modelResponseContent: string;
        
        const personaInstruction = AI_PERSONAS.find(p => p.value === persona)?.instruction || AI_PERSONAS[0].instruction;

        switch (action) {
            case 'test':
                ({ response, userPrompt } = await generateUnitTests(code, language, personaInstruction));
                modelResponseContent = response;
                break;
            case 'docs':
                ({ response, userPrompt } = await generateDocumentation(code, language, personaInstruction));
                modelResponseContent = response;
                break;
            case 'review':
            default:
                ({ response, userPrompt } = await performCodeReview(code, language, reviewFocus, personaInstruction));
                modelResponseContent = JSON.stringify(response);
                break;
        }
      
      setActiveConversation([{ role: 'model', content: response }]);

      const newHistoryItem: ReviewHistoryItem = {
        id: `review-${Date.now()}`,
        code,
        language,
        review: response,
        timestamp: Date.now(),
        chatHistory: [
          { role: 'user', parts: [{ text: userPrompt }] },
          { role: 'model', parts: [{ text: modelResponseContent }] }
        ],
      };

      const updatedReviewHistory = [newHistoryItem, ...reviewHistory];
      setReviewHistory(updatedReviewHistory);
      setSelectedHistoryId(newHistoryItem.id);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedReviewHistory));

    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`An error occurred: ${e.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language, reviewHistory, reviewFocus, persona]);

  const handleSelectHistoryItem = (id: string) => {
    const item = reviewHistory.find(item => item.id === id);
    if (item) {
      setCode(item.code);
      setLanguage(item.language);
      setSelectedHistoryId(item.id);
      
      // The first model response is the main review/generation. Others are chat.
      const conversation: ChatMessage[] = item.chatHistory
        .filter(entry => entry.role !== 'user' || !entry.parts[0].text?.startsWith('Act as a')) // Filter out initial system prompt-like user messages
        .map((entry, index) => {
            const content = entry.parts[0].text || '';
            if (entry.role === 'model' && index === 1) { // First model response
                try {
                    // Try to parse as JSON (structured review), fallback to string
                    return { role: 'model', content: JSON.parse(content) };
                } catch {
                    return { role: 'model', content: content };
                }
            }
            return {
                role: entry.role as 'user' | 'model',
                content: content,
            };
        });

      setActiveConversation(conversation);
      setError(null);
      setIsLoading(false);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }
  };

  const handleNewReview = () => {
    setCode('');
    setActiveConversation([]);
    setError(null);
    setSelectedHistoryId(null);
    setLanguage(SUPPORTED_LANGUAGES[0].value);
     if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
  };
  
  const handleSendMessage = async (message: string) => {
    const currentItem = reviewHistory.find(item => item.id === selectedHistoryId);
    if (!message.trim() || !currentItem) return;

    setIsChatting(true);

    const userMessage: ChatMessage = { role: 'user', content: message };
    setActiveConversation(prev => [...prev, userMessage]);

    try {
      const { response, updatedHistory } = await sendFollowUpMessage(
        message,
        currentItem.chatHistory
      );

      const modelMessage: ChatMessage = { role: 'model', content: response };
      setActiveConversation(prev => [...prev, modelMessage]);

      const updatedReviewHistory = reviewHistory.map(item =>
        item.id === selectedHistoryId ? { ...item, chatHistory: updatedHistory } : item
      );
      setReviewHistory(updatedReviewHistory);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedReviewHistory));

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setActiveConversation(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsChatting(false);
    }
  };
  
  const handleApplyFix = (before: string, after: string) => {
    setCode(currentCode => currentCode.replace(before, after));
  };
  
  const handlePreviewFix = (before: string, after: string, language: string) => {
    setPreviewingFix({ before, after, language });
  };

  const handleClosePreview = () => {
    setPreviewingFix(null);
  };

  const handleApplyFromPreview = () => {
    if (previewingFix) {
      handleApplyFix(previewingFix.before, previewingFix.after);
    }
    handleClosePreview();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  }
  
  const selectedItem = reviewHistory.find(item => item.id === selectedHistoryId);
  const currentCode = selectedItem ? selectedItem.code : code;
  const currentLanguage = selectedItem ? selectedItem.language : language;

  return (
    <>
      <div className="min-h-screen bg-ios-light-bg dark:bg-black text-ios-light-text-primary dark:text-gray-200 flex h-screen font-sans overflow-hidden">
        <HistorySidebar
          history={reviewHistory}
          languages={SUPPORTED_LANGUAGES}
          selectedId={selectedHistoryId}
          onSelectItem={handleSelectHistoryItem}
          onNewReview={handleNewReview}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        <div className={`flex-1 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out lg:transform-none ${isSidebarOpen ? 'lg:translate-x-0' : 'lg:translate-x-0'} ${isSidebarOpen && window.innerWidth < 1024 ? 'translate-x-72 scale-90 rounded-2xl overflow-hidden' : 'translate-x-0'}`}>
          <main className={`flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 p-4 md:p-6 relative transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'} bg-ios-light-bg dark:bg-black overflow-hidden`}>
            {!isSidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="absolute top-4 left-4 z-20 p-2 bg-ios-light-panel/80 dark:bg-ios-dark-panel/50 backdrop-blur-md rounded-full text-ios-light-text-secondary dark:text-gray-300 hover:text-ios-light-text-primary dark:hover:text-white hover:bg-ios-light-header dark:hover:bg-ios-dark-panel transition-all lg:hidden"
                aria-label="Open history sidebar"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            )}
            <div className="lg:col-span-1 min-h-0">
              <CodeInput
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
                languages={SUPPORTED_LANGUAGES}
                onAiAction={handleAiAction}
                isLoading={isLoading}
                reviewFocus={reviewFocus}
                setReviewFocus={setReviewFocus}
                persona={persona}
                setPersona={setPersona}
              />
            </div>
            <div className="lg:col-span-1 min-h-0">
              <ReviewOutput 
                conversation={activeConversation}
                isLoading={isLoading} 
                isChatting={isChatting}
                error={error} 
                theme={theme}
                code={currentCode}
                language={currentLanguage}
                onSendMessage={handleSendMessage}
                onApplyFix={handleApplyFix}
                onPreviewFix={handlePreviewFix}
              />
            </div>
          </main>
          <footer className={`text-center p-3 text-ios-light-text-secondary dark:text-ios-dark-secondary text-xs border-t border-ios-light-header dark:border-ios-dark-panel flex-shrink-0 transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'} bg-ios-light-bg dark:bg-black`}>
            <p>Powered by Google Gemini</p>
          </footer>
        </div>
      </div>
      {previewingFix && (
        <PreviewModal
          isOpen={!!previewingFix}
          onClose={handleClosePreview}
          onApply={handleApplyFromPreview}
          beforeCode={previewingFix.before}
          afterCode={previewingFix.after}
          language={previewingFix.language}
          theme={theme}
        />
      )}
    </>
  );
};

export default App;
