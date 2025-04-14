import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client for server-side only
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
}

const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist session in server context
    autoRefreshToken: false,
  },
});

export default supabaseServer;
