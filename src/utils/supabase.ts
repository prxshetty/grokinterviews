import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// Use NEXT_PUBLIC_ prefix for client-side environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || '';

// Only show error in server context to avoid console errors in the browser
if (typeof window === 'undefined' && (!supabaseUrl || !supabaseKey)) {
  console.error('Missing Supabase credentials. Please check your .env file.');
}

// Create a dummy client if credentials are missing (for client-side)
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder-url.supabase.co', 'placeholder-key');

export default supabase;
