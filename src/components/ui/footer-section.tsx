'use client';
import Link from 'next/link';
import { Github } from 'lucide-react';

const footerLinks = [
  { title: 'About', href: '/about' },
  { title: 'Privacy', href: '/privacy' },
  { title: 'Terms', href: '/terms' },
  { title: 'Topics', href: '/topics' },
  { title: 'Voice', href: '/voice' },
];

export function Footer() {
  return (
    <footer className="w-full  bg-background relative z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                aria-label="Home"
              >
                <svg
                  className="w-8 h-8 flex-shrink-0"
                  viewBox="0 0 1200 1200"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <g transform="scale(14.876031807216355) translate(-4.6666632758246545, -4.666666136847602)">
                    <g fill="currentColor">
                      <polygon points="71,48.7 71,18.2 54.8,9 38.7,9 63,22.8 63,36.7 63,53.3" />
                      <polygon points="29,66 54.8,81 54.7,81 55.1,81.3 71.7,71.7 79.7,57.8 55.3,72 29,56.8" />
                      <polygon points="61.2,57 61.3,57 46.9,65.2 54.8,69.8 81,54.5 81,35.2 73,21.3 73,49.8" />
                      <polygon points="61,23.9 34.8,8.7 18.2,18.3 10.2,32.3 35,18 47,25 46.8,25 61,33.2" />
                      <polygon points="35.2,20.3 9,35.6 9,54.8 17,68.7 17,40.2 28.8,33.2 28.8,33.2 43.2,24.9" />
                      <polygon points="19,41.3 19,71.8 35.2,81 51.4,81 27,67.2 27,53.3 27,36.7" />
                    </g>
                  </g>
                </svg>
                <span className="font-normal tracking-tight text-xl">
                  Grok Interviews
                </span>
              </Link>
              <div className="flex items-center border-l border-foreground/10 pl-3 ml-1">
                <Link
                  href="https://github.com/prxshetty/grokinterviews"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-foreground/50 hover:text-foreground transition-colors"
                  aria-label="View Source on GitHub"
                >
                  <Github className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="text-foreground/60 hover:text-foreground transition-colors duration-200"
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
