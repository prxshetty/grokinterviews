'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useImagePreloader } from '@/hooks';
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
import { MAIN_NAV_TOPICS, DEFAULT_AVATAR_URL } from '@/config';
import { cn } from '@/lib/utils';
import { useStreak } from '@/hooks/useStreak';
import { StreakBadge } from '@/components/ui/streak-badge';

export default function MainNavigation({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [showPasswordResetReminder, setShowPasswordResetReminder] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Use the shared auth state from the provider
  const { user, profile, signOut, supabase, refreshAuth } = useAuth();
  const { current_streak, highest_streak, isLoading, error, refresh } = useStreak();

  // Fix missing avatar URL from Google sign-in
  useEffect(() => {
    const fixMissingAvatar = async () => {
      // Check if user has avatar in metadata but profile doesn't have it
      if (
        user?.user_metadata?.avatar_url &&
        profile &&
        (!profile.avatar_url || profile.avatar_url.trim() === '')
      ) {
        console.log('Fixing missing avatar URL from Google metadata');
        
        if (supabase) {
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: user.user_metadata.avatar_url })
            .eq('id', user.id);
          
          if (error) {
            console.error('Failed to update avatar URL:', error);
          } else {
            console.log('Successfully updated avatar URL from Google metadata');
            // Refresh auth to get updated profile
            await refreshAuth();
          }
        }
      }
    };

    fixMissingAvatar();
  }, [user, profile, supabase, refreshAuth]);

  // Preload avatar images for instant loading
  const avatarUrls = [DEFAULT_AVATAR_URL];
  if (profile?.avatar_url && profile.avatar_url.trim() !== '') {
    avatarUrls.push(profile.avatar_url);
  }
  if (user?.user_metadata?.avatar_url && user.user_metadata.avatar_url.trim() !== '') {
    avatarUrls.push(user.user_metadata.avatar_url);
  }
  useImagePreloader(avatarUrls, true);

  // Handle streak error and auto-refresh
  const handleStreakError = useCallback(async () => {
    if (error) {
      console.error('Streak error:', error);
      // Try to refresh after a delay if there's an error
      await new Promise(resolve => setTimeout(resolve, 5000));
      await refresh();
    }
  }, [error, refresh]);

  useEffect(() => {
    handleStreakError();
  }, [handleStreakError]);

  // AI domain cleanup completed - now showing all navigation topics
  const displayedNavTopics = MAIN_NAV_TOPICS;

  const isTopicPage = pathname.startsWith('/topics');
  const isTopicDetailPage = isTopicPage && pathname !== '/topics';
  const isHomePage = pathname === '/';
  const isAuroraPage = pathname === '/about' || pathname === '/signin';

  const extractDomainFromPath = (path: string, section: 'topics') => {
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === section) {
      return parts[2];
    }
    return null;
  };

  // Get the current domain and its display name
  const currentDomain = extractDomainFromPath(pathname, 'topics');
  const currentDomainLabel = currentDomain ? 
    displayedNavTopics.find(topic => topic.id === currentDomain)?.label || 'Topics' : 
    'Topics';

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
        showText={!isScrolled} 
        className="text-black dark:text-white" 
        textClassName="text-lg md:text-xl font-semi tracking-widest uppercase text-[9px]"
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
              'mx-auto mt-2 transition-all duration-300',
              isScrolled 
                ? 'max-w-4xl px-6 lg:px-5 bg-background/50 rounded-2xl border backdrop-blur-lg'
                : 'max-w-full px-6 lg:px-12 bg-transparent'
            )}
          >
            <div className={cn(
              "relative flex flex-wrap items-center gap-6 py-3 lg:gap-0 lg:py-4",
              isScrolled 
                ? "justify-between"
                : "justify-between lg:w-full"
            )}>
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
                                  <span className="ml-2 inline-flex items-center rounded-full px-1 py-0.5 text-[8px] font-semibold tracking-widest uppercase bg-gradient-to-r from-cyan-400/30 to-purple-500/30 text-cyan-700 dark:text-cyan-200 border border-cyan-400/30 dark:border-cyan-300/20 backdrop-blur-sm shadow-sm" style={{lineHeight: '1.1'}}>
                                    BETA
                                  </span>
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
                      <div className="border-t border-border/20 p-6">
                        {user ? (
                          <div className="space-y-4">
                            {/* User Info */}
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700">
                                <AvatarImage
                                  key={profile?.avatar_url || DEFAULT_AVATAR_URL}
                                  src={
                                    profile?.avatar_url &&
                                    profile.avatar_url.trim() !== ''
                                      ? profile.avatar_url
                                      : DEFAULT_AVATAR_URL
                                  }
                                  alt="User avatar"
                                  style={{ objectFit: 'cover' }}
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
                                <p className="text-sm font-medium text-foreground truncate">
                                  {profile?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user?.email || 'No email provided'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="space-y-2">
                              <SheetClose asChild>
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    router.push('/account');
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="w-full justify-start h-10 px-3 text-sm font-medium"
                                >
                                  <UserIcon className="mr-3 h-4 w-4" />
                                  Account Settings
                                </Button>
                              </SheetClose>
                              
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">Theme</span>
                                  <ThemeSwitcher />
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSignOut}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3"
                                >
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Sign Out
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Theme</span>
                                <ThemeSwitcher />
                              </div>
                            </div>
                            
                            <SheetClose asChild>
                              <Button
                                asChild
                                className="w-full h-10"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <Link href="/signin">Sign In</Link>
                              </Button>
                            </SheetClose>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className={cn(
                "hidden lg:block",
                isScrolled 
                  ? "absolute inset-0 m-auto size-fit"
                  : "lg:flex-1 lg:justify-center lg:flex"
              )}>
                <ul className="flex gap-8 text-sm">
                  <li>
                    <Link
                      href="/topics"
                      onClick={handleTopicsLinkClick}
                      className="text-muted-foreground hover:text-accent-foreground block duration-150"
                    >
                      <span>{currentDomainLabel}</span>
                    </Link>
                  </li>
                  {user && (
                    <>
                      <li>
                        <Link
                          href="/dashboard"
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span className="flex items-center">
                            Dashboard
                            <span className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-widest uppercase bg-gradient-to-r from-cyan-400/20 to-purple-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-400/30 dark:border-cyan-300/20 backdrop-blur-sm shadow-sm" style={{lineHeight: '1.1'}}>BETA</span>
                          </span>
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

              <div className={cn(
                "hidden lg:flex flex-wrap items-center",
                isScrolled ? "justify-end" : "justify-end lg:ml-auto"
              )}>
                {user ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="group h-11 rounded-full px-2 gap-2 text-sm text-foreground hover:bg-transparent hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-border/40"
                        >
                          <Avatar className="w-9 h-9 border border-gray-200 dark:border-gray-700">
                            <AvatarImage
                              key={profile?.avatar_url || DEFAULT_AVATAR_URL}
                              src={
                                profile?.avatar_url &&
                                profile.avatar_url.trim() !== ''
                                  ? profile.avatar_url
                                  : DEFAULT_AVATAR_URL
                              }
                              alt="Profile picture"
                              style={{ objectFit: 'cover' }}
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
                        className="w-56 bg-background/80 dark:bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg rounded-lg overflow-hidden p-1.5 mt-1"
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
                    {!isLoading && !error && (
                      <StreakBadge
                        currentStreak={current_streak}
                        highestStreak={highest_streak}
                        className="ml-2"
                      />
                    )}
                  </>
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

      <div style={{ paddingTop: isHomePage || isAuroraPage ? '0px' : '80px' }}>
        <main
          className={
            isHomePage
              ? 'w-full'
              : isTopicDetailPage
              ? 'w-full px-4 sm:px-8 py-8'
              : 'w-full'
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