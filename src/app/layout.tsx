import type { Metadata } from "next";
import "./globals.css";
import TopicDataProvider from './components/TopicDataProvider';
import Footer from './components/Footer';
import { janelotus, playfairDisplay } from './fonts';
import MainNavigation from './components/MainNavigation';


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
    <html lang="en" className={`${janelotus.variable} ${playfairDisplay.variable}`}>

      <body className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300 relative">
        {/* Dark mode background */}
        <div className="fixed inset-0 z-[-1] opacity-10 dark:opacity-20 pointer-events-none hidden dark:block">
          <img
            src="/bg/dark.gif"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <TopicDataProvider>
          <div className="flex-grow">
            <MainNavigation>
              {children}
            </MainNavigation>
          </div>
          <Footer />
        </TopicDataProvider>
      </body>
    </html>
  );
}
