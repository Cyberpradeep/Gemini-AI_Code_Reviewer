import React from 'react';

export const CppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    <path d="M12 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    <path d="M12 12h8" />
    <path d="M12 12l-2.5-4.33" />
    <path d="M12 12l-2.5 4.33" />
    <path d="M12 12l-6-3.46" />
    <path d="M12 12l-6 3.46" />
  </svg>
);