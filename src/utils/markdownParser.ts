/**
 * markdownParser.ts
 *
 * Utility to parse markdown topic files into a hierarchical topic structure
 */

import fs from 'fs';
import path from 'path';

type TopicNode = {
  id: string;
  label: string;
  level: number;
  subtopics?: { [key: string]: TopicNode };
};

type ParsedTopicData = {
  [key: string]: TopicNode;
};

/**
 * Parses markdown content into a hierarchical topic structure
 *
 * @param content The markdown content to parse
 * @returns A structured topic hierarchy
 */
export function parseMarkdown(content: string): ParsedTopicData {
  const lines = content.split('\n').filter(line => line.trim() !== '');

  // Initialize result
  const result: ParsedTopicData = {};

  // Track current hierarchy position
  let currentH1: TopicNode | null = null;
  let currentH2: TopicNode | null = null;
  let currentList: TopicNode | null = null;
  let currentSubList: TopicNode | null = null;
  let currentSubSubList: TopicNode | null = null;

  // Counter for generating IDs
  let h1Counter = 0;
  let h2Counter = 0;
  let listCounter = 0;
  let subListCounter = 0;
  let subSubListCounter = 0;

  // Process each line
  for (const line of lines) {
    // H1 header (# Header)
    if (line.startsWith('# ')) {
      const label = line.substring(2).trim();
      const id = `h1-${h1Counter}`;
      h1Counter++;

      currentH1 = {
        id,
        label,
        level: 1,
        subtopics: {}
      };

      result[id] = currentH1;

      // Reset lower level pointers
      currentH2 = null;
      currentList = null;
      currentSubList = null;
      currentSubSubList = null;
    }
    // H2 header (## Header)
    else if (line.startsWith('## ')) {
      const label = line.substring(3).trim();
      // Generate a proper kebab-case ID for direct access
      const id = kebabCase(label);
      h2Counter++;

      currentH2 = {
        id,
        label,
        level: 2,
        subtopics: {}
      };

      // Add to the main result object for direct access by ID
      result[id] = currentH2;

      // Also add to the H1 subtopics for hierarchy
      if (currentH1 && currentH1.subtopics) {
        currentH1.subtopics[id] = currentH2;
      }

      // Reset lower level pointers
      currentList = null;
      currentSubList = null;
      currentSubSubList = null;
    }
    // List item (- Item)
    else if (line.startsWith('- ') && !line.startsWith('  -')) {
      const label = line.substring(2).trim();
      const id = `${currentH2?.id ?? 'list'}-${listCounter}`;
      listCounter++;

      currentList = {
        id,
        label,
        level: 3,
        subtopics: {}
      };

      if (currentH2 && currentH2.subtopics) {
        currentH2.subtopics[id] = currentList;
      }

      // Reset lower level pointers
      currentSubList = null;
      currentSubSubList = null;
    }
    // Sub list item (  - Item)
    else if (line.startsWith('  - ')) {
      const label = line.substring(4).trim();
      const id = `${currentList?.id ?? 'sublist'}-${subListCounter}`;
      subListCounter++;

      currentSubList = {
        id,
        label,
        level: 4,
        subtopics: {}
      };

      if (currentList && currentList.subtopics) {
        currentList.subtopics[id] = currentSubList;
      }

      // Reset lower level pointers
      currentSubSubList = null;
    }
    // Sub-sub list item (    - Item)
    else if (line.startsWith('    - ')) {
      const label = line.substring(6).trim();
      const id = `${currentSubList?.id ?? 'subsublist'}-${subSubListCounter}`;
      subSubListCounter++;

      currentSubSubList = {
        id,
        label,
        level: 5,
        subtopics: {}
      };

      if (currentSubList && currentSubList.subtopics) {
        currentSubList.subtopics[id] = currentSubSubList;
      }
    }
  }

  // For debugging, log all the top-level keys in our result
  console.log(`parseMarkdown generated these top-level keys: ${Object.keys(result).join(', ')}`);

  return result;
}

/**
 * Extracts all H2 headers from the markdown content
 *
 * @param content The markdown content
 * @returns An array of objects with id and label for each H2 header
 */
export function extractMainCategories(content: string): Array<{id: string, label: string}> {
  const lines = content.split('\n');
  const categories: Array<{id: string, label: string}> = [];
  const idCounts: Record<string, number> = {}; // Track counts of IDs to ensure uniqueness

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const label = line.substring(3).trim();
      let id = kebabCase(label);

      // Make ID unique if we've seen it before
      if (idCounts[id]) {
        idCounts[id]++;
        id = `${id}-${idCounts[id]}`;
      } else {
        idCounts[id] = 1;
      }

      categories.push({
        id,
        label
      });
    }
  }

  return categories;
}

/**
 * Convert a string to kebab-case (lowercase with hyphens)
 */
function kebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Markdown parser for topic trees
 * Parses markdown files with a specific format to create topic tree structures
 * Compatible with the structure in ml.md and similar files
 */

export interface TopicItem {
  id?: string;
  label: string;
  content?: string;
  subtopics?: Record<string, TopicItem>;
}

export type TopicTree = Record<string, {
  label: string;
  subtopics: Record<string, TopicItem>;
}>;

/**
 * Parses markdown content with a specific format and returns a topic tree
 *
 * Expected format:
 * # Main Topic Title
 *
 * ## Section 1
 * - Subtopic 1.1
 *   - Nested Subtopic 1.1.1
 *
 * ## Section 2
 * - Subtopic 2.1
 */
export function parseMarkdownToTopicTree(content: string, topicId: string): TopicTree {
  const lines = content.split('\n');
  let mainTopicName = '';

  // Find the main topic (first h1)
  for (const line of lines) {
    if (line.startsWith('# ')) {
      mainTopicName = line.substring(2).trim();
      break;
    }
  }

  // If no main topic found, use the topicId with first letter capitalized
  if (!mainTopicName) {
    mainTopicName = topicId.charAt(0).toUpperCase() + topicId.slice(1);
  }

  // Create the main topic structure
  const result: TopicTree = {
    [topicId]: {
      label: mainTopicName,
      subtopics: {}
    }
  };

  // Helper function to generate topic IDs
  const generateTopicId = (name: string, parentId: string) => {
    // Convert spaces to dashes, make lowercase, and remove special characters
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `${parentId}-${slug}`;
  };

  // Process the markdown file in two passes:
  // 1. First pass: Find all section headings (##) and create main subtopics
  // 2. Second pass: Process bullet points under each section

  let currentSection: { id: string, item: TopicItem } | null = null;

  // First pass: Find all section headings
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for section headings (##)
    if (line.startsWith('## ')) {
      const sectionName = line.substring(3).trim();
      const sectionId = generateTopicId(sectionName, topicId);

      // Create a new section
      const sectionItem: TopicItem = {
        label: sectionName,
        subtopics: {}
      };

      // Add the section to the main topic
      result[topicId].subtopics[sectionId] = sectionItem;
    }
  }

  // Second pass: Process bullet points and associate them with their sections
  currentSection = null;
  let currentSectionId = '';
  let currentTopicStack: { id: string, item: any, level: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for section headings to track the current section
    if (line.startsWith('## ')) {
      const sectionName = line.substring(3).trim();
      currentSectionId = generateTopicId(sectionName, topicId);
      currentSection = {
        id: currentSectionId,
        item: result[topicId].subtopics[currentSectionId]
      };

      // Reset the topic stack when we enter a new section
      currentTopicStack = [];
    }

    // Skip non-bullet points or if we're not in a section yet
    if (!line.startsWith('-') || !currentSection) continue;

    // Calculate the current nesting level based on indentation
    const leadingSpaces = lines[i].search(/\S|$/);
    const level = Math.floor(leadingSpaces / 2); // Assuming 2 spaces per level

    // Extract the topic name without the bullet point
    const topicName = line.substring(1).trim();
    if (!topicName) continue; // Skip empty bullets

    // Pop any items from the stack that are at a deeper level than the current one
    while (currentTopicStack.length > 0 && currentTopicStack[currentTopicStack.length - 1].level >= level) {
      currentTopicStack.pop();
    }

    // Determine the parent topic to add this topic to
    let parentTopic;
    let parentId;

    if (currentTopicStack.length === 0) {
      // This is a top-level subtopic within the current section
      parentTopic = currentSection.item.subtopics;
      parentId = currentSection.id;
    } else {
      // This is a nested subtopic
      const parent = currentTopicStack[currentTopicStack.length - 1];
      parentTopic = parent.item.subtopics;
      parentId = parent.id;
    }

    // Generate an ID for this topic
    const currentId = generateTopicId(topicName, parentId);

    // Create the topic object
    const topicObject = {
      label: topicName,
      subtopics: {}
    };

    // Add this topic to its parent
    parentTopic[currentId] = topicObject;

    // Add this topic to the stack for potential children
    currentTopicStack.push({
      id: currentId,
      item: topicObject,
      level: level
    });
  }

  // Handle the special case where there are no sections (##) in the markdown
  // In this case, we'll treat the top-level bullet points as main subtopics
  if (Object.keys(result[topicId].subtopics).length === 0) {
    // Reset and do a simpler parse just based on bullet points
    currentTopicStack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip non-bullet points
      if (!line.startsWith('-')) continue;

      // Calculate the current nesting level based on indentation
      const leadingSpaces = lines[i].search(/\S|$/);
      const level = Math.floor(leadingSpaces / 2); // Assuming 2 spaces per level

      // Extract the topic name without the bullet point
      const topicName = line.substring(1).trim();
      if (!topicName) continue; // Skip empty bullets

      // Pop any items from the stack that are at a deeper level than the current one
      while (currentTopicStack.length > 0 && currentTopicStack[currentTopicStack.length - 1].level >= level) {
        currentTopicStack.pop();
      }

      // Determine the parent topic to add this topic to
      let parentTopic;
      let parentId;

      if (currentTopicStack.length === 0) {
        // This is a top-level subtopic
        parentTopic = result[topicId].subtopics;
        parentId = topicId;
      } else {
        // This is a nested subtopic
        const parent = currentTopicStack[currentTopicStack.length - 1];
        parentTopic = parent.item.subtopics;
        parentId = parent.id;
      }

      // Generate an ID for this topic
      const currentId = generateTopicId(topicName, parentId);

      // Create the topic object
      const topicObject = {
        label: topicName,
        subtopics: {}
      };

      // Add this topic to its parent
      parentTopic[currentId] = topicObject;

      // Add this topic to the stack for potential children
      currentTopicStack.push({
        id: currentId,
        item: topicObject,
        level: level
      });
    }
  }

  return result;
}

