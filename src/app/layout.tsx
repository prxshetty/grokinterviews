import './globals.css';
import type { Metadata, Viewport } from 'next';
import ClientProviders from '@/components/client-providers';
import { cn } from '@/lib/utils';
import { Manrope } from 'next/font/google'
import { PPEditorialUltralight } from '@/fonts/pp-editorial';
import { CustomScrollArea } from '@/components/ui/custom-scroll-area';


const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
});



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

        {/* Font loading is handled automatically by Next.js */}

        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="preconnect" href="https://html.tailus.io" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />

        {/* DNS prefetch for analytics and external services */}
        <link rel="dns-prefetch" href="https://vitals.vercel-analytics.com" />
        <link rel="dns-prefetch" href="https://vercel-analytics.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />

        {/* Preload critical CSS - removed problematic hardcoded CSS link */}

        {/* Performance hints */}
        <meta name="description" content="Ace your tech interviews with an AI-enhanced platform. 3.6M+ resources, 50K+ questions across AI, Web Dev, System Design, DSA, and ML." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        manrope.variable,
        PPEditorialUltralight.variable
      )}>
        <ClientProviders>
          <CustomScrollArea>
            {children}
          </CustomScrollArea>
        </ClientProviders>
      </body>
    </html>
  );
}
