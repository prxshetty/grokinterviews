'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TopicNavWrapper } from '../topic';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

export default function MainNavigation({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNavTitle, setShowNavTitle] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

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

    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        // Fetch user profile when auth state changes
        const fetchProfile = async () => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        };
        fetchProfile();
      } else {
        setProfile(null);
      }
    });

    // Handle clicks outside dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTopicsPage, supabase]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push('/');
    router.refresh();
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
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="text-sm text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full flex items-center space-x-1"
                >
                  <span>
                    {profile?.full_name || profile?.username || user.email.split('@')[0]}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={toggleDarkMode}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>

                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Account
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
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
