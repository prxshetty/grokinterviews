'use client';
import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

const footerLinks = [
	{ title: 'About', href: '/about' },
	{ title: 'Privacy', href: '/privacy' },
	{ title: 'Terms', href: '/terms' },
	{ title: 'Topics', href: '/topics' },
];

export function Footer() {
	return (
<footer className="w-full border-t border-gray-100 dark:border-gray-800 bg-background/95 backdrop-blur-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Logo and Copyright */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link 
          href="/" 
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label="Home"
        >
          <Logo size="sm" showText={true} />
        </Link>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          © {new Date().getFullYear()} GrokInterviews. All rights reserved.
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {footerLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
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
