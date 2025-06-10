import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client for server-side only
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use service role key for server-side operations to bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL. Please check your environment variables.');
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Please add it to your environment variables.');
  console.error('You can find this key in your Supabase project dashboard under Settings > API.');
}

// Use service role key if available, otherwise fall back to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

// Log which key type we're using (without exposing the actual key)
if (supabaseServiceKey) {
  console.log('✅ Using Supabase service role key for server operations (RLS bypassed)');
} else {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found, using anon key. This may cause RLS issues.');
  console.warn('   Add SUPABASE_SERVICE_ROLE_KEY to your environment variables to fix this.');
}

const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist session in server context
    autoRefreshToken: false,
  },
  // When using service role key, we can bypass RLS
  db: {
    schema: 'public',
  },
  // Additional options for service role
  global: {
    headers: supabaseServiceKey ? {
      'Authorization': `Bearer ${supabaseServiceKey}`,
    } : {},
  },
});

export default supabaseServer;
