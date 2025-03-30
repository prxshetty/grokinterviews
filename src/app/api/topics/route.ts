import { NextResponse } from 'next/server';
import { loadAllTopicTrees } from '@/utils/markdownParser';

export const revalidate = 3600; // Revalidate data at most every hour

export async function GET() {
  try {
    // Define the main topic IDs with correct mapping to file names
    const topicIds = ['ml', 'ai', 'webdev', 'sdesign', 'dsa'];
    
    // Load all topic trees
    const topicData = await loadAllTopicTrees(topicIds);
    
    // Manually map 'sdesign' to 'system-design' in the response
    if (topicData['sdesign']) {
      topicData['system-design'] = topicData['sdesign'];
      delete topicData['sdesign'];
    }
    
    // Return the data as JSON with cache headers
    return new NextResponse(JSON.stringify(topicData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error loading topics:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 