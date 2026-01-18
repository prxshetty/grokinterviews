import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service role key.
 * This bypasses RLS and should ONLY be used in:
 * - Server-side API routes
 * - Local development when SUPABASE_SERVICE_ROLE_KEY is set
 * 
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local for local development.');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });
}

export function shouldUseAdminClient(): boolean {
    return process.env.NODE_ENV === 'development' && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
