import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseMarkdown } from '@/utils/markdownParser';

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
      console.log(`Returning cached markdown tree data for ${topicId}`);
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

    // Read and parse the markdown file
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`Parsing markdown for topic ${topicId}`);

      // Parse the markdown content
      const parsedData = parseMarkdown(content);

      // Extract the top-level sections as topics
      const result: Record<string, any> = {
        [topicId]: {
          label: topicId.charAt(0).toUpperCase() + topicId.slice(1).replace(/-/g, ' '),
          subtopics: {}
        }
      };

      // Find all level 2 headers (## headers) - these are the main topics
      console.log('Parsed data keys:', Object.keys(parsedData));

      // Add each parsed section as a subtopic
      for (const key in parsedData) {
        if (key !== 'h1-0') { // Skip the title
          const section = parsedData[key];

          // Check if this is a level 2 header (main topic)
          if (section.level === 2) {
            console.log(`Found level 2 header: ${section.label}`);
            result[topicId].subtopics[key] = {
              id: key,
              label: section.label,
              content: section.content || '',
              subtopics: {}
            };

            // If this section has subtopics, add them
            if (section.subtopics) {
              for (const subtopicKey in section.subtopics) {
                const subtopic = section.subtopics[subtopicKey];
                result[topicId].subtopics[key].subtopics[subtopicKey] = {
                  id: subtopicKey,
                  label: subtopic.label,
                  content: subtopic.content || '',
                  subtopics: subtopic.subtopics || {}
                };
              }
            }
          }
        }
      }

      console.log(`Found ${Object.keys(result[topicId].subtopics).length} main topics for ${topicId}`);

      // Cache the results
      cachedData[topicId] = result;
      lastFetchTime[topicId] = now;

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      });
    } catch (parseError) {
      console.error(`Error parsing markdown for topic ${topicId}:`, parseError);
      return NextResponse.json(
        { error: 'Failed to parse markdown content', details: parseError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in markdown tree API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
