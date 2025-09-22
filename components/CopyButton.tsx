import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent any other parent handlers from firing
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text.');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 bg-light-bg-elevated/60 dark:bg-dark-bg-elevated/60 backdrop-blur-sm rounded-md text-light-label-secondary dark:text-dark-label-secondary hover:text-light-label-primary dark:hover:text-dark-label-primary hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary transition-all"
      aria-label={isCopied ? 'Copied to clipboard' : 'Copy code to clipboard'}
    >
      {isCopied ? (
        <CheckIcon className="h-4 w-4 text-green-500" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </button>
  );
};

export default CopyButton;