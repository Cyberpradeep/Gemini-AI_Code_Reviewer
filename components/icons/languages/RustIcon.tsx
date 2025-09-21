import React from 'react';

export const RustIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <circle cx="12" cy="12" r="1" />
    <path d="M12 17a5 5 0 0 0 5-5" />
    <path d="M12 7a5 5 0 0 0-5 5" />
    <path d="M7 12a5 5 0 0 0 5 5" />
    <path d="M17 12a5 5 0 0 0-5-5" />
    <path d="M21 12h-2" />
    <path d="M5 12H3" />
    <path d="M17 12l1.5-2.6" />
    <path d="M7 12l-1.5 2.6" />
    <path d="M12 21v-2" />
    <path d="M12 5V3" />
    <path d="M7 12l-1.5-2.6" />
    <path d="M17 12l1.5 2.6" />
  </svg>
);