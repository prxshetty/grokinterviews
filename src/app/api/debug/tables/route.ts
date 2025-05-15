import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Debug endpoint to check table structure
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let userId = null;

  // Get the user session using Supabase auth
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session Error:', sessionError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    } else if (session?.user) {
      userId = session.user.id;
    } else {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error getting user session:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }

  try {
    // Get the table name from the query parameters
    const url = new URL(request.url);
    const tableName = url.searchParams.get('table');

    if (!tableName) {
      // List all tables
      const { data: tables, error: tablesError } = await supabaseServer.rpc('get_tables');
      
      if (tablesError) {
        console.error('Error listing tables:', tablesError);
        return NextResponse.json({ error: 'Failed to list tables' }, { status: 500 });
      }
      
      return NextResponse.json({ tables });
    }

    // Check if the table exists
    const { data: tableExists, error: tableExistsError } = await supabaseServer
      .from(tableName)
      .select('*')
      .limit(1);

    if (tableExistsError) {
      console.error(`Error checking if table ${tableName} exists:`, tableExistsError);
      return NextResponse.json({ 
        error: `Table ${tableName} does not exist or is not accessible`,
        details: tableExistsError
      }, { status: 404 });
    }

    // Get the table structure
    const { data: columns, error: columnsError } = await supabaseServer.rpc('get_table_columns', {
      table_name: tableName
    });

    if (columnsError) {
      console.error(`Error getting columns for table ${tableName}:`, columnsError);
      return NextResponse.json({ error: `Failed to get columns for table ${tableName}` }, { status: 500 });
    }

    // Get a sample of the data
    const { data: sample, error: sampleError } = await supabaseServer
      .from(tableName)
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error(`Error getting sample data for table ${tableName}:`, sampleError);
      return NextResponse.json({ error: `Failed to get sample data for table ${tableName}` }, { status: 500 });
    }

    // Get the count of records
    const { count, error: countError } = await supabaseServer
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`Error counting records in table ${tableName}:`, countError);
      return NextResponse.json({ error: `Failed to count records in table ${tableName}` }, { status: 500 });
    }

    // Return the table information
    return NextResponse.json({
      table: tableName,
      exists: true,
      columns,
      recordCount: count,
      sample
    });

  } catch (error) {
    console.error('Error in debug tables endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
