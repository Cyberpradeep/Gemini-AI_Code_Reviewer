import React, { useState, useCallback, useEffect } from 'react';
import CodeInput from './components/CodeInput';
import ReviewOutput from './components/ReviewOutput';
import HistorySidebar from './components/HistorySidebar';
import { reviewCode } from './services/geminiService';
import { SUPPORTED_LANGUAGES, HISTORY_STORAGE_KEY } from './constants';
import { MenuIcon } from './components/icons/MenuIcon';

export interface ReviewHistoryItem {
  id: string;
  code: string;
  language: string;
  review: string;
  timestamp: number;
}

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
  const [review, setReview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 1024);
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Load theme from localStorage or use system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // Load history from localStorage
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setReviewHistory(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error("Failed to load or parse review history from localStorage:", err);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
    
    // Initial mount animation
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
    // Apply theme class to root element
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

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReview('');

    try {
      const result = await reviewCode(code, language);
      setReview(result);

      const newHistoryItem: ReviewHistoryItem = {
        id: `review-${Date.now()}`,
        code,
        language,
        review: result,
        timestamp: Date.now(),
      };

      const updatedHistory = [newHistoryItem, ...reviewHistory];
      setReviewHistory(updatedHistory);
      setSelectedHistoryId(newHistoryItem.id);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));

    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`An error occurred: ${e.message}`);
      } else {
        setError('An unknown error occurred during the review.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language, reviewHistory]);

  const handleSelectHistoryItem = (id: string) => {
    const item = reviewHistory.find(item => item.id === id);
    if (item) {
      setCode(item.code);
      setLanguage(item.language);
      setReview(item.review);
      setSelectedHistoryId(item.id);
      setError(null);
      setIsLoading(false);
      if (window.innerWidth < 1024) { // Close sidebar on selection on smaller screens
        setIsSidebarOpen(false);
      }
    }
  };

  const handleNewReview = () => {
    setCode('');
    setReview('');
    setError(null);
    setSelectedHistoryId(null);
    setLanguage(SUPPORTED_LANGUAGES[0].value);
     if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  }

  return (
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
        <main className={`flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6 overflow-y-auto relative transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'} bg-ios-light-bg dark:bg-black`}>
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 left-4 z-20 p-2 bg-ios-light-panel/80 dark:bg-ios-dark-panel/50 backdrop-blur-md rounded-full text-ios-light-text-secondary dark:text-gray-300 hover:text-ios-light-text-primary dark:hover:text-white hover:bg-ios-light-header dark:hover:bg-ios-dark-panel transition-all lg:hidden"
              aria-label="Open history sidebar"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          )}
          <div className="lg:col-span-1">
            <CodeInput
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              languages={SUPPORTED_LANGUAGES}
              onSubmit={handleReview}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-1">
            <ReviewOutput 
              review={review} 
              isLoading={isLoading} 
              error={error} 
              selectedHistoryId={selectedHistoryId}
              theme={theme}
            />
          </div>
        </main>
        <footer className={`text-center p-3 text-ios-light-text-secondary dark:text-ios-dark-secondary text-xs border-t border-ios-light-header dark:border-ios-dark-panel flex-shrink-0 transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'} bg-ios-light-bg dark:bg-black`}>
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;