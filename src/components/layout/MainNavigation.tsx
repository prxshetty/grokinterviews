'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useImagePreload } from '@/hooks';
import { LogOut, User as UserIcon, Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Logo } from '@/components/ui/Logo';
import { MAIN_NAV_TOPICS, type NavTopic, DEFAULT_AVATAR_URL } from '@/config';

export default function MainNavigation({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [showPasswordResetReminder, setShowPasswordResetReminder] = useState(false);
  
  // Use the shared auth state from the provider
  const { user, profile, signOut } = useAuth();

  // Preload the default avatar image for instant loading
  useImagePreload(DEFAULT_AVATAR_URL, true);

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
  }, []);

  // Check if user came from password reset and hasn't dismissed the reminder
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const dismissed = sessionStorage.getItem('globalPasswordResetReminderDismissed');
    
    if (mode === 'reset' && !dismissed) {
      setShowPasswordResetReminder(true);
    }
  }, []);

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

  const dismissPasswordResetReminder = () => {
    setShowPasswordResetReminder(false);
    sessionStorage.setItem('globalPasswordResetReminderDismissed', 'true');
  };

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
      {showPasswordResetReminder && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 text-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 pr-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Password reset link used successfully.</span>
              <a 
                href="/account?tab=password-security" 
                className="underline hover:no-underline font-medium"
              >
                Update your password
              </a>
              <span>when ready.</span>
            </div>
            <button 
              onClick={dismissPasswordResetReminder}
              className="text-white/80 hover:text-white text-xl leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"
              title="Dismiss reminder"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <header className={`fixed left-1/2 transform -translate-x-1/2 z-40 flex items-center p-2 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-xl w-[95vw] max-w-7xl transition-all duration-300 ease-in-out ${showPasswordResetReminder ? 'top-12' : 'top-4'}`}>
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
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 bg-transparent">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group h-9 rounded-full px-2 gap-2 text-sm text-foreground hover:bg-transparent hover:bg-gray-100/50 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors border border-transparent hover:border-border/40"
                  >
                    {/* User Avatar */}
                    <Avatar className="w-7 h-7 border border-gray-200 dark:border-gray-700">
                      <AvatarImage 
                        src={profile?.avatar_url && profile.avatar_url.trim() !== '' ? profile.avatar_url : DEFAULT_AVATAR_URL} 
                        alt="Profile picture" 
                      />
                      <AvatarFallback className="bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img
                          src={DEFAULT_AVATAR_URL}
                          alt="Default Avatar"
                          className="w-full h-full object-cover"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  sideOffset={8}
                  className="w-56 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-border/50 shadow-lg rounded-lg overflow-hidden p-1.5 mt-1"
                >
                  <DropdownMenuLabel className="p-3 pb-2 border-b border-border/20">
                    <div className="space-y-0.5">
                      <p className="text-sm font-normal text-gray-900 dark:text-gray-100">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user?.email || 'No email provided'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuGroup className="mt-1">
                    <DropdownMenuItem 
                      onClick={() => { 
                        router.push('/account'); 
                        setIsMobileMenuOpen(false); 
                      }} 
                      className="px-2 py-1.5 text-sm rounded-md cursor-pointer font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100 focus:bg-gray-100 focus:text-gray-900 dark:focus:bg-gray-800 dark:focus:text-gray-100 transition-colors"
                    >
                      <UserIcon className="mr-2 h-4 w-4 opacity-70" />
                      <span>Account</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <div className="p-1.5 pt-2 flex items-center justify-between border-t border-border/20 mt-1">
                    <ThemeSwitcher className="bg-transparent dark:bg-transparent" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSignOut();
                      }} 
                      className="h-8 w-8 rounded-full text-red-500 border border-red-200 hover:bg-red-500/10 transition-colors dark:border-red-800/50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Sign Out</span>
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link 
                  href="/signin" 
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full hover:text-black dark:hover:text-white transition-all duration-200"
                >
                  Login
                </Link>
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
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={profile?.avatar_url && profile.avatar_url.trim() !== '' ? profile.avatar_url : DEFAULT_AVATAR_URL} 
                            alt="User avatar" 
                          />
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <img
                              src={DEFAULT_AVATAR_URL}
                              alt="Default Avatar"
                              className="w-full h-full object-cover"
                            />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-normal text-gray-900 dark:text-gray-100">{profile?.full_name || profile?.username || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'No email provided'}</p>
                        </div>
                      </div>
                      <SheetClose asChild>
                        <Button variant="ghost" onClick={() => { router.push('/account'); setIsMobileMenuOpen(false);}} className="w-full justify-start font-normal text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                          <UserIcon className="mr-2 h-4 w-4" /> Account
                        </Button>
                      </SheetClose>
                      <div className="flex items-center justify-between w-full pt-2">
                        <ThemeSwitcher />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignOut();
                          }} 
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-full border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="sr-only">Sign Out</span>
                        </Button>
                      </div>
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

      {showPasswordResetReminder && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 text-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Password reset link used successfully.</span>
              <a 
                href="/account?tab=password-security" 
                className="underline hover:no-underline font-medium"
              >
                Update your password
              </a>
              <span>when ready.</span>
            </div>
            <button 
              onClick={dismissPasswordResetReminder}
              className="text-white/80 hover:text-white text-lg leading-none"
              title="Dismiss reminder"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}