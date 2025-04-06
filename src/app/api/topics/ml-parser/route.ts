import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

// Cache the results for better performance
const CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds
let cachedData: any = null;
let lastFetchTime = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Check if we have cached data and it's still valid
    const now = Date.now();
    if (!forceRefresh && cachedData && (now - lastFetchTime < CACHE_DURATION)) {
      console.log('Returning cached ML topic data');
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      });
    }
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'query_ml_topics.py');
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`ML parser script not found at ${scriptPath}`);
      return NextResponse.json(
        { error: 'ML parser script not found' },
        { status: 500 }
      );
    }
    
    // Execute the Python script
    console.log(`Executing ML parser script: ${scriptPath}`);
    const { stdout, stderr } = await execPromise(`python ${scriptPath}`);
    
    if (stderr) {
      console.error(`Error executing ML parser script: ${stderr}`);
      return NextResponse.json(
        { error: 'Failed to execute ML parser script', details: stderr },
        { status: 500 }
      );
    }
    
    // Parse the output as JSON
    try {
      const data = JSON.parse(stdout);
      
      // Cache the results
      cachedData = data;
      lastFetchTime = now;
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      });
    } catch (parseError) {
      console.error('Error parsing ML parser output:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse ML parser output', details: parseError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in ML parser API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
