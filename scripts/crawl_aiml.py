import asyncio
import json
import sys
import os
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

# Redirect initialization logs to stderr
os.environ["CRAWL4AI_LOG_LEVEL"] = "ERROR"  # Only show errors, not info logs

async def search_aiml(query):
    # Define several possible CSS selectors for different site structures
    # This makes our scraper more robust against different site layouts
    possible_schemas = [
        # Schema 1: Common blog/article search result layout
        {
            "name": "AIML Search Results - Schema 1",
            "baseSelector": ".search-result-item, .search-result, article.post, .article-item",
            "fields": [
                {
                    "name": "title",
                    "selector": ".title, h2, h2 a, .entry-title",
                    "type": "text"
                },
                {
                    "name": "url",
                    "selector": "a, h2 a, .title a",
                    "type": "attribute",
                    "attribute": "href"
                },
                {
                    "name": "description",
                    "selector": ".excerpt, .summary, .entry-summary, p",
                    "type": "text",
                    "transform": "strip",
                    "optional": True
                },
                {
                    "name": "date",
                    "selector": ".published-date, .date, time, .entry-date",
                    "type": "text",
                    "optional": True
                },
                {
                    "name": "author",
                    "selector": ".author, .byline, .entry-author",
                    "type": "text",
                    "optional": True
                }
            ]
        },
        # Schema 2: Generic list-based search results
        {
            "name": "AIML Search Results - Schema 2",
            "baseSelector": "ul li, .search-results li, .results-list > div",
            "fields": [
                {
                    "name": "title",
                    "selector": "h3, h4, strong, .result-title",
                    "type": "text"
                },
                {
                    "name": "url",
                    "selector": "a",
                    "type": "attribute",
                    "attribute": "href"
                },
                {
                    "name": "description",
                    "selector": "p, .description, .snippet",
                    "type": "text",
                    "optional": True
                }
            ]
        }
    ]
    
    # Create the crawler with default configuration - avoid any potential parameter conflicts
    async with AsyncWebCrawler() as crawler:
        # Construct the search URL
        search_url = f"https://aiml.com/?s={query}"
        
        # First try to get the raw page content without extraction
        try:
            raw_result = await crawler.arun(
                url=search_url,
                crawler_config={
                    "timeout": 30000
                }
            )
            
            # Now attempt extraction with each schema until one works
            for schema in possible_schemas:
                css_strategy = JsonCssExtractionStrategy(schema)
                
                try:
                    result = await crawler.arun(
                        url=search_url,
                        extraction_strategy=css_strategy,
                        crawler_config={
                            "timeout": 15000  # Shorter timeout for extraction
                        }
                    )
                    
                    # Check for extracted_content instead of extraction_results
                    if result.extracted_content:
                        try:
                            # Parse the JSON content
                            content_items = json.loads(result.extracted_content)
                            
                            # If we found at least one valid result, process it
                            if content_items and len(content_items) > 0:
                                # Process the results to add metadata
                                processed_results = []
                                for item in content_items:
                                    # Ensure we have required fields
                                    if not item.get("title") or not item.get("url"):
                                        continue
                                    
                                    # Create metadata object
                                    metadata = {}
                                    
                                    # Add metadata fields if available
                                    if "date" in item and item["date"]:
                                        metadata["date"] = item["date"]
                                        # Remove from main object to avoid duplication
                                        del item["date"]
                                    
                                    if "author" in item and item["author"]:
                                        metadata["author"] = item["author"]
                                        # Remove from main object to avoid duplication
                                        del item["author"]
                                    
                                    # Add tags based on query
                                    metadata["tags"] = [query]
                                    
                                    # Add metadata to the result
                                    item["metadata"] = metadata
                                    
                                    # If URL is relative, make it absolute
                                    if item["url"] and not item["url"].startswith(("http://", "https://")):
                                        item["url"] = f"https://aiml.com{item['url'] if item['url'].startswith('/') else '/' + item['url']}"
                                    
                                    # Ensure we have a description
                                    if not item.get("description"):
                                        item["description"] = f"Result for '{query}' search"
                                    
                                    processed_results.append(item)
                                
                                if processed_results:
                                    return processed_results
                        except json.JSONDecodeError:
                            # Continue to the next schema if JSON parsing fails
                            print(f"Error parsing JSON from extraction result", file=sys.stderr)
                
                except Exception as schema_error:
                    # Print to stderr instead of stdout
                    print(f"Error with schema {schema['name']}: {schema_error}", file=sys.stderr)
                    continue  # Try the next schema
            
            # If all extraction attempts failed, extract links from the markdown as fallback
            # Parse the markdown to find links that might be relevant
            links = []
            lines = raw_result.markdown.split('\n')
            for line in lines:
                # Look for markdown links to extract as search results
                if line.strip().startswith('* [') or '](https://aiml.com/' in line:
                    # Extract the link and title from markdown format [title](url)
                    import re
                    link_matches = re.findall(r'\[(.*?)\]\((https?://[^\s\)]+)\)', line)
                    for title, url in link_matches:
                        if 'aiml.com' in url and query.lower() in url.lower() + title.lower():
                            links.append({
                                "title": title,
                                "url": url,
                                "description": f"Related resource for '{query}'",
                                "metadata": {
                                    "tags": [query]
                                }
                            })
            
            # If we found links, return them
            if links:
                return links
                
            # If no links were found, return the raw markdown with minimal formatting
            return [{
                "title": f"Search results for '{query}'",
                "url": search_url,
                "description": "Search results from aiml.com",
                "markdown": raw_result.markdown,
                "metadata": {
                    "tags": [query]
                }
            }]
                
        except Exception as e:
            # If everything fails, return an error result
            error_message = str(e)
            # Print to stderr instead of stdout
            print(f"Error fetching {search_url}: {error_message}", file=sys.stderr)
            return [{
                "error": error_message,
                "title": f"Error searching for '{query}'",
                "url": search_url,
                "description": "An error occurred while searching. Please try again later."
            }]

# Main function
if __name__ == "__main__":
    # Suppress any library stdout that isn't the final JSON output
    try:
        # Read query from command line arguments
        if len(sys.argv) > 1:
            query = sys.argv[1]
            results = asyncio.run(search_aiml(query))
            # Ensure we only output valid JSON on stdout
            print(json.dumps(results))
        else:
            print(json.dumps([{"error": "No search query provided"}]))
    except Exception as e:
        # Print errors to stderr
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        # Still provide a valid JSON for the calling code
        print(json.dumps([{"error": f"Internal error: {str(e)}"}])) 