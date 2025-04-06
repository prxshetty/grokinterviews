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
    const topicId = url.searchParams.get('topicId') || 'ml';
    const categoryId = url.searchParams.get('categoryId');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    const cacheKey = `${topicId}:${categoryId}`;
    
    // Check if we have cached data and it's still valid
    const now = Date.now();
    if (!forceRefresh && cachedData[cacheKey] && (now - (lastFetchTime[cacheKey] || 0) < CACHE_DURATION)) {
      console.log(`Returning cached category details for ${cacheKey}`);
      return NextResponse.json(cachedData[cacheKey], {
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
      console.log(`Parsing markdown for topic ${topicId} to find category ${categoryId}`);
      
      // Parse the markdown content
      const parsedData = parseMarkdown(content);
      
      // Try to find the category in the parsed data
      let categoryData = null;
      let categoryKey = null;
      
      // First try exact match
      if (parsedData[categoryId]) {
        categoryData = parsedData[categoryId];
        categoryKey = categoryId;
      } else {
        // Try to find a matching category
        for (const key in parsedData) {
          if (key === 'h1-0') continue; // Skip the title
          
          // Check if the key contains the categoryId or vice versa
          if (key.includes(categoryId) || categoryId.includes(key)) {
            categoryData = parsedData[key];
            categoryKey = key;
            break;
          }
          
          // Check if the label contains the categoryId
          const section = parsedData[key];
          if (section.label.toLowerCase().includes(categoryId.toLowerCase().replace(/-/g, ' '))) {
            categoryData = section;
            categoryKey = key;
            break;
          }
        }
      }
      
      if (!categoryData) {
        return NextResponse.json(
          { error: `Category ${categoryId} not found in topic ${topicId}` },
          { status: 404 }
        );
      }
      
      // Format the category data
      const result = {
        id: categoryKey,
        label: categoryData.label,
        content: categoryData.content || '',
        subtopics: {}
      };
      
      // Add subtopics if available
      if (categoryData.subtopics) {
        for (const subtopicKey in categoryData.subtopics) {
          const subtopic = categoryData.subtopics[subtopicKey];
          result.subtopics[subtopicKey] = {
            id: subtopicKey,
            label: subtopic.label,
            content: subtopic.content || ''
          };
        }
      }
      
      // Cache the results
      cachedData[cacheKey] = result;
      lastFetchTime[cacheKey] = now;
      
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
    console.error('Error in category details API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
