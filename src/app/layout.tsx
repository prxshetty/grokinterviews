import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalNavWrapper from './components/ConditionalNavWrapper';
import TopicDataProvider from './components/TopicDataProvider';
import Footer from './components/Footer';

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
      <body className="min-h-screen bg-white dark:bg-black dark:text-white flex flex-col">
        <TopicDataProvider>
          <div className="flex-grow">
            <ConditionalNavWrapper>
              {children}
            </ConditionalNavWrapper>
          </div>
          <Footer />
        </TopicDataProvider>
      </body>
    </html>
  );
}
