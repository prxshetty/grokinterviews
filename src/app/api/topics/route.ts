import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';
import { Topic } from '@/types/database';
import fs from 'fs';
import path from 'path';
import { parseMarkdown } from '@/utils/markdownParser';

// Define types for topic data (for backward compatibility)
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
// Kept for backward compatibility
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
// Kept for backward compatibility
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

// Helper function to convert database topics to the legacy format
// This ensures backward compatibility with existing components
function convertToLegacyFormat(topics: Topic[]): TopicData {
  const result: TopicData = {};

  topics.forEach(topic => {
    result[topic.slug] = {
      label: topic.name,
      subtopics: {} // Will be populated when categories are fetched
    };
  });

  return result;
}

// Helper function to merge database topics with markdown content
async function mergeWithMarkdownContent(dbTopics: TopicData): Promise<TopicData> {
  try {
    // Get all topics from markdown files
    const topicsDirectory = path.join(process.cwd(), 'topics');
    const markdownTopics = getAvailableTopics();
    const markdownData: TopicData = {};

    // Load and parse each topic file
    for (const topic of markdownTopics) {
      const filePath = path.join(topicsDirectory, `${topic}.md`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        markdownData[topic] = formatTopicData(content, topic);
      } catch (fileError) {
        console.error(`Error loading topic ${topic}:`, fileError);
      }
    }

    // Merge the two data sources
    const mergedData: TopicData = { ...dbTopics };

    // For each topic in markdown data
    for (const topicSlug in markdownData) {
      if (!mergedData[topicSlug]) {
        // Topic doesn't exist in database, add it from markdown
        mergedData[topicSlug] = markdownData[topicSlug];
      } else {
        // Topic exists in both sources, merge subtopics
        for (const subtopicKey in markdownData[topicSlug].subtopics) {
          mergedData[topicSlug].subtopics[subtopicKey] = markdownData[topicSlug].subtopics[subtopicKey];
        }
      }
    }

    return mergedData;
  } catch (error) {
    console.error('Error merging with markdown content:', error);
    return dbTopics;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if a domain filter is provided
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    // Fetch topics from the database
    let query = supabaseServer.from('topics').select('*');

    // Apply domain filter if provided
    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data: topics, error } = await query.order('name');

    if (error) {
      throw error;
    }

    // Convert to legacy format for backward compatibility
    const dbFormat = convertToLegacyFormat(topics || []);

    // Merge with markdown content
    const mergedData = await mergeWithMarkdownContent(dbFormat);

    // Return the data with appropriate cache headers
    return NextResponse.json(mergedData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Error fetching topic data:', error);

    // Fallback to file-based approach if database fails
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
        } catch (fileError) {
          console.error(`Error loading topic ${topic}:`, fileError);
        }
      }

      return NextResponse.json(allData, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to load topic data' },
        { status: 500 }
      );
    }
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

    // We need both the database structure and the markdown content
    let dbTopicData: any = null;
    let markdownTopicData: any = null;

    // 1. Fetch the topic with its categories from the database
    try {
      let topic: Topic | null = null;

      // Check if topicId is a number or a slug
      if (typeof topicId === 'number' || !isNaN(Number(topicId))) {
        const { data, error } = await supabaseServer
          .from('topics')
          .select('*')
          .eq('id', topicId)
          .single();

        if (error) throw error;
        topic = data;
      } else {
        const { data, error } = await supabaseServer
          .from('topics')
          .select('*')
          .eq('slug', topicId)
          .single();

        if (error) throw error;
        topic = data;
      }

      if (topic) {
        // Get categories for this topic
        const { data: categories, error: categoriesError } = await supabaseServer
          .from('categories')
          .select('*')
          .eq('topic_id', topic.id)
          .order('name');

        if (categoriesError) throw categoriesError;

        // Convert to legacy format for backward compatibility
        dbTopicData = {
          [topic.slug]: {
            label: topic.name,
            subtopics: {}
          }
        };

        // Add categories as subtopics
        if (categories) {
          for (const category of categories) {
            dbTopicData[topic.slug].subtopics[category.slug] = {
              id: category.slug,
              label: category.name,
              subtopics: {}
            };
          }
        }
      }
    } catch (dbError) {
      console.error('Error fetching topic from database:', dbError);
    }

    // 2. Fetch from markdown file
    try {
      const topicsDirectory = path.join(process.cwd(), 'topics');
      const filePath = path.join(topicsDirectory, `${topicId}.md`);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        markdownTopicData = { [topicId]: formatTopicData(content, topicId) };
      }
    } catch (fileError) {
      console.error(`Error loading topic ${topicId} from file:`, fileError);
    }

    // 3. Merge the data sources
    if (dbTopicData && markdownTopicData) {
      // We have both data sources, merge them
      const mergedData = { ...dbTopicData };
      const topicSlug = Object.keys(dbTopicData)[0];
      const markdownSlug = Object.keys(markdownTopicData)[0];

      // Add subtopics from markdown
      if (markdownTopicData[markdownSlug] && markdownTopicData[markdownSlug].subtopics) {
        for (const subtopicKey in markdownTopicData[markdownSlug].subtopics) {
          const markdownSubtopic = markdownTopicData[markdownSlug].subtopics[subtopicKey];

          // Find matching category in database by label
          let matchingCategorySlug = subtopicKey;
          let foundMatch = false;

          for (const categorySlug in mergedData[topicSlug].subtopics) {
            const dbCategory = mergedData[topicSlug].subtopics[categorySlug];

            // Match by label (case insensitive)
            if (dbCategory.label.toLowerCase() === markdownSubtopic.label.toLowerCase()) {
              matchingCategorySlug = categorySlug;
              foundMatch = true;
              break;
            }
          }

          if (foundMatch) {
            // Found a match, merge the subtopics
            mergedData[topicSlug].subtopics[matchingCategorySlug].subtopics =
              markdownSubtopic.subtopics || {};

            // If markdown has content, add it
            if (markdownSubtopic.content) {
              mergedData[topicSlug].subtopics[matchingCategorySlug].content =
                markdownSubtopic.content;
            }
          } else {
            // No match found, add the markdown subtopic as is
            mergedData[topicSlug].subtopics[subtopicKey] = markdownSubtopic;
          }
        }
      }

      return NextResponse.json(mergedData);
    } else if (dbTopicData) {
      // Only have database data
      return NextResponse.json(dbTopicData);
    } else if (markdownTopicData) {
      // Only have markdown data
      return NextResponse.json(markdownTopicData);
    }

    // If we get here, we couldn't find the topic in either source
    return NextResponse.json(
      { error: 'Topic not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching specific topic data:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { status: 500 }
    );
  }
}