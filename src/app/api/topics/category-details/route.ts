import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseMarkdown } from '@/utils/markdownParser';
import supabaseServer from '@/utils/supabase-server';

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
      let categoryData: any = null;
      let categoryKey: string | null = null;

      // Check if this is a header ID (e.g., header-1)
      if (categoryId.startsWith('header-')) {
        // Extract the header number
        const headerNumber = parseInt(categoryId.replace('header-', ''), 10);
        console.log(`Looking for section header with ID ${headerNumber}`);

        // Get the section headers from the API
        try {
          const response = await fetch(`${url.origin}/api/section-headers?domain=${topicId}`);
          if (response.ok) {
            const sectionHeaders = await response.json();
            console.log(`Found ${sectionHeaders.length} section headers`);

            // Find the section header with the matching ID
            const sectionHeader = sectionHeaders.find((header: any) => header.id === headerNumber);
            if (sectionHeader) {
              console.log(`Found section header: ${sectionHeader.name}`);

              // Create a section object with the section header name
              const sectionName = sectionHeader.name;

              // Fetch topics for this section from Supabase
              const supabase = supabaseServer;
              const { data: topics, error: topicsError } = await supabase
                .from('topics')
                .select('*')
                .eq('section_name', sectionName)
                .eq('domain', topicId)
                .order('created_at', { ascending: false });

              if (topicsError) {
                console.error(`Error fetching topics for section ${sectionName}:`, topicsError);
                return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
              }

              console.log(`Found ${topics?.length || 0} topics for section ${sectionName}`);

              // Create a section object with subtopics
              categoryData = {
                label: sectionName,
                content: `Topics related to ${sectionName}`,
                subtopics: {} as Record<string, any>
              };
              categoryKey = `section-${headerNumber}`;

              // Add each topic as a subtopic
              if (topics && topics.length > 0) {
                for (let i = 0; i < topics.length; i++) {
                  const topic = topics[i];
                  const subtopicId = `subtopic-${i}`;

                  // Fetch categories for this topic
                  const { data: categories, error: categoriesError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('topic_id', topic.id)
                    .order('created_at', { ascending: false });

                  if (categoriesError) {
                    console.error(`Error fetching categories for topic ${topic.name}:`, categoriesError);
                    continue;
                  }

                  console.log(`Found ${categories?.length || 0} categories for topic ${topic.name}`);

                  // Create a subtopic for this topic
                  categoryData.subtopics[subtopicId] = {
                    label: topic.name,
                    content: '',
                    topicId: topic.id,
                    categories: categories || [],
                    subtopics: {}
                  };

                  // Add categories as nested subtopics
                  if (categories && categories.length > 0) {
                    for (let j = 0; j < categories.length; j++) {
                      const category = categories[j];
                      const categorySubtopicId = `category-${j}`;

                      // Fetch questions for this category
                      const { data: questions, error: questionsError } = await supabase
                        .from('questions')
                        .select('*')
                        .eq('category_id', category.id)
                        .order('difficulty');

                      if (questionsError) {
                        console.error(`Error fetching questions for category ${category.name}:`, questionsError);
                        continue;
                      }

                      console.log(`Found ${questions?.length || 0} questions for category ${category.name}`);

                      // Add this category as a nested subtopic
                      categoryData.subtopics[subtopicId].subtopics[categorySubtopicId] = {
                        label: category.name,
                        content: category.description || '',
                        categoryId: category.id,
                        questions: questions || []
                      };
                    }
                  }
                }

                console.log(`Created ${Object.keys(categoryData.subtopics).length} subtopics for section ${sectionName}`);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching section headers or related data:', error);
        }
      }

      // If not found via header ID, try other methods
      if (!categoryData) {
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
      }

      if (!categoryData) {
        return NextResponse.json(
          { error: `Category ${categoryId} not found in topic ${topicId}` },
          { status: 404 }
        );
      }

      // Format the category data
      const result: any = {
        id: categoryKey,
        label: categoryData.label,
        content: categoryData.content || '',
        subtopics: {} as Record<string, any>
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
    } catch (parseError: any) {
      console.error(`Error parsing markdown for topic ${topicId}:`, parseError);
      return NextResponse.json(
        { error: 'Failed to parse markdown content', details: parseError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in category details API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
