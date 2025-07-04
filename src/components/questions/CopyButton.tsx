'use client';

import { useState } from 'react';
import {FiCopy, FiCheck} from 'react-icons/fi';

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
            className={`flex items-center justify-center p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}
            title="Copy to clipboard"
            aria-label="Copy to clipboard"
        >
        {isCopied ? (
            <FiCheck className="text-green-500" size={size} />
        ) : (
            <FiCopy className="text-gray-600 dark:text-gray-300" size={size} />
        )}
    </button>
    );


}