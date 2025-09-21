import React from 'react';
import type { Theme } from '../App';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center">
         <div className="p-1.5 bg-ios-light-header dark:bg-ios-dark-header rounded-md mr-3">
            {theme === 'light' ? <SunIcon className="h-4 w-4 text-yellow-500" /> : <MoonIcon className="h-4 w-4 text-cyan-400" />}
         </div>
        <span className="text-sm font-medium text-ios-light-text-primary dark:text-white">
          {theme === 'light' ? 'Light' : 'Dark'} Mode
        </span>
      </div>
      <button
        onClick={onToggle}
        className="relative inline-flex items-center h-7 w-12 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ios-light-panel dark:focus:ring-offset-ios-dark-panel focus:ring-cyan-500 bg-ios-light-header dark:bg-ios-dark-header"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span
          className={`${
            theme === 'light' ? 'translate-x-1' : 'translate-x-6'
          } inline-block w-5 h-5 transform bg-white dark:bg-gray-500 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center shadow-md`}
        >
          {theme === 'dark' && <MoonIcon className="h-3 w-3 text-cyan-300" />}
        </span>
      </button>
    </div>
  );
};