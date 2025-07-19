'use client';

import { usePathname } from 'next/navigation';
import { MainNavigation } from '@/components';
import { Footer } from '@/components';
import { Suspense } from 'react';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current page is privacy or terms
  const isLegalPage = pathname === '/privacy' || pathname === '/terms';
  
  // For legal pages, render children without navigation, footer, and aurora background
  if (isLegalPage) {
    return (
      <div className="flex flex-col min-h-[100dvh] w-full relative bg-background">
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    );
  }
  
  // For all other pages, render with navigation, footer, and aurora background
  return (
    <div className="flex flex-col min-h-[100dvh] w-full relative">
      {/* Aurora background covering entire viewport */}
      <div className="fixed inset-0 z-0">
        <div className="[--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)] [background-image:var(--white-gradient),var(--aurora)] dark:[background-image:var(--dark-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] filter blur-[3px] invert dark:invert-0 after:content-[''] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:dark:[background-image:var(--dark-gradient),var(--aurora)] after:[background-size:200%,_100%] after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference pointer-events-none absolute -inset-[10px] opacity-30 will-change-transform [mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]" />
      </div>
      
      {/* Content layer */}
      <div className="flex-1 w-full relative z-10">
        <MainNavigation>
          {children}
        </MainNavigation>
      </div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}