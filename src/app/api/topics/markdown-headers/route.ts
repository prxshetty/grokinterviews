import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache the results for better performance
const CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds
let cachedData: Record<string, any> = {};
let lastFetchTime: Record<string, number> = {};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const topicId = url.searchParams.get('topicId');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }
    
    // Check if we have cached data and it's still valid
    const now = Date.now();
    if (!forceRefresh && cachedData[topicId] && (now - (lastFetchTime[topicId] || 0) < CACHE_DURATION)) {
      console.log(`Returning cached markdown headers for ${topicId}`);
      return NextResponse.json(cachedData[topicId], {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      });
    }
    
    // Path to the markdown file
    const topicsDirectory = path.join(process.cwd(), 'topics');
    const filePath = path.join(topicsDirectory, `${topicId}.md`);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Markdown file not found for topic ${topicId}`);
      return NextResponse.json(
        { error: `No markdown file found for topic ${topicId}` },
        { status: 404 }
      );
    }
    
    // Read the markdown file
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`Reading markdown headers for topic ${topicId}`);
      
      // Extract all H2 headers (lines starting with ##)
      const lines = content.split('\n');
      const headers = lines
        .filter(line => line.trim().startsWith('## '))
        .map(line => {
          const label = line.substring(3).trim();
          // Convert to kebab-case for ID
          const id = label.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/--+/g, '-');    // Replace multiple hyphens with single hyphen
          
          return { id, label };
        });
      
      console.log(`Found ${headers.length} headers for topic ${topicId}`);
      
      const result = {
        topicId,
        headers
      };
      
      // Cache the results
      cachedData[topicId] = result;
      lastFetchTime[topicId] = now;
      
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      });
    } catch (parseError) {
      console.error(`Error reading markdown for topic ${topicId}:`, parseError);
      return NextResponse.json(
        { error: 'Failed to read markdown content', details: parseError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in markdown headers API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
