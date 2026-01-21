'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Component that handles scroll behavior for Next.js App Router.
 * 
 *
 * In production builds, browser scroll restoration can conflict with
 * manual scroll-to-top calls. This component:
 * 1. Disables browser's automatic scroll restoration
 * 2. Scrolls to top on route changes (when pathname changes)
 */
export function ScrollRestoration() {
    const pathname = usePathname();

    // Disable browser scroll restoration on mount
    useEffect(() => {
        if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) {
            return undefined;
        }

        // Store original value
        const originalScrollRestoration = window.history.scrollRestoration;

        // Set to manual to prevent browser from auto-restoring scroll position
        window.history.scrollRestoration = 'manual';

        return () => {
            // Restore original value on unmount
            window.history.scrollRestoration = originalScrollRestoration;
        };
    }, []);

    // Scroll to top when pathname changes
    useEffect(() => {
        // Only scroll for topics and questions pages where we have the absolute nav
        if (!pathname?.startsWith('/topics') && !pathname?.startsWith('/questions')) {
            return undefined;
        }

        // Use setTimeout to ensure this runs after any layout changes
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }, 0);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}

export default ScrollRestoration;
