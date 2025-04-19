'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TopicNavWrapper } from '../topic';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { LogOut, Moon, Sun, User, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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

    // No need for click outside handler with Radix UI dropdown

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
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
    router.push('/');
    router.refresh();
  };

  // Render a skeleton version until component is mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        {/* Skeleton Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-all duration-300 border-b border-transparent">
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
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-all duration-300 border-b border-transparent hover:border-gray-200 dark:hover:border-white/10">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="text-sm text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white transition-colors duration-300 flex items-center space-x-1 focus:outline-none"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>
                      {profile?.full_name || profile?.username || user.email.split('@')[0]}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 transition-transform"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/95 dark:bg-black/95 border border-gray-200 dark:border-white/10 shadow-lg rounded-md overflow-hidden animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                  <DropdownMenuLabel className="text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10">
                    <div>
                      <p className="font-medium">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 truncate font-normal">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/account')} className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-white/10">
                      <User className="mr-2 h-4 w-4" />
                      <span>Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard')} className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-white/10">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/bookmarks')} className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                      <span>Bookmarks</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleDarkMode} className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-white/10">
                      {isDarkMode ? (
                        <>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:bg-gray-100 dark:focus:bg-white/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Sign In Button - Minimalistic */}
                <Link
                  href="/signin"
                  className="text-sm text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                >
                  Sign In
                </Link>

                {/* Dark Mode Toggle - Simple Button */}
                <button
                  onClick={toggleDarkMode}
                  className="text-sm text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-black dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full"
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
