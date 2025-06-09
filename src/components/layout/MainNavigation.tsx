'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

const mainTopics = [
  { id: 'ml', label: 'Machine Learning', abbreviation: 'ML' },
  { id: 'ai', label: 'Artificial Intelligence', abbreviation: 'AI' },
  { id: 'webdev', label: 'Web Development', abbreviation: 'Web Development' },
  { id: 'sdesign', label: 'System Design', abbreviation: 'System Design' },
  { id: 'dsa', label: 'Data Structures & Algorithms', abbreviation: 'DSA' },
];

export default function MainNavigation({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  const isTopicPage = pathname.startsWith('/topics');
  const isQuizPage = pathname.startsWith('/quizzes');
  const isTopicDetailPage = isTopicPage && pathname !== '/topics';
  const isQuizDetailPage = isQuizPage && pathname !== '/quizzes';

  const extractDomainFromPath = (path: string, section: 'topics' | 'quizzes') => {
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === section) {
      return parts[2];
    }
    return null;
  };

  const selectedTopic = extractDomainFromPath(pathname, 'topics');

  const handleTopicsLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isTopicPage) {
      e.preventDefault();
      router.push('/');
    }
  }, [isTopicPage, router]);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
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

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const quizzesDropdown = (
    <div className="flex items-center">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Quizzes
      </span>
      <sup className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400 opacity-75">
        Coming Soon
      </sup>
    </div>
  );

  const logoElement = (
    <Link href="/" className="flex items-center whitespace-nowrap">
      <span className="text-lg md:text-xl font-normal tracking-tight text-black dark:text-white">Grok Interviews</span>
    </Link>
  );

  if (!mounted) {
    return (
      <>
        {/* Simplified skeleton or nothing to avoid layout shifts */}
        <div style={{ height: '60px' }} /> {/* Placeholder for navbar */}
        {children}
      </>
    );
  }

  return (
    <>
      <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center p-2 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-xl w-[95vw] max-w-7xl transition-all duration-300 ease-in-out">
        <div className="relative flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logoElement}
          </div>

          {/* Centered Navigation */}
          <div className="hidden sm:flex flex-1 items-center justify-center gap-x-4 sm:gap-x-6">
            <Link
              href="/topics"
              onClick={handleTopicsLinkClick}
              className="flex flex-col items-center text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              <span>Topics</span>
            </Link>

            {user && (
                <Link
                  href="/dashboard"
                  className="flex items-center text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-black dark:text-gray-300 dark:hover:text-white"
                >
                  <span>Dashboard</span>
                  <sup className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400 opacity-75">
                    BETA
                  </sup>
                </Link>
            )}

            <div
              onMouseLeave={() => setHoveredTopic(null)}
              className={`flex items-center gap-x-4 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out sm:gap-x-6 ${isTopicPage ? 'max-w-screen-md opacity-100' : 'max-w-0 opacity-0'}`}
            >
              <div className="h-6 border-l border-gray-300 dark:border-gray-700" />
              {mainTopics.map(topic => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  onMouseEnter={() => setHoveredTopic(topic.id)}
                  onClick={e => {
                    if (selectedTopic === topic.id) {
                      e.preventDefault();
                      window.dispatchEvent(
                        new CustomEvent('resetCategorySelection', {
                          detail: { domain: topic.id },
                        }),
                      );
                      router.replace(`/topics/${topic.id}`);
                    }
                  }}
                  className={`flex flex-col items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:bg-gray-100 hover:text-black dark:hover:bg-white/10 dark:hover:text-white ${
                    hoveredTopic && hoveredTopic !== topic.id
                      ? 'blur-sm opacity-50'
                      : selectedTopic
                      ? selectedTopic === topic.id
                        ? 'text-black dark:text-white'
                        : 'text-gray-400 dark:text-gray-600'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>
                    {topic.abbreviation}
                  </span>
                </Link>
              ))}
            </div>

            {isTopicPage && <div className="h-6 border-l border-gray-300 dark:border-gray-700" />}
            {quizzesDropdown}
            
            <Link
              href="/about"
              className="flex flex-col items-center text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              <span>About</span>
            </Link>
          </div>

          {/* User Profile / Auth */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300 flex items-center space-x-1 focus:outline-none border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1"
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
              </button>
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
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative group w-full sm:w-auto">
                  <div className="absolute inset-0 -m-2 rounded-full hidden sm:block bg-gray-100 opacity-40 filter blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3"></div>
                  <Link href="/signin" className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 bg-gradient-to-b from-gray-50 to-gray-100 hover:to-gray-200 dark:from-gray-900 dark:to-gray-800 border border-transparent dark:border-gray-700/50 rounded-full hover:text-black dark:hover:text-white transition-all duration-200 w-full sm:w-auto">
                    Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ paddingTop: '80px' }}>
        <main className={isTopicDetailPage || isQuizDetailPage ? "w-full px-8 py-8" : "w-full px-8"}>
          {children}
        </main>
      </div>
    </>
  );
}