/**
 * Markdown parser for topic trees
 * Parses markdown files with a specific format to create topic tree structures
 * Compatible with the structure in ml.md and similar files
 */

import fs from 'fs';
import path from 'path';

// Define the topic structure type to match the structure in TopicTreeNavigation.tsx
export interface TopicItem {
  label: string;
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