import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseMarkdown } from '@/utils/markdownParser';

type TopicItem = {
  label: string;
  subtopics?: Record<string, TopicItem>;
};

// Helper function to format the parsed markdown into the structure needed for the UI
function formatTopicData(content: string, topicId: string) {
  const parsedData = parseMarkdown(content);
  
  // Extract the main topic node (H1)
  const mainTopicKey = Object.keys(parsedData).find(key => 
    parsedData[key].level === 1
  );
  
  if (!mainTopicKey) {
    return { label: topicId, subtopics: {} };
  }
  
  const mainTopic = parsedData[mainTopicKey];
  
  return {
    label: mainTopic.label,
    subtopics: mainTopic.subtopics || {}
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const { topicId } = params;
    
    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }
    
    const topicsDirectory = path.join(process.cwd(), 'topics');
    const filePath = path.join(topicsDirectory, `${topicId}.md`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const topicData = formatTopicData(content, topicId);
      
      return NextResponse.json({ [topicId]: topicData }, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      });
    } catch (error) {
      console.error(`Error loading topic ${topicId}:`, error);
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching specific topic data:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { status: 500 }
    );
  }
} 