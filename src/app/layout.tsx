import './globals.css';
import { MainNavigation } from '@/components';
import { TopicDataProvider } from '@/components';
import { Footer } from '@/components';
import { Toaster } from "@/components/ui";
import { janelotus, playfairDisplay } from './fonts';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'GrokInterviews - AI-Powered Interview Preparation',
  description: 'Ace your tech interviews with an AI-enhanced platform. 3.6M+ resources, 81K+ questions across AI, Web Dev, System Design, DSA, and ML.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${janelotus.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300">
        <TopicDataProvider>
          <div className="flex-grow">
            <MainNavigation>
              {children}
            </MainNavigation>
          </div>
          <Footer />
        </TopicDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
