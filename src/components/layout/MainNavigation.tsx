'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useImagePreloader } from '@/hooks';
import { LogOut, Menu, X, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { MAIN_NAV_TOPICS, DEFAULT_AVATAR_URL } from '@/config';
import { cn } from '@/lib/utils';
import { useStreak } from '@/hooks/useStreak';
import { StreakBadge } from '@/components/ui/streak-badge';
import { toast } from 'sonner';

// Memoized Logo component to prevent unnecessary re-renders
const MemoizedLogo = memo(({ isScrolled }: { isScrolled: boolean }) => (
  <Link href="/" className="flex items-center whitespace-nowrap">
    <Logo 
      size="md" 
      showText={!isScrolled} 
      className="text-black dark:text-white" 
      textClassName="text-lg md:text-xl font-semi tracking-widest uppercase text-[9px]"
    />
  </Link>
));
MemoizedLogo.displayName = 'MemoizedLogo';

// Memoized navigation links to prevent re-renders
const MemoizedNavLinks = memo(({ 
  currentDomainLabel, 
  user
}: { 
  currentDomainLabel: string;
  user: any;
}) => (
  <div className="flex items-center space-x-8">
    <Link
      href="/topics"
      className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
    >
      {currentDomainLabel}
    </Link>
    
    {user && (
      <>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/bookmarks"
          className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          Bookmarks
        </Link>
      </>
    )}
    
    <Link
      href="/about"
      className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
    >
      About
    </Link>
  </div>
));
MemoizedNavLinks.displayName = 'MemoizedNavLinks';

function MainNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPasswordResetReminder, setShowPasswordResetReminder] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Use the shared auth state from the provider
  const { user, profile, signOut, supabase, refreshAuth } = useAuth();
  const { current_streak, highest_streak, isLoading, error, refresh, invalidateCache } = useStreak(!!user);

  // Track previous streak values for toast notifications
  const prevStreakRef = useRef<{ current: number; highest: number } | null>(null);

  // Optimized initialization with throttled scroll handler
  useEffect(() => {
    // Set mounted state
    setMounted(true);

    // Throttled scroll handler for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Check password reset reminder only once
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const dismissed = sessionStorage.getItem('globalPasswordResetReminderDismissed');
    
    if (mode === 'reset' && !dismissed) {
      setShowPasswordResetReminder(true);
    }

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Optimize avatar fix with debouncing and memoization
  const shouldFixAvatar = useMemo(() => {
    return user?.user_metadata?.avatar_url && 
           (!profile?.avatar_url || profile.avatar_url.trim() === '');
  }, [user?.user_metadata?.avatar_url, profile?.avatar_url]);

  useEffect(() => {
    if (!shouldFixAvatar || !supabase || !user) return;
    
    let timeoutId: NodeJS.Timeout;
    const fixMissingAvatar = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: user.user_metadata.avatar_url })
          .eq('id', user.id);
        
        if (!error) {
          // Debounce auth refresh to prevent excessive calls
          timeoutId = setTimeout(() => refreshAuth(), 100);
        }
      } catch {
        // Silent error handling for production
      }
    };

    fixMissingAvatar();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [shouldFixAvatar, supabase, user, refreshAuth]);

  // Memoize avatar URLs to prevent unnecessary preloader calls
  const avatarUrls = useMemo(() => {
    const urls = [DEFAULT_AVATAR_URL];
    if (profile?.avatar_url?.trim()) {
      urls.push(profile.avatar_url);
    }
    if (user?.user_metadata?.avatar_url?.trim()) {
      urls.push(user.user_metadata.avatar_url);
    }
    return urls;
  }, [profile?.avatar_url, user?.user_metadata?.avatar_url]);
  
  useImagePreloader(avatarUrls, true);

  // Optimize streak error handling with exponential backoff
  const retryCountRef = useRef(0);
  useEffect(() => {
    if (!error || retryCountRef.current >= 3) return;
    
    const handleStreakError = async () => {
      try {
        retryCountRef.current++;
        invalidateCache();
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCountRef.current - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        await refresh();
      } catch {
        // Silent error handling
      }
    };

    handleStreakError();
  }, [error, refresh, invalidateCache]);

  // Optimized streak change detection for toast notifications
  useEffect(() => {
    // Only show toasts for authenticated users with valid streak data
    if (!user || isLoading || error) return;
    
    // Skip on initial load when prevStreakRef is null
    if (prevStreakRef.current === null) {
      prevStreakRef.current = { current: current_streak, highest: highest_streak };
      return;
    }
    
    const prevStreak = prevStreakRef.current;
    const streakIncreased = current_streak > prevStreak.current;
    const newHighestStreak = highest_streak > prevStreak.highest;
    
    // Show toast only when streak actually increases
    if (streakIncreased) {
      if (newHighestStreak) {
        // New personal best!
        toast.success(`🔥 New record! ${current_streak} day streak!`, {
          description: `You've beaten your previous best of ${prevStreak.highest} days`,
          duration: 4000,
        });
      } else if (current_streak === 1) {
        // Starting a new streak
        toast.success(`🚀 Streak started!`, {
          description: `Great job! Keep it up to build your streak`,
          duration: 3000,
        });
      } else {
        // Regular streak increase
        toast.success(`🔥 ${current_streak} day streak!`, {
          description: `You're on fire! Keep the momentum going`,
          duration: 3000,
        });
      }
    }
    
    // Update the previous values
    prevStreakRef.current = { current: current_streak, highest: highest_streak };
  }, [user, current_streak, highest_streak, isLoading, error]);

  // Memoize navigation topics and domain extraction for performance
  const displayedNavTopics = useMemo(() => MAIN_NAV_TOPICS, []);
  
  const extractDomainFromPath = useCallback((path: string, section: 'topics') => {
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === section) {
      return parts[2];
    }
    return null;
  }, []);

  // Memoize current domain calculation
  const currentDomainLabel = useMemo(() => {
    const domain = extractDomainFromPath(pathname, 'topics');
    return domain ? 
      displayedNavTopics.find(topic => topic.id === domain)?.label || 'Topics' : 
      'Topics';
  }, [pathname, displayedNavTopics, extractDomainFromPath]);

  const handleTopicsLinkClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, [setIsMobileMenuOpen]);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
    router.push('/');
  };

  // Use memoized logo component
  const logoElement = useMemo(() => (
    <MemoizedLogo isScrolled={isScrolled} />
  ), [isScrolled]);

  const dismissPasswordResetReminder = () => {
    setShowPasswordResetReminder(false);
    sessionStorage.setItem('globalPasswordResetReminderDismissed', 'true');
  };

  // Show invisible placeholder during SSR to prevent layout shift, then show content immediately
  if (!mounted) {
    return (
      <>
        {/* Invisible placeholder that matches exact final layout */}
        <header>
          <nav className="fixed z-20 w-full px-2 group top-0 left-0 right-0">
            <div className={cn(
              'mx-auto mt-2 px-3 sm:px-4 md:px-6 transition-all duration-300',
              'max-w-7xl'
            )}>
              <div className={cn(
                'relative flex flex-wrap items-center justify-between gap-4 py-3 lg:w-full lg:gap-0 lg:py-4',
                'max-w-[100vw]'
              )}>
                <div className="flex w-full justify-between lg:w-auto">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 opacity-0" /> {/* Invisible logo placeholder */}
                  </div>
                  <div className="lg:hidden">
                    <div className="w-6 h-6 opacity-0" /> {/* Invisible menu button placeholder */}
                  </div>
                </div>
                <div className="hidden lg:flex lg:items-center lg:space-x-4">
                  <div className="flex items-center space-x-8">
                    <div className="h-4 w-16 opacity-0" />
                    <div className="h-4 w-20 opacity-0" />
                    <div className="h-4 w-16 opacity-0" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-16 opacity-0" />
                    <div className="h-8 w-20 opacity-0" />
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>
        <main className="flex-1 w-full overflow-x-hidden pt-16">
          {children}
        </main>
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
          className="fixed z-20 w-full px-2 group top-0 left-0 right-0"
        >
          <div
            className={cn(
              'mx-auto mt-2 px-3 sm:px-4 md:px-6 transition-all duration-300',
              isScrolled
                ? 'max-w-5xl rounded-2xl border bg-background/80 dark:bg-background/70 backdrop-blur-lg'
                : 'max-w-7xl'
            )}
          >
            <div
              className={cn(
                'relative flex flex-wrap items-center justify-between gap-4 py-3 lg:w-full lg:gap-0 lg:py-4',
                'max-w-[100vw]'
              )}
            >
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
                    className="w-full max-w-sm bg-background border-l border-border/20 p-0 flex flex-col h-full"
                  >
                    <SheetHeader className="sr-only">
                      <SheetTitle>Navigation Menu</SheetTitle>
                    </SheetHeader>
                    
                    {/* Clean, minimal mobile menu */}
                    <div className="flex flex-col h-full">
                      {/* Navigation Links */}
                      <nav className="flex-1 px-6 py-8">
                        <div className="space-y-1">
                          <SheetClose asChild>
                            <Link
                              href="/topics"
                              onClick={handleTopicsLinkClick}
                              className="flex items-center px-3 py-4 text-lg font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-colors"
                            >
                              {currentDomainLabel}
                            </Link>
                          </SheetClose>
                          
                          {user && (
                            <>
                              <SheetClose asChild>
                                <Link
                                  href="/dashboard"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center px-3 py-4 text-lg font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-colors"
                                >
                                  Dashboard
                                </Link>
                              </SheetClose>
                              <SheetClose asChild>
                                <Link
                                  href="/dashboard/bookmarks"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center px-3 py-4 text-lg font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-colors"
                                >
                                  Bookmarks
                                </Link>
                              </SheetClose>
                            </>
                          )}
                          
                          <SheetClose asChild>
                            <Link
                              href="/about"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center px-3 py-4 text-lg font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-colors"
                            >
                              About
                            </Link>
                          </SheetClose>
                        </div>
                      </nav>

                      {/* User Section */}
                      <div className="px-6 py-6 border-t border-border/20">
                        {user ? (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={profile?.avatar_url || user.user_metadata?.avatar_url || DEFAULT_AVATAR_URL} 
                                  alt={profile?.full_name || user.email || 'User'} 
                                />
                                <AvatarFallback>
                                  {profile?.full_name?.[0] || user.email?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {profile?.full_name || user.email}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <SheetClose asChild>
                                <Link
                                  href="/account"
                                  className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Account
                                </Link>
                              </SheetClose>
                              <button
                                onClick={handleSignOut}
                                className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <SheetClose asChild>
                              <Link href="/signin" className="w-full">
                                <Button variant="default" className="w-full">
                                  Sign In
                                </Button>
                              </Link>
                            </SheetClose>
                            <SheetClose asChild>
                              <Link href="/auth/signup" className="w-full">
                                <Button variant="outline" className="w-full">
                                  Sign Up
                                </Button>
                              </Link>
                            </SheetClose>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Navigation - Memoized */}
              <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
                <MemoizedNavLinks 
                  currentDomainLabel={currentDomainLabel}
                  user={user}
                />
              </div>

              {/* User Section - Right aligned */}
              <div className="hidden lg:flex lg:items-center lg:space-x-4">
                {user ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center space-x-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={profile?.avatar_url || user.user_metadata?.avatar_url || DEFAULT_AVATAR_URL} 
                              alt={profile?.full_name || user.email || 'User'} 
                            />
                            <AvatarFallback>
                              {profile?.full_name?.[0] || user.email?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-all ease-in-out group-data-[state=open]:rotate-180" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={profile?.avatar_url || user.user_metadata?.avatar_url || DEFAULT_AVATAR_URL} 
                                alt={profile?.full_name || user.email || 'User'} 
                              />
                              <AvatarFallback>
                                {profile?.full_name?.[0] || user.email?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {profile?.full_name || user.email}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Account
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="p-2 flex items-center justify-between">
                          <ThemeSwitcher />
                          <button
                            onClick={handleSignOut}
                            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            aria-label="Sign Out"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {!error && (
                      <StreakBadge
                        currentStreak={current_streak}
                        highestStreak={highest_streak}
                        isLoading={isLoading}
                        className="ml-2"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link href="/signin">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button variant="default" size="sm">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="flex-1 w-full overflow-x-hidden pt-16">
        {children}
      </main>
    </>
  );
}

export default MainNavigation;