/**
 * Loads a markdown file and parses it into a topic tree
 */
export async function loadTopicTreeFromMarkdown(topicId: string): Promise<TopicTree> {
  try {
    const filePath = path.join(process.cwd(), 'topics', `${topicId}.md`);
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    return parseMarkdownToTopicTree(fileContents, topicId);
  } catch (error) {
    console.error(`Error loading topic tree for ${topicId}:`, error);
    // Return an empty topic structure as fallback
    return {
      [topicId]: {
        label: topicId.charAt(0).toUpperCase() + topicId.slice(1),
        subtopics: {}
      }
    };
  }
}

/**
 * Loads multiple topic trees from markdown files
 */
export async function loadAllTopicTrees(topicIds: string[]): Promise<TopicTree> {
  const promises = topicIds.map(id => loadTopicTreeFromMarkdown(id));
  const topicTrees = await Promise.all(promises);

  // Merge all topic trees into one
  return topicTrees.reduce((acc, tree) => ({...acc, ...tree}), {});
}

/**
 * Extracts all topic content sections from markdown by creating a mapping
 * between topic IDs and their raw content (text between headers)
 *
 * @param content The markdown content
 * @returns An object mapping topic IDs to their raw content sections
 */
export function extractTopicContentMap(content: string): Record<string, string> {
  const lines = content.split('\n');
  const result: Record<string, string> = {};

  let currentTopicId: string | null = null;
  let currentTopicContent: string[] = [];

  // Process lines to extract sections between headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a header (H2)
    if (line.startsWith('## ')) {
      // If we have a previous topic, save its content
      if (currentTopicId) {
        result[currentTopicId] = currentTopicContent.join('\n');
        // Reset content array for next section
        currentTopicContent = [];
      }

      // Extract new topic ID and prepare for its content
      const label = line.substring(3).trim();
      currentTopicId = kebabCase(label);

      // Add current header to content (we want to include the header itself)
      currentTopicContent.push(line);
    }
    // Not a header, so add to current topic content if we're in a topic
    else if (currentTopicId) {
      currentTopicContent.push(line);
    }
  }

  // Save the last topic's content
  if (currentTopicId && currentTopicContent.length > 0) {
    result[currentTopicId] = currentTopicContent.join('\n');
  }

  return result;
}

