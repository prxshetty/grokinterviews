'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TopicNav, TopicNavWrapper } from '../topic';
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
        <nav className={`fixed top-0 left-0 right-0 z-50 py-3 ${pathname === '/topics' ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-sm' : 'bg-transparent'} text-black dark:text-white`}>
          <div className="w-full flex items-center justify-between px-8">
            <div className="flex items-center">
              <div className="text-lg md:text-xl font-normal tracking-tight opacity-0 border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1">
                Grok Interviews
              </div>
            </div>
            <div className="flex items-center space-x-10 mx-auto absolute left-1/2 transform -translate-x-1/2 border border-gray-300 dark:border-gray-700 rounded-full px-5 py-1 opacity-0">
              <div>Topics</div>
              <div>Quizzes <span className="text-xs">COMING SOON</span></div>
              <div>Contact</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm opacity-0 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1">Login</div>
            </div>
          </div>
        </nav>
        <div className="h-12"></div>
        {children}
      </>
    );
  }

  return (
    <>
      {/* Main Navigation Bar - AgentBoost design with transparent background */}
      <nav className={`fixed top-0 left-0 right-0 z-50 py-3 ${isTopicsPage ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-sm' : 'bg-transparent'} text-black dark:text-white transition-transform duration-300`}>
        <div className="w-full flex items-center justify-between px-8">
          {/* Left side - Logo with proper left alignment */}
          <div className="flex items-center">
            <Link href="/" onClick={handleTitleClick} className="flex items-center border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1">
              <span className="text-lg md:text-xl font-normal tracking-tight text-black dark:text-white">Grok Interviews</span>
            </Link>
          </div>

          {/* Center Navigation Links - with border */}
          <div className="flex items-center absolute left-1/2 transform -translate-x-1/2 border border-gray-300 dark:border-gray-700 rounded-full px-5 py-1">
            <Link 
              href="/topics" 
              className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-4"
              onClick={(e) => {
                // Reset any previously selected topic to ensure a clean state
                if (pathname.startsWith('/topics/') && pathname !== '/topics') {
                  e.preventDefault();
                  router.push('/topics');
                  // Reset navigation state via custom event
                  window.dispatchEvent(new CustomEvent('resetNavigation'));
                }
              }}
            >
              Topics
            </Link>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
            <Link href="/quizzes" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-4 flex items-center">
              Quizzes
              <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-black/10 dark:bg-white/20 text-black/70 dark:text-white/80 rounded-sm font-medium">COMING SOON</span>
            </Link>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
            <Link href="/contact" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-4">
              Contact
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300 flex items-center space-x-1 focus:outline-none border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1"
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
                      className="w-4 h-4 transition-transform ml-1"
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
                      <span className="flex items-center">Dashboard <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-black/10 dark:bg-white/20 text-black/70 dark:text-white/80 rounded-sm font-medium">BETA</span></span>
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
                {/* Login Button - with border */}
                <Link href="/signin" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-medium border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div className="h-12"></div>

      {/* Show topics navigation on either the main /topics page or topic detail pages */}
      {(pathname === '/topics' || (isTopicDetailPage && !pathname.endsWith('/topics'))) && (
        <div className="topic-navigation w-full sticky top-12 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-0 mt-0 border-b border-gray-200 dark:border-gray-800">
          {pathname === '/topics' ? (
            <div className="w-full">
              <TopicNav 
                onTopicSelect={(topicId) => router.push(`/topics/${topicId}`)}
                selectedTopic={null}
              />
            </div>
          ) : (
            <TopicNavWrapper />
          )}
        </div>
      )}

      {/* Main Content */}
      <main className={isTopicDetailPage ? "w-full px-8 py-8" : ""}>
        {children}
      </main>
    </>
  );
}
