import './globals.css';
import { MainNavigation } from '@/components';
import { Footer } from '@/components';
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import { GeistSans, GeistMono } from 'geist/font';
import { ThemeProvider } from '@/components/theme-provider';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-next';
import { Suspense } from 'react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'GrokInterviews - AI-Powered Interview Preparation',
    template: '%s | GrokInterviews',
  },
  description: 'Ace your tech interviews with an AI-enhanced platform. 3.6M+ resources, 81K+ questions across AI, Web Dev, System Design, DSA, and ML.',
  keywords: ['interview preparation', 'coding interview', 'system design', 'AI', 'web development', 'DSA', 'machine learning'],
  authors: [{ name: 'GrokInterviews Team' }],
  creator: 'GrokInterviews',
  publisher: 'GrokInterviews',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml', sizes: '32x32' },
    ],
    apple: [
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grokinterviews.com',
    title: 'GrokInterviews - AI-Powered Interview Preparation',
    description: 'Ace your tech interviews with an AI-enhanced platform. 3.6M+ resources, 81K+ questions across AI, Web Dev, System Design, DSA, and ML.',
    siteName: 'GrokInterviews',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrokInterviews - AI-Powered Interview Preparation',
    description: 'Ace your tech interviews with an AI-enhanced platform. 3.6M+ resources, 81K+ questions across AI, Web Dev, System Design, DSA, and ML.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical Resource Hints for LCP Optimization */}
        
        {/* Preload critical fonts with high priority */}
        <link 
          rel="preload" 
          href="/_next/static/media/GeistVF.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          href="/_next/static/media/GeistMonoVF.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
        
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="preconnect" href="https://html.tailus.io" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        
        {/* DNS prefetch for analytics and external services */}
        <link rel="dns-prefetch" href="https://vitals.vercel-analytics.com" />
        <link rel="dns-prefetch" href="https://vercel-analytics.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        
        {/* Preload critical CSS */}
        <link rel="preload" href="/_next/static/css/app/layout.css" as="style" />
        
        {/* Performance hints */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        GeistSans.variable,
        GeistMono.variable
      )}>
        <TwentyFirstToolbar />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <AuthProvider>
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
            <Toaster />
            <Suspense fallback={null}>
              <SpeedInsights />
              <Analytics />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
