import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from './components/Navbar';
import TopicNavWrapper from './components/TopicNavWrapper';
import TopicDataProvider from './components/TopicDataProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grok Interviews",
  description: "Master your technical interviews with comprehensive guides and practice",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-black dark:text-white">
        <TopicDataProvider>
          <Navbar />
          <TopicNavWrapper />
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </TopicDataProvider>
      </body>
    </html>
  );
}
