import React from 'react';
import { JavascriptIcon } from './icons/languages/JavascriptIcon';
import { PythonIcon } from './icons/languages/PythonIcon';
import { TypescriptIcon } from './icons/languages/TypescriptIcon';
import { JavaIcon } from './icons/languages/JavaIcon';
import { GeneralFileIcon } from './icons/languages/GeneralFileIcon';
import { GoIcon } from './icons/languages/GoIcon';
import { RustIcon } from './icons/languages/RustIcon';
import { CppIcon } from './icons/languages/CppIcon';

interface LanguageIconProps extends React.SVGProps<SVGSVGElement> {
  language: string;
}

const LanguageIcon: React.FC<LanguageIconProps> = ({ language, ...props }) => {
  switch (language.toLowerCase()) {
    case 'javascript':
      return <JavascriptIcon {...props} />;
    case 'python':
      return <PythonIcon {...props} />;
    case 'typescript':
      return <TypescriptIcon {...props} />;
    case 'java':
      return <JavaIcon {...props} />;
    case 'go':
      return <GoIcon {...props} />;
    case 'rust':
      return <RustIcon {...props} />;
    case 'cpp':
    case 'csharp':
      return <CppIcon {...props} />;
    default:
      return <GeneralFileIcon {...props} />;
  }
};

export default LanguageIcon;