/**
 * Extracts a structured map of topic content from the parsed data
 * @param parsedData The parsed markdown data
 * @returns A map of topic IDs to topic items with their content
 */
export function extractStructuredTopicMap(parsedData: ParsedTopicData): Record<string, TopicItem> {
  const result: Record<string, TopicItem> = {};

  // Process each node in the parsed data
  for (const key in parsedData) {
    const node = parsedData[key];

    // Create a topic item for this node
    const topicItem: TopicItem = {
      id: node.id,
      label: node.label,
      subtopics: {}
    };

    // Add to the result
    result[key] = topicItem;

    // Process subtopics
    if (node.subtopics) {
      // First, collect any content from list items
      let content = '';

      for (const subtopicKey in node.subtopics) {
        const subtopic = node.subtopics[subtopicKey];

        // If this is a list item (level 3+), add its content
        if (subtopic.level >= 3) {
          content += `- ${subtopic.label}\n`;

          // Add nested content if available
          if (subtopic.subtopics) {
            for (const nestedKey in subtopic.subtopics) {
              const nestedItem = subtopic.subtopics[nestedKey];
              content += `  - ${nestedItem.label}\n`;

              // Add deeply nested content if available
              if (nestedItem.subtopics) {
                for (const deepKey in nestedItem.subtopics) {
                  const deepItem = nestedItem.subtopics[deepKey];
                  content += `    - ${deepItem.label}\n`;
                }
              }
            }
          }
        } else {
          // This is a header (H2), add it as a subtopic
          topicItem.subtopics[subtopicKey] = {
            id: subtopic.id,
            label: subtopic.label,
            subtopics: {}
          };

          // Process its subtopics
          if (subtopic.subtopics) {
            let subtopicContent = '';

            for (const listKey in subtopic.subtopics) {
              const listItem = subtopic.subtopics[listKey];
              subtopicContent += `- ${listItem.label}\n`;

              // Add nested content if available
              if (listItem.subtopics) {
                for (const nestedKey in listItem.subtopics) {
                  const nestedItem = listItem.subtopics[nestedKey];
                  subtopicContent += `  - ${nestedItem.label}\n`;
                }
              }
            }

            if (subtopicContent) {
              topicItem.subtopics[subtopicKey].content = subtopicContent;
            }
          }
        }
      }

      if (content) {
        topicItem.content = content;
      }
    }
  }

  return result;
}

/**
 * Extract bullet points from a markdown section without headers
 *
 * @param sectionContent The content section (text after a header)
 * @returns An array of bullet point items with optional nested items
 */
export function extractBulletPoints(sectionContent: string): Array<{text: string, nested: string[]}> {
  const lines = sectionContent.split('\n');
  const result: Array<{text: string, nested: string[]}> = [];

  let currentItem: {text: string, nested: string[]} | null = null;

  for (const line of lines) {
    // Skip header lines and empty lines
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }

    // Check if this is a top-level bullet point
    if (line.trim().startsWith('- ') && !line.trim().startsWith('  -')) {
      // If we have a previous item, add it to results
      if (currentItem) {
        result.push(currentItem);
      }

      // Start new item
      const text = line.trim().substring(2).trim();
      currentItem = { text, nested: [] };
    }
    // Check if this is a nested bullet point
    else if (line.trim().startsWith('  - ') && currentItem) {
      const nestedText = line.trim().substring(4).trim();
      currentItem.nested.push(nestedText);
    }
    // Any other content is ignored for this purpose
  }

  // Add the last item if exists
  if (currentItem) {
    result.push(currentItem);
  }

  return result;
}