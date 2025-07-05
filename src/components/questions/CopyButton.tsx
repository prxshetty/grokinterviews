'use client';

import { useState } from 'react';

interface CopyButtonProps {
    textToCopy: string;
    className?: string;
    size?: number;
}

export function CopyButton({textToCopy, className = '', size = 16 }: CopyButtonProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center justify-center p-2 rounded-md bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
            title="Copy to clipboard"
            aria-label="Copy to clipboard"
        >
        {isCopied ? (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-green-500">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ) : (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-gray-600 dark:text-gray-300">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
            </svg>
        )}
    </button>
    );


}