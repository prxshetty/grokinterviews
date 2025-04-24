import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Creates a Supabase client for use in API routes without using cookies
 * This avoids the cookie-related errors in Next.js
 */
export function createSupabaseRouteClient() {
  // Initialize the Supabase client for server-side only
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
  }

  // Create a Supabase client without auth for server-side operations
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Gets the user ID from the request headers
 * This is a workaround for the cookie-related errors in Next.js
 * @param request The Next.js request object
 * @returns The user ID or null if not found
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Create a Supabase client
    const supabase = createSupabaseRouteClient();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract the token
      const token = authHeader.substring(7);

      // Verify the token
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        console.error('Error verifying token:', error);
        return null;
      }

      return data?.user?.id || null;
    }

    // If no authorization header, try to get the session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
