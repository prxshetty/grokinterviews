import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMainCategories, parseMarkdown, extractTopicContentMap, extractBulletPoints } from '@/utils/markdownParser';

// Define type for category items
type CategoryItem = {
  id: string;
  label: string;
};

// Function to get detailed subtopics for a specific category
export function getSubtopicsForCategory(content: string, categoryId: string) {
  const parsedData = parseMarkdown(content);
  const contentMap = extractTopicContentMap(content);
  
  // Debug for troubleshooting
  console.log(`Searching for categoryId: ${categoryId}`);
  console.log(`Available parsedData keys: ${Object.keys(parsedData).join(', ')}`);
  console.log(`Available contentMap keys: ${Object.keys(contentMap).join(', ')}`);
  
  // First pass: Get all possible H2 headers with their normalized IDs for comparison
  const allCategories: Array<{id: string, originalId: string, label: string, node: any}> = [];
  for (const key in parsedData) {
    const node = parsedData[key];
    if (node.level === 2) {
      // Generate various forms of the ID for better matching
      const normalizedId = node.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const noHyphenId = normalizedId.replace(/-/g, '');
      const spacedId = node.label.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      allCategories.push({
        id: normalizedId,
        originalId: node.id,
        label: node.label,
        node: node
      });
      
      // Log available categories to help with debugging
      console.log(`Available category: "${node.label}" with ID "${normalizedId}"`);
    }
  }
  
  // Second pass: Try multiple matching strategies in order of exactness
  
  // 1. Exact match
  let matchedNode = findCategoryMatch(allCategories, categoryId, (catId, queryId) => catId === queryId);
  if (matchedNode) {
    console.log(`Found exact ID match: ${matchedNode.label}`);
    
    // Check if this node has empty subtopics but has content in the contentMap
    if (Object.keys(matchedNode.subtopics || {}).length === 0 && contentMap[matchedNode.id]) {
      // For categories like 'naive-bayes' that have bullet points but no nested subtopics
      // Extract the bullet points from the content section and create subtopics
      console.log(`Node has no subtopics but has raw content. Extracting bullet points...`);
      const rawContent = contentMap[matchedNode.id];
      const bulletPoints = extractBulletPoints(rawContent);
      
      if (bulletPoints.length > 0) {
        console.log(`Found ${bulletPoints.length} bullet points. Creating dynamic subtopics.`);
        matchedNode.subtopics = matchedNode.subtopics || {};
        
        // Create subtopics from bullet points
        bulletPoints.forEach((item, index) => {
          const bulletId = `${matchedNode.id}-bullet-${index}`;
          
          matchedNode.subtopics[bulletId] = {
            id: bulletId,
            label: item.text,
            level: 3,
            subtopics: {}
          };
          
          // Add nested bullet points if any
          if (item.nested.length > 0) {
            item.nested.forEach((nestedText, nestedIndex) => {
              const nestedId = `${bulletId}-nested-${nestedIndex}`;
              matchedNode.subtopics[bulletId].subtopics[nestedId] = {
                id: nestedId,
                label: nestedText,
                level: 4
              };
            });
          }
        });
      }
    }
    
    return matchedNode;
  }
  
  // 2. Include/substring match
  matchedNode = findCategoryMatch(allCategories, categoryId, 
    (catId, queryId) => catId.includes(queryId) || queryId.includes(catId));
  if (matchedNode) {
    console.log(`Found substring match: ${matchedNode.label}`);
    return matchedNode;
  }
  
  // 3. Word-by-word match (for hyphenated categories)
  matchedNode = findPartialWordMatch(allCategories, categoryId);
  if (matchedNode) {
    console.log(`Found word-by-word match: ${matchedNode.label}`);
    return matchedNode;
  }
  
  // 4. Fuzzy search - check for categories that share most words
  matchedNode = findFuzzyMatch(allCategories, categoryId);
  if (matchedNode) {
    console.log(`Found fuzzy match: ${matchedNode.label}`);
    return matchedNode;
  }
  
  // 5. Topic content search - look for the term in topic content (labels and subtopics)
  matchedNode = findInContent(parsedData, categoryId);
  if (matchedNode) {
    console.log(`Found content match: ${matchedNode.label}`);
    return matchedNode;
  }
  
  // No matches found with any method
  console.log(`No matching category found for: ${categoryId}`);
  return null;
}

// Helper function to find a category match based on a comparison function
function findCategoryMatch(
  categories: Array<{id: string, originalId: string, label: string, node: any}>,
  queryId: string,
  comparisonFn: (categoryId: string, queryId: string) => boolean
) {
  for (const category of categories) {
    if (comparisonFn(category.id, queryId)) {
      return category.node;
    }
    
    // Try with original ID from the parsed data
    if (comparisonFn(category.originalId, queryId)) {
      return category.node;
    }
    
    // Try with normalized versions of both IDs
    const normalizedQueryId = queryId.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (comparisonFn(category.id, normalizedQueryId)) {
      return category.node;
    }
    
    // Try with spaces instead of hyphens
    const queryWithSpaces = queryId.replace(/-/g, ' ');
    if (category.label.toLowerCase().includes(queryWithSpaces)) {
      return category.node;
    }
  }
  return null;
}

