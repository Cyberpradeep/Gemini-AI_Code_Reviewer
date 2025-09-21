import React from 'react';

export const GoIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M9 18V6H5" />
    <path d="M14 12h5" />
    <path d="M19 12l-3-3" />
    <path d="M19 12l-3 3" />
    <path d="M9 12h2.5a2.5 2.5 0 1 0 0-5H9" />
  </svg>
);