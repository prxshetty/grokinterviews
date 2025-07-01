'use client';
import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

const footerLinks = [
	{ title: 'About', href: '/about' },
	{ title: 'Privacy', href: '/privacy' },
	{ title: 'Terms', href: '/terms' },
	{ title: 'Topics', href: '/topics' },
	{ title: 'Dashboard', href: '/dashboard' },
];

export function Footer() {
	return (
<footer className="w-full border-t bg-background px-16 py-3">
	<div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
		{/* Logo and Copyright */}
		<div className="flex items-center space-x-4">
			<Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
				<Logo size="sm" showText={true} />
			</Link>
			<span className="text-gray-600 dark:text-gray-400">
				© {new Date().getFullYear()} GrokInterviews
			</span>
		</div>

				{/* Navigation Links */}
				<div className="flex items-center space-x-4">
					{footerLinks.map((link) => (
						<Link
							key={link.title}
							href={link.href}
							className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
						>
							{link.title}
						</Link>
					))}
				</div>
			</div>
		</footer>
	);
} 