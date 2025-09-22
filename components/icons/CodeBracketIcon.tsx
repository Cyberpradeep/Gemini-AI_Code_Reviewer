import React from 'react';

export const CodeBracketIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 7.5l-3.75 3.75 3.75 3.75M17.25 7.5l3.75 3.75-3.75 3.75"
        />
    </svg>
);
