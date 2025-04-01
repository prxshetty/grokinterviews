'use client';

import Link from 'next/link';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start">
          {/* Company Name - Vertical Orientation */}
          <div className="mb-8 md:mb-0">
            <div className="transform -rotate-90 origin-left ml-4 text-gray-600 dark:text-gray-400">
              <p className="text-xs uppercase tracking-widest whitespace-nowrap">grokinterviews</p>
            </div>
          </div>

          {/* Minimal Links */}
          <div className="flex space-x-8 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-gray-800 dark:hover:text-white transition-colors">Home</Link>
            <Link href="/topics" className="hover:text-gray-800 dark:hover:text-white transition-colors">Topics</Link>
            <Link href="/contact" className="hover:text-gray-800 dark:hover:text-white transition-colors">Contact</Link>
          </div>
          
          {/* Scroll to top */}
          <button 
            onClick={scrollToTop}
            className="mt-8 md:mt-0 w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ↑
          </button>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 text-center text-xs text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} GrokInterviews. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 