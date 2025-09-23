import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import LanguageIcon from './LanguageIcon';

interface LanguageDisplayProps {
    language: string;
}

const LanguageDisplay: React.FC<LanguageDisplayProps> = ({ language }) => {
    const langDetails = SUPPORTED_LANGUAGES.find(l => l.value === language);
    
    let label: string;
    if (language === 'auto') {
        label = 'Auto Detect';
    } else if (langDetails) {
        label = langDetails.label;
    } else {
        label = 'Plain Text'; // Fallback for any other case
    }

    return (
        <div className="flex items-center bg-light-fill-primary dark:bg-dark-fill-primary text-light-label-primary dark:text-dark-label-primary font-medium py-2 px-3 rounded-full text-sm w-full sm:w-44">
            <LanguageIcon language={language} className="h-5 w-5 mr-2 text-light-label-secondary dark:text-dark-label-secondary"/>
            <span className="flex-grow text-left truncate">{label}</span>
        </div>
    );
};

export default LanguageDisplay;