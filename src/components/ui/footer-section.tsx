'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { Github } from 'lucide-react';

const footerLinks = [
  { title: 'About', href: '/about' },
  { title: 'Privacy', href: '/privacy' },
  { title: 'Terms', href: '/terms' },
  { title: 'Topics', href: '/topics' },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-background relative z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Home"
            >
              <Logo size="sm" showText={true} />
            </Link>
            <span className="text-sm text-foreground/70 font-medium">
              © {new Date().getFullYear()} GrokInterviews. All rights reserved.
            </span>
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
            <Link
              href="https://github.com/prxshetty/grokinterviews"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-foreground transition-colors duration-200 flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
