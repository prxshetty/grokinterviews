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

              // Now find the corresponding section in the markdown
              for (const key in parsedData) {
                if (key === 'h1-0') continue; // Skip the title

                const section = parsedData[key];
                if (section.label.toLowerCase() === sectionHeader.name.toLowerCase()) {
                  categoryData = section;
                  categoryKey = key;
                  console.log(`Found matching section in markdown: ${key}`);

                  // If this section doesn't have subtopics, create them from the markdown content
                  if (!section.subtopics || Object.keys(section.subtopics).length === 0) {
                    console.log(`Section ${key} doesn't have subtopics, creating them from markdown content`);

                    // Create subtopics from the section content
                    const subtopics = {};

                    // Split the content by lines and create subtopics
                    const lines = section.content?.split('\n') || [];
                    let currentSubtopic = null;

                    for (let i = 0; i < lines.length; i++) {
                      const line = lines[i].trim();

                      // Skip empty lines
                      if (!line) continue;

                      // Check if this is a subtopic header (starts with - or *)
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        const subtopicLabel = line.substring(2).trim();
                        const subtopicId = `subtopic-${i}`;

                        // Create a new subtopic
                        subtopics[subtopicId] = {
                          label: subtopicLabel,
                          content: '',
                          subtopics: {}
                        };

                        currentSubtopic = subtopicId;
                      } else if (currentSubtopic && (line.startsWith('  - ') || line.startsWith('  * '))) {
                        // This is a nested item under the current subtopic
                        const nestedContent = line.substring(4).trim();

                        // Add to the current subtopic's content
                        subtopics[currentSubtopic].content += `\n- ${nestedContent}`;
                      }
                    }

                    // If we found any subtopics, add them to the section
                    if (Object.keys(subtopics).length > 0) {
                      section.subtopics = subtopics;
                      console.log(`Created ${Object.keys(subtopics).length} subtopics for section ${key}`);
                    }
                  }

                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching section headers:', error);
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
