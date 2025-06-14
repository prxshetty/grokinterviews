import './globals.css';
import { MainNavigation } from '@/components';
import { TopicDataProvider } from '@/components';
import { Footer } from '@/components';
import { Toaster } from "@/components/ui";
import { janelotus, playfairDisplay } from './fonts';

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
