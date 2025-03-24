import { NextResponse } from 'next/server';
import { PythonShell, PythonShellError } from 'python-shell';
import { resolve } from 'path';
import NodeCache from 'node-cache';

// Define result type
interface SearchResult {
  title: string;
  url: string;
  description: string;
  error?: string;
  markdown?: string;
  metadata?: {
    author?: string;
    date?: string;
    tags?: string[];
    [key: string]: any;
  }
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
    // Get the absolute path to the Python script
    const scriptPath = resolve(process.cwd(), 'scripts', 'crawl_aiml.py');
    
    // Configure PythonShell options
    const options = {
      mode: 'text' as const, // Changed from 'json' to 'text' for manual parsing
      pythonPath: 'python', // This should match your Python executable
      args: [query], // Pass the query as an argument to the script
      // Separate stderr from stdout to prevent mixing
      stderrParser: (line: string) => {
        console.error(`Python stderr: ${line}`);
        return line;
      }
    };
    
    // Run the Python script
    const results = await new Promise<SearchResult[]>((resolve, reject) => {
      let stdoutData = ''; // Collect all stdout data
      
      const pyshell = new PythonShell(scriptPath, options);
      
      // Collect stdout data
      pyshell.on('message', (message) => {
        stdoutData += message;
      });
      
      // Handle script completion
      pyshell.end((err, exitCode, exitSignal) => {
        if (err) {
          console.error('Python script error:', err);
          // Return a default error result instead of rejecting
          return resolve([{
            title: `Error searching for "${query}"`,
            url: `https://aiml.com/?s=${encodeURIComponent(query)}`,
            description: 'There was an error processing this search. Try a different query or try again later.',
            error: err.message
          }]);
        }
        
        // Try to parse the JSON output
        try {
          // Look for the JSON output at the end of stdout
          // This is a more specific regex that looks for a well-formed JSON array as the last part of the output
          // It helps to skip all the debug/initialization messages from Crawl4AI
          const jsonRegex = /(\[\{.*\}\])\s*$/;
          const jsonMatch = stdoutData.replace(/\n/g, ' ').match(jsonRegex);
          
          if (jsonMatch && jsonMatch[1]) {
            const parsedResults = JSON.parse(jsonMatch[1]) as SearchResult[];
            resolve(parsedResults);
          } else {
            console.error('No valid JSON found in Python output');
            console.error('Raw output:', stdoutData);
            
            // Try a secondary, broader regex pattern as a fallback
            const fallbackRegex = /\[(?:\{.*?\}(?:,\s*\{.*?\})*)\]/;
            const fallbackMatch = stdoutData.replace(/\n/g, ' ').match(fallbackRegex);
            
            if (fallbackMatch && fallbackMatch[0]) {
              try {
                const parsedResults = JSON.parse(fallbackMatch[0]) as SearchResult[];
                resolve(parsedResults);
              } catch (fallbackError) {
                resolve([{
                  title: `Search results for "${query}"`,
                  url: `https://aiml.com/?s=${encodeURIComponent(query)}`,
                  description: 'Failed to parse search results. Try a different query or try again later.',
                  error: 'Secondary JSON parsing failed'
                }]);
              }
            } else {
              resolve([{
                title: `Search results for "${query}"`,
                url: `https://aiml.com/?s=${encodeURIComponent(query)}`,
                description: 'Failed to parse search results. Try a different query or try again later.',
                error: 'Invalid JSON output'
              }]);
            }
          }
        } catch (parseError) {
          console.error('Error parsing Python output:', parseError);
          console.error('Raw output snippet:', stdoutData.substring(0, 200) + '...');
          resolve([{
            title: `Error searching for "${query}"`,
            url: `https://aiml.com/?s=${encodeURIComponent(query)}`,
            description: 'Failed to parse search results. Try a different query or try again later.',
            error: 'JSON parsing error'
          }]);
        }
      });
    });
    
    // Filter out any results with errors unless there are only error results
    const validResults = results.filter(result => !result.hasOwnProperty('error'));
    const finalResults = validResults.length > 0 ? validResults : results;
    
    // Store in cache
    cache.set(cacheKey, finalResults);
    
    return NextResponse.json({ results: finalResults, source: 'aiml.com' });
  } catch (error) {
    console.error('Error fetching search results:', error);
    
    // Create a fallback result for the error case
    const errorResults = [{
      title: `Error searching for "${query}"`,
      url: `https://aiml.com/?s=${encodeURIComponent(query)}`,
      description: 'There was an error processing this search. Try a different query or try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }];
    
    return NextResponse.json({ 
      results: errorResults, 
      source: 'error',
      error: 'Failed to fetch search results'
    });
  }
} 