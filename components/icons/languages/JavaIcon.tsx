import React from 'react';

export const JavaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    {...props}
  >
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 15h-1V9.21h1V17zm3.43-4.57c-.35-.22-.72-.34-1.18-.34-.9 0-1.63.45-2.12 1.15-.49.7-.63 1.59-.41 2.5.22.9.83 1.63 1.73 2.05.9.42 1.83.42 2.73 0 .9-.42 1.5-1.15 1.73-2.05.22-.91-.07-1.8-.41-2.5-.26-.52-.63-.95-1.07-1.26z"/>
  </svg>
);