'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from 'lucide-react';
import Link from 'next/link';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Topics', href: '/topics' },
			{ title: 'Dashboard', href: '/dashboard' },
			{ title: 'Bookmarks', href: '/dashboard/bookmarks' },
			{ title: 'Activity', href: '/dashboard/activity' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About Us', href: '/about' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Terms of Service', href: '/terms' },
			{ title: 'Contact', href: '/contact' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Blog', href: '/blog' },
			{ title: 'Help Center', href: '/help' },
			{ title: 'Documentation', href: '/docs' },
			{ title: 'API', href: '/api-docs' },
		],
	},
];

export function Footer() {
	return (
		<footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
			<div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full grid-cols-2 gap-8 md:grid-cols-3">
				{footerLinks.map((section, index) => (
					<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
						<div className="mb-10 md:mb-0">
							<h3 className="text-xs font-medium uppercase tracking-wider">{section.label}</h3>
							<ul className="text-muted-foreground mt-4 space-y-2 text-sm">
								{section.links.map((link) => (
									<li key={link.title}>
										<Link
											href={link.href}
											className="hover:text-foreground inline-flex items-center transition-all duration-300"
										>
											{link.icon && <link.icon className="me-1 size-4" />}
											{link.title}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</AnimatedContainer>
				))}
			</div>
			<p className="text-muted-foreground mt-12 text-center text-sm">
				© {new Date().getFullYear()} GrokInterviews. All rights reserved.
			</p>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
} 