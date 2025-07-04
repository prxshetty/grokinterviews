'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useImagePreload } from '@/hooks';
import { LogOut, User as UserIcon, Menu, ChevronDown, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function MainNavigation({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [showPasswordResetReminder, setShowPasswordResetReminder] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Use the shared auth state from the provider
  const { user, profile, signOut } = useAuth();

  // Preload the default avatar image for instant loading
  useImagePreload(DEFAULT_AVATAR_URL, true);

  // AI domain cleanup completed - now showing all navigation topics
  const displayedNavTopics = MAIN_NAV_TOPICS;

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <header>
        <nav
          data-state={isMobileMenuOpen ? 'active' : 'inactive'}
          className="fixed z-20 w-full px-2 group"
        >
          <div
            className={cn(
              'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
              isScrolled &&
                'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5',
            )}
          >
            <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <div className="flex items-center space-x-2">
                  {logoElement}
                </div>

                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <button
                      aria-label={
                        isMobileMenuOpen == true ? 'Close Menu' : 'Open Menu'
                      }
                      className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden group"
                    >
                      <Menu className="group-data-[state=open]:rotate-180 group-data-[state=open]:scale-0 group-data-[state=open]:opacity-0 m-auto size-6 duration-300 ease-in-out" />
                      <X className="group-data-[state=open]:rotate-0 group-data-[state=open]:scale-100 group-data-[state=open]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-300 ease-in-out" />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full bg-white dark:bg-black border-none p-0 flex flex-col h-full"
                  >
                    {/* Header with logo */}
                    <div className="flex items-center justify-center p-6 border-b border-gray-200 dark:border-gray-800">
                      <Logo size="sm" showText={true} className="text-black dark:text-white" textClassName="text-lg" />
                    </div>
                    
                    <SheetHeader className="sr-only">
                      <SheetTitle>Mobile Menu</SheetTitle>
                    </SheetHeader>
                    {/* Main navigation content */}
                    <div className="flex-1 flex flex-col px-6 py-8">
                      <nav className="flex flex-col space-y-6">
                        <SheetClose asChild>
                          <Link
                            href="/topics"
                            onClick={handleTopicsLinkClick}
                            className="text-2xl font-light text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors py-3 border-b border-gray-100 dark:border-gray-800"
                          >
                            Topics
                          </Link>
                        </SheetClose>
                        {user && (
                          <>
                            <SheetClose asChild>
                              <Link
                                href="/dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-2xl font-light text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors py-3 border-b border-gray-100 dark:border-gray-800"
                              >
                                Dashboard
                              </Link>
                            </SheetClose>
                            <SheetClose asChild>
                              <Link
                                href="/dashboard/activity"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-2xl font-light text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors py-3 border-b border-gray-100 dark:border-gray-800"
                              >
                                Activity
                              </Link>
                            </SheetClose>
                          </>
                        )}
                        <SheetClose asChild>
                          <Link
                            href="/about"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-2xl font-light text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors py-3 border-b border-gray-100 dark:border-gray-800"
                          >
                            About
                          </Link>
                        </SheetClose>

                        {isTopicPage && (
                          <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-4">
                              Switch Subject Area
                            </p>
                            <div className="space-y-3">
                              {displayedNavTopics.map((topic: NavTopic) => (
                                <SheetClose asChild key={topic.id}>
                                  <Link
                                    href={`/topics/${topic.id}`}
                                    onClick={e => {
                                      if (
                                        extractDomainFromPath(pathname, 'topics') ===
                                        topic.id
                                      ) {
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
                                    className={`block py-3 text-xl font-light transition-colors duration-300 border-b border-gray-100 dark:border-gray-800 ${
                                      extractDomainFromPath(pathname, 'topics') ===
                                      topic.id
                                        ? 'text-primary dark:text-primary'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
                                    }`}
                                  >
                                    {topic.label}
                                  </Link>
                                </SheetClose>
                              ))}
                            </div>
                          </div>
                        )}
                      </nav>
                    </div>

                    {/* Account and Settings Section - Fixed at bottom */}
                    <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                      {user ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                            <Avatar className="w-14 h-14">
                              <AvatarImage
                                src={
                                  profile?.avatar_url &&
                                  profile.avatar_url.trim() !== ''
                                    ? profile.avatar_url
                                    : DEFAULT_AVATAR_URL
                                }
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
                            <div className="flex-1 min-w-0">
                              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                                {profile?.full_name ||
                                  profile?.username ||
                                  'User'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {user?.email || 'No email provided'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Account Button */}
                          <SheetClose asChild>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                router.push('/account');
                                setIsMobileMenuOpen(false);
                              }}
                              className="w-full justify-start font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 h-14 text-lg rounded-xl"
                            >
                              <UserIcon className="mr-4 h-6 w-6" /> Account Settings
                            </Button>
                          </SheetClose>
                          
                          {/* Theme Switcher and Sign Out */}
                          <div className="flex items-center justify-between w-full pt-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-base text-gray-600 dark:text-gray-400">Theme:</span>
                              <ThemeSwitcher />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleSignOut();
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors px-4 py-3 rounded-xl text-base"
                            >
                              <LogOut className="h-5 w-5 mr-3" />
                              Sign Out
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Theme:</span>
                              <ThemeSwitcher />
                            </div>
                          </div>
                          <SheetClose asChild>
                            <Link
                              href="/signin"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block w-full text-center px-6 py-4 text-lg font-medium text-white bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 rounded-xl transition-all duration-200"
                            >
                              Sign In
                            </Link>
                          </SheetClose>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                <ul className="flex gap-8 text-sm">
                  <li>
                    <Link
                      href="/topics"
                      onClick={handleTopicsLinkClick}
                      className="text-muted-foreground hover:text-accent-foreground block duration-150"
                    >
                      <span>Topics</span>
                    </Link>
                  </li>
                  {user && (
                    <>
                      <li>
                        <Link
                          href="/dashboard"
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span>Dashboard</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/activity"
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span>Activity</span>
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <Link
                      href="/about"
                      className="text-muted-foreground hover:text-accent-foreground block duration-150"
                    >
                      <span>About</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="hidden lg:flex flex-wrap items-center justify-end">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="group h-11 rounded-full px-2 gap-2 text-sm text-foreground hover:bg-transparent hover:bg-gray-100/50 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors border border-transparent hover:border-border/40"
                      >
                        <Avatar className="w-9 h-9 border border-gray-200 dark:border-gray-700">
                          <AvatarImage
                            src={
                              profile?.avatar_url &&
                              profile.avatar_url.trim() !== ''
                                ? profile.avatar_url
                                : DEFAULT_AVATAR_URL
                            }
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
                          <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                            {profile?.full_name || 'User'}
                          </p>
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
                          onClick={e => {
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
                  <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                    <Button asChild variant="ghost" size="sm" className={cn(isScrolled && 'lg:hidden')}>
                      <Link href="/signin">
                        <span>Login</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}
                    >
                      <Link href="/signin?mode=signup">
                        <span>Get Started</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div style={{ paddingTop: '80px' }}>
        <main
          className={
            isTopicDetailPage
              ? 'w-full px-4 sm:px-8 py-8'
              : 'w-full px-4 sm:px-8'
          }
        >
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