// Helper function for partial word matching (e.g., "naive-bayes" and "naive")
function findPartialWordMatch(
  categories: Array<{id: string, originalId: string, label: string, node: any}>,
  queryId: string
) {
  // Split both the query and category IDs into words
  const queryWords = queryId.split('-').filter(word => word.length > 0);
  
  // For each category, count how many words match
  let bestMatch = null;
  let bestMatchCount = 0;
  
  for (const category of categories) {
    const categoryWords = category.id.split('-').filter(word => word.length > 0);
    let matchCount = 0;
    
    // Count matching words in any order
    for (const queryWord of queryWords) {
      if (categoryWords.some(catWord => catWord.includes(queryWord) || queryWord.includes(catWord))) {
        matchCount++;
      }
    }
    
    // If this is the best match so far, save it
    if (matchCount > 0 && matchCount > bestMatchCount) {
      bestMatch = category.node;
      bestMatchCount = matchCount;
    }
  }
  
  // Consider it a match if at least half the words match
  if (bestMatch && bestMatchCount >= Math.max(1, Math.floor(queryWords.length / 2))) {
    return bestMatch;
  }
  
  return null;
}

// Helper function for fuzzy matching that considers overall similarity
function findFuzzyMatch(
  categories: Array<{id: string, originalId: string, label: string, node: any}>,
  queryId: string
) {
  // For basic fuzzy matching, we'll check if most characters from one string appear in another
  const queryChars = new Set(queryId.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  let bestMatch = null;
  let bestMatchScore = 0;
  
  for (const category of categories) {
    // Try matching against both the ID and the label
    const idChars = new Set(category.id.replace(/[^a-z0-9]/g, ''));
    const labelChars = new Set(category.label.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Calculate overlap (intersection)
    let overlapWithId = 0;
    let overlapWithLabel = 0;
    
    for (const char of queryChars) {
      if (idChars.has(char)) overlapWithId++;
      if (labelChars.has(char)) overlapWithLabel++;
    }
    
    // Take the better of the two scores
    const overlapScore = Math.max(overlapWithId, overlapWithLabel) / queryChars.size;
    
    if (overlapScore > bestMatchScore) {
      bestMatch = category.node;
      bestMatchScore = overlapScore;
    }
  }
  
  // Consider it a match if the similarity is high enough
  if (bestMatch && bestMatchScore >= 0.7) {
    return bestMatch;
  }
  
  return null;
}

// Helper function to search within content of topic nodes
function findInContent(parsedData: any, queryId: string) {
  const searchTerm = queryId.replace(/-/g, ' ').toLowerCase();
  
  // First, prioritize H2 headers (level 2 nodes)
  for (const key in parsedData) {
    const node = parsedData[key];
    if (node.level === 2) {
      // Check if the search term appears in the label
      if (node.label.toLowerCase().includes(searchTerm)) {
        return node;
      }
      
      // Check if the search term appears in any subtopic labels
      if (node.subtopics) {
        for (const subKey in node.subtopics) {
          const subNode = node.subtopics[subKey];
          if (subNode.label.toLowerCase().includes(searchTerm)) {
            // Found a match in a subtopic, return the parent H2
            return node;
          }
        }
      }
    }
  }
  
  // If no H2 matches, look for any node containing the search term
  for (const key in parsedData) {
    const node = parsedData[key];
    if (node.label.toLowerCase().includes(searchTerm)) {
      if (node.level === 2) {
        return node; // Return H2 directly if it's a match
      } else if (node.level > 2) {
        // For deeper nodes, try to find its parent H2
        for (const h2Key in parsedData) {
          const h2Node = parsedData[h2Key];
          if (h2Node.level === 2 && isParentOf(h2Node, node)) {
            return h2Node;
          }
        }
      }
    }
  }
  
  return null;
}

// Helper function to check if a node is a parent of another node
function isParentOf(potentialParent: any, childNode: any): boolean {
  if (!potentialParent.subtopics) {
    return false;
  }
  
  for (const key in potentialParent.subtopics) {
    if (potentialParent.subtopics[key] === childNode) {
      return true;
    }
    
    if (isParentOf(potentialParent.subtopics[key], childNode)) {
      return true;
    }
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const topicsDirectory = path.join(process.cwd(), 'topics');
    
    // Check if specific categoryId and topicId are requested
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const topicId = url.searchParams.get('topicId');
    
    console.log(`API request - topicId: ${topicId}, categoryId: ${categoryId}`);
    
    // If categoryId and topicId are provided, return detailed subtopics for that category
    if (categoryId && topicId) {
      try {
        const filePath = path.join(topicsDirectory, `${topicId}.md`);
        console.log(`Loading file: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          return NextResponse.json(
            { error: `Topic file not found: ${topicId}` },
            { status: 404 }
          );
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const subtopics = getSubtopicsForCategory(content, categoryId);
        
        if (!subtopics) {
          console.error(`Category not found: ${categoryId} in topic ${topicId}`);
          
          // Return a more descriptive error
          return NextResponse.json(
            { 
              error: 'Category not found',
              categoryId,
              topicId,
              message: `Could not find category with ID ${categoryId} in topic ${topicId}`
            },
            { status: 404 }
          );
        }
        
        return NextResponse.json(subtopics, {
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
          },
        });
      } catch (error) {
        console.error(`Error loading subtopics for ${topicId}/${categoryId}:`, error);
        return NextResponse.json(
          { 
            error: 'Failed to load subtopics',
            message: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
    }
    
    // Get all markdown files
    const files = fs.readdirSync(topicsDirectory)
      .filter(file => file.endsWith('.md'));
    
    // Extract main categories from each file
    const categories: Record<string, CategoryItem[]> = {};
    
    for (const file of files) {
      const topicId = file.replace('.md', '');
      const filePath = path.join(topicsDirectory, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const mainCategories = extractMainCategories(content);
        categories[topicId] = mainCategories;
      } catch (error) {
        console.error(`Error extracting categories from ${topicId}:`, error);
        categories[topicId] = [];
      }
    }
    
    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Error fetching topic categories:', error);
    return NextResponse.json(
      { error: 'Failed to load topic categories' },
      { status: 500 }
    );
  }
} 