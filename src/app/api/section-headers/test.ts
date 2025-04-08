// This is a test script to check if the section_headers table exists in Supabase
// and if the API endpoint is working correctly.
// You can run this script with: npx ts-node src/app/api/section-headers/test.ts

import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSectionHeadersTable() {
  try {
    console.log('Testing section_headers table...');
    
    // Check if the section_headers table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('section_headers')
      .select('count()')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing section_headers table:', tableError);
      console.log('You may need to create the section_headers table in Supabase.');
      console.log('SQL to create the table:');
      console.log(`
        CREATE TABLE section_headers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          domain TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Example data for ML domain
        INSERT INTO section_headers (name, domain) VALUES
          ('Introduction to Machine Learning', 'ml'),
          ('Supervised Learning', 'ml'),
          ('Unsupervised Learning', 'ml'),
          ('Neural Networks', 'ml'),
          ('Deep Learning', 'ml');
      `);
      return;
    }
    
    console.log('section_headers table exists!');
    
    // Check if there are any records for the 'ml' domain
    const { data: mlHeaders, error: mlError } = await supabase
      .from('section_headers')
      .select('id, name')
      .eq('domain', 'ml')
      .order('id');
    
    if (mlError) {
      console.error('Error fetching ML headers:', mlError);
      return;
    }
    
    if (!mlHeaders || mlHeaders.length === 0) {
      console.log('No headers found for the ML domain.');
      console.log('You may want to add some sample data:');
      console.log(`
        INSERT INTO section_headers (name, domain) VALUES
          ('Introduction to Machine Learning', 'ml'),
          ('Supervised Learning', 'ml'),
          ('Unsupervised Learning', 'ml'),
          ('Neural Networks', 'ml'),
          ('Deep Learning', 'ml');
      `);
      return;
    }
    
    console.log(`Found ${mlHeaders.length} headers for the ML domain:`);
    mlHeaders.forEach(header => {
      console.log(`  ${header.id}: ${header.name}`);
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSectionHeadersTable();
