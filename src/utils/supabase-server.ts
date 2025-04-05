import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client for server-side only
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
}

const supabaseServer = createClient(supabaseUrl, supabaseKey);

export default supabaseServer;
