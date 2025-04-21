"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);

  // Handle initial setup after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTitleClick = () => {
    // Reset all topic selections
    window.dispatchEvent(new CustomEvent('resetNavigation'));

    // For safety, also reset the topicChange event with null
    window.dispatchEvent(new CustomEvent('topicChange', { detail: null }));
  };

  if (!mounted) {
    return <nav className="w-full bg-black"></nav>;
  }

  return (
    <nav className="w-full bg-black text-white py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10">
        {/* Left-aligned Logo */}
        <div>
          <Link href="/" onClick={handleTitleClick} className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-semibold">AgentBoost</span>
          </Link>
        </div>

        {/* Center Navigation Links */}
        <div className="flex items-center space-x-10 mx-auto md:mx-0">
          <Link href="/features" className="text-white hover:text-gray-300 transition-colors">
            Features
          </Link>
          <Link href="/platform" className="text-white hover:text-gray-300 transition-colors">
            Platform
          </Link>
          <Link href="/about" className="text-white hover:text-gray-300 transition-colors">
            About
          </Link>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4">
          {/* Login Button */}
          <Link href="/signin" className="text-white hover:text-gray-300 transition-colors font-medium">
            Login
          </Link>

          {/* Join Free Beta Button */}
          <Link href="/signup">
            <button className="bg-gray-900 text-white px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-800 transition-colors flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M22 2L13 7L22 12L13 17L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 7H6C3.79086 7 2 8.79086 2 11V13C2 15.2091 3.79086 17 6 17H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Join Free Beta</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}