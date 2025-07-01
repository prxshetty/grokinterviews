import './globals.css';
import { MainNavigation } from '@/components';
import { Footer } from '@/components';
import { Toaster } from "@/components/ui/sonner";
import { janelotus, playfairDisplay } from './fonts';
import type { Metadata } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import { GeistSans, GeistMono } from 'geist/font';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'GrokInterviews - AI-Powered Interview Preparation',
  description: 'Ace your tech interviews with an AI-enhanced platform. 3.6M+ resources, 81K+ questions across AI, Web Dev, System Design, DSA, and ML.',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${janelotus.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-white dark:bg-black font-sans antialiased',
        GeistSans.variable,
        GeistMono.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <div className="flex-grow">
                <MainNavigation>
                  {children}
                </MainNavigation>
              </div>
              <Footer />
            </div>
            <Toaster />
            <SpeedInsights />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
