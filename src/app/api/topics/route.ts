import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseMarkdown, extractMainCategories } from '@/utils/markdownParser';

// Define types for topic data
type TopicItem = {
  label: string;
  subtopics?: Record<string, TopicItem>;
};

type TopicData = {
  [key: string]: {
    label: string;
    subtopics: Record<string, TopicItem>;
  };
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

// Helper function to get all available topic files
function getAvailableTopics(): string[] {
  const topicsDirectory = path.join(process.cwd(), 'topics');
  try {
    const files = fs.readdirSync(topicsDirectory);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  } catch (error) {
    console.error('Error reading topics directory:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all topics
    const topicsDirectory = path.join(process.cwd(), 'topics');
    const topics = getAvailableTopics();
    const allData: TopicData = {};
    
    // Load and parse each topic file
    for (const topic of topics) {
      const filePath = path.join(topicsDirectory, `${topic}.md`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        allData[topic] = formatTopicData(content, topic);
      } catch (error) {
        console.error(`Error loading topic ${topic}:`, error);
      }
    }
    
    // Return the data with appropriate cache headers
    return NextResponse.json(allData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Error fetching topic data:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { status: 500 }
    );
  }
}

// Also handle specific topic requests
export async function POST(request: NextRequest) {
  try {
    const { topicId } = await request.json();
    
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
      const topicData = { [topicId]: formatTopicData(content, topicId) };
      return NextResponse.json(topicData);
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