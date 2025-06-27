'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { LogOut, Moon, Sun, User as UserIcon, Menu } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
  Logo,
} from '@/components/ui';
import { MAIN_NAV_TOPICS, type NavTopic } from '@/config/navigation.constants';

export default function MainNavigation({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use the shared auth state from the provider
  const { user, profile, signOut } = useAuth();

  // Filter out the AI domain from the navigation topics
  const displayedNavTopics = MAIN_NAV_TOPICS.filter(topic => topic.id !== 'ai');

  const isTopicPage = pathname.startsWith('/topics');
  const isTopicDetailPage = isTopicPage && pathname !== '/topics';

  const extractDomainFromPath = (path: string, section: 'topics') => {
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === section) {
      return parts[2];
    }
    return null;
  };

  const handleTopicsLinkClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, [setIsMobileMenuOpen]);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
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
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const logoElement = (
    <Link href="/" className="flex items-center whitespace-nowrap">
      <Logo 
        size="md" 
        showText={true} 
        className="text-black dark:text-white" 
        textClassName="text-lg md:text-xl"
      />
    </Link>
  );

  if (!mounted) {
    return (
      <>
        {/* Placeholder for navbar */}
        <div style={{ height: '60px' }} />
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

          {/* Centered Desktop Navigation */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-x-4 sm:gap-x-6">
            <Link
              href="/topics"
              onClick={handleTopicsLinkClick}
              className="flex flex-col items-center text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              <span>Topics</span>
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-black dark:text-gray-300 dark:hover:text-white"
                >
                  <span>Dashboard</span>
                  <sup className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400 opacity-75">
                    BETA
                  </sup>
                </Link>
                <Link
                  href="/dashboard/activity"
                  className="flex items-center text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-black dark:text-gray-300 dark:hover:text-white"
                >
                  <span>Activity</span>
                </Link>
              </>
            )}

            <div
              className={`flex items-center gap-x-4 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out sm:gap-x-6 ${isTopicPage ? 'max-w-screen-md opacity-100' : 'max-w-0 opacity-0'}`}
            >
              <div className="h-6 border-l border-gray-300 dark:border-gray-700" />
              {displayedNavTopics.map((topic: NavTopic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  onClick={e => {
                    if (extractDomainFromPath(pathname, 'topics') === topic.id) {
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
                    extractDomainFromPath(pathname, 'topics') === topic.id
                      ? 'text-black dark:text-white'
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
            
            <Link
              href="/about"
              className="flex flex-col items-center text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              <span>About</span>
            </Link>
          </div>

          {/* Desktop User Profile / Auth */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300 flex items-center space-x-1 focus:outline-none border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1"
                  >
                    <span>
                      {profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'}
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
                      <p className="text-xs text-gray-500 dark:text-gray-300 truncate font-normal">{user?.email || 'No email provided'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => { router.push('/account'); setIsMobileMenuOpen(false); }} className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-white/10">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Account</span>
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

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-black dark:text-white" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white/95 dark:bg-black/95 border-l border-gray-200 dark:border-white/10 p-6 pt-10">
                <SheetHeader>
                  <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-4">
                  <SheetClose asChild>
                    <Link href="/topics" onClick={handleTopicsLinkClick} className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Topics</Link>
                  </SheetClose>
                  {user && (
                    <>
                      <SheetClose asChild>
                         <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Dashboard</Link>
                      </SheetClose>
                      <SheetClose asChild>
                         <Link href="/dashboard/activity" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Activity</Link>
                      </SheetClose>
                    </>
                  )}
                  <SheetClose asChild>
                    <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">About</Link>
                  </SheetClose>

                  {isTopicPage && (
                     <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                       <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Switch Subject Area</p>
                      {displayedNavTopics.map((topic: NavTopic) => (
                        <SheetClose asChild key={topic.id}>
                          <Link
                            href={`/topics/${topic.id}`}
                            onClick={e => {
                              if (extractDomainFromPath(pathname, 'topics') === topic.id) {
                                e.preventDefault();
                                window.dispatchEvent(
                                  new CustomEvent('resetCategorySelection', {
                                    detail: { domain: topic.id },
                                  }),
                                );
                                router.replace(`/topics/${topic.id}`);
                              }
                              setIsMobileMenuOpen(false);
                            }}
                            className={`block py-2 text-md font-medium transition-colors duration-300 ${
                              extractDomainFromPath(pathname, 'topics') === topic.id
                                ? 'text-black dark:text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            {topic.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  )}
                </nav>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                         {profile?.avatar_url && 
                           <Image 
                             src={profile.avatar_url} 
                             alt="User avatar" 
                             className="w-10 h-10 rounded-full" 
                             width={40} 
                             height={40} 
                           />
                         }
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{profile?.full_name || profile?.username || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'No email provided'}</p>
                        </div>
                      </div>
                      <SheetClose asChild>
                        <Button variant="ghost" onClick={() => { router.push('/account'); setIsMobileMenuOpen(false);}} className="w-full justify-start text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white">
                          <UserIcon className="mr-2 h-4 w-4" /> Account
                        </Button>
                      </SheetClose>
                      <Button variant="ghost" onClick={toggleDarkMode} className="w-full justify-start text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white">
                        {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </Button>
                      <SheetClose asChild>
                        <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                          <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 text-md font-medium text-gray-600 dark:text-gray-300 bg-gradient-to-b from-gray-50 to-gray-100 hover:to-gray-200 dark:from-gray-900 dark:to-gray-800 border border-transparent dark:border-gray-700/50 rounded-lg hover:text-black dark:hover:text-white transition-all duration-200">
                        Login
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div style={{ paddingTop: '80px' }}>
        <main className={isTopicDetailPage ? "w-full px-4 sm:px-8 py-8" : "w-full px-4 sm:px-8"}>
          {children}
        </main>
      </div>
    </>
  );
}