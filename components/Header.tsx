import React from 'react';
import { CodeIcon } from './icons/CodeIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-black/60 backdrop-blur-xl border-b border-ios-dark-panel sticky top-0 z-10">
      <div className="mx-auto px-6 py-4 flex items-center gap-4">
        <div className="bg-cyan-500/20 p-2 rounded-lg">
            <CodeIcon className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">
            AI Code Reviewer
          </h1>
          <p className="text-sm text-ios-dark-secondary">
            Instant feedback on your code from Gemini.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;