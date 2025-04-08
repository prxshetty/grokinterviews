'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopicNavWrapper from './TopicNavWrapper';

export default function MainNavigation({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNavTitle, setShowNavTitle] = useState(false);
  const pathname = usePathname();

  // Check if we're on a topic detail page
  const isTopicDetailPage = pathname.startsWith('/topics/') && pathname !== '/topics';
  // Check if we're on the topics page
  const isTopicsPage = pathname === '/topics';

  // Handle initial setup after mount
  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // Add scroll event listener to show/hide nav title
    const handleScroll = () => {
      // Always show title on topics page
      if (isTopicsPage) {
        setShowNavTitle(true);
        return;
      }

      // Get the hero section element
      const heroSection = document.querySelector('.hero-section');
      if (heroSection) {
        const heroRect = heroSection.getBoundingClientRect();
        // Show nav title when hero section is scrolled out of view
        setShowNavTitle(heroRect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const handleTitleClick = () => {
    // Reset all topic selections
    window.dispatchEvent(new CustomEvent('resetNavigation'));

    // For safety, also reset the topicChange event with null
    window.dispatchEvent(new CustomEvent('topicChange', { detail: null }));
  };

  // Render a skeleton version until component is mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        {/* Skeleton Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-all duration-300 border-b border-transparent">
          <div className="w-full flex items-center justify-between px-8">
            <div className="flex items-center">
              <div className="text-xl md:text-3xl font-normal tracking-tight opacity-0">
                Grok Interviews
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm opacity-0">Sign In</div>
              <div className="text-sm opacity-0">Dark</div>
            </div>
          </div>
        </nav>
        <div className="h-16"></div>
        {children}
      </>
    );
  }

  return (
    <>
      {/* Main Navigation Bar - minimalistic design */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-all duration-300 border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800">
        <div className="w-full flex items-center justify-between px-8">
          {/* Left side - Logo with proper left alignment */}
          <div className="flex items-center">
            <Link href="/" onClick={handleTitleClick} className="group">
              <h1 className={`text-xl md:text-3xl font-normal tracking-tight text-black dark:text-white transition-all duration-500 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 group-hover:after:w-full ${showNavTitle ? 'opacity-100' : 'opacity-0'}`}>
                Grok Interviews
              </h1>
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-6">
            {/* Sign In Button - Minimalistic */}
            <Link
              href="/signin"
              className="text-sm text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full"
            >
              Sign In
            </Link>

            {/* Dark Mode Toggle - Simple Button */}
            <button
              onClick={toggleDarkMode}
              className="text-sm text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div className="h-16"></div>

      {/* Topic Navigation - only shown on topic detail pages */}
      {isTopicDetailPage && <TopicNavWrapper />}

      {/* Main Content */}
      <main className={isTopicDetailPage ? "w-full px-8 py-8" : ""}>
        {children}
      </main>
    </>
  );
}
