'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { isAIConfigured } from '@/utils/ai-config-storage';

const EXCLUDED_PATHS = [
    '/account',
    '/signin',
    '/signup',
    '/privacy',
    '/terms',
    '/about',
];

export function APIConfigRedirect() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);


    useEffect(() => {
        if (!mounted || loading) return;
        if (!user) return;

        const isExcluded = EXCLUDED_PATHS.some(path =>
            pathname === path || pathname?.startsWith(`${path}/`)
        );

        if (isExcluded) {
            return;
        }
        const hasBeenRedirected = sessionStorage.getItem('grok_api_redirected');

        if (!isAIConfigured() && !hasBeenRedirected) {
            sessionStorage.setItem('grok_api_redirected', 'true');
            router.push('/account');
        }
    }, [user, loading, pathname, router, mounted]);

    return null;
}
