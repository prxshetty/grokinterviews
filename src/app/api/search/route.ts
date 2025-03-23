import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

// Define result type
interface SearchResult {
  title: string;
  url: string;
  description: string;
}

// Cache with TTL of 30 minutes
const cache = new NodeCache({ stdTTL: 1800 });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  // Check cache first
  const cacheKey = `search-${query}`;
  const cachedResults = cache.get<SearchResult[]>(cacheKey);
  
  if (cachedResults) {
    return NextResponse.json({ results: cachedResults, source: 'cache' });
  }
  
  try {
    // Construct aiml.com search URL
    const searchUrl = `https://aiml.com/?s=${encodeURIComponent(query)}`;
    
    // Fetch search results
    const response = await axios.get(searchUrl);
    
    // Parse HTML content with Cheerio
    const $ = cheerio.load(response.data);
    
    // Extract question titles and links (adjust selectors based on actual aiml.com structure)
    const results: SearchResult[] = [];
    
    // This is a placeholder selector - adjust based on aiml.com's actual HTML structure
    $('.search-result-item').each((index, element) => {
      const title = $(element).find('.title').text().trim();
      const url = $(element).find('a').attr('href');
      const description = $(element).find('.excerpt').text().trim();
      
      if (title && url) {
        results.push({
          title,
          url,
          description: description || '',
        });
      }
    });
    
    // Store in cache
    cache.set(cacheKey, results);
    
    return NextResponse.json({ results, source: 'aiml.com' });
  } catch (error) {
    console.error('Error fetching search results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
} 