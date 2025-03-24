# Crawl4AI Reference Guide

## Overview
Crawl4AI is an open-source LLM-friendly web crawler and scraper designed for AI applications. It provides clean, structured data extraction optimized for large language models, AI agents, and data pipelines.

## Installation

### Basic Installation
```bash
pip install crawl4ai
crawl4ai-setup  # Setup the browser
```

### Advanced Installation Options
For specific features:
```bash
# For clustering and semantic extraction features (installs PyTorch)
pip install crawl4ai[torch]
crawl4ai-setup

# For transformer-based features
pip install crawl4ai[transformer]
crawl4ai-setup

# For all features
pip install crawl4ai[all]
crawl4ai-setup
```

### Manual Browser Setup (if needed)
```bash
python -m playwright install --with-deps chromium
```

### Installation Verification
```bash
crawl4ai-doctor
```

## Basic Usage

```python
import asyncio
from crawl4ai import AsyncWebCrawler

async def main():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url="https://example.com")
        print(result.markdown)  # Clean markdown ready for LLM consumption

asyncio.run(main())
```

## CLI Usage

```bash
# Basic crawl with markdown output
crwl https://example.com -o markdown

# Deep crawl with BFS strategy, max 10 pages
crwl https://example.com --deep-crawl bfs --max-pages 10
```

## Core Components

### `AsyncWebCrawler`
The primary class for handling web crawling operations.

```python
crawler = AsyncWebCrawler(
    browser_config={},  # Browser configuration options
    crawler_config={},  # Crawler behavior configuration
    llm_config={}       # LLM-related configuration
)
```

### `arun()` Method
Crawls a single URL and returns a structured result.

```python
result = await crawler.arun(
    url="https://example.com",
    strategy=None,  # Optional extraction strategy
    max_pages=1,    # For limited deep crawling
    content_selector=None,  # CSS/XPath selector for specific content
    wait_for=None,  # Wait for specific elements to load
    exclude_selectors=[]  # Elements to exclude from extraction
)
```

### `arun_many()` Method
Process multiple URLs in parallel.

```python
results = await crawler.arun_many(
    urls=["https://example.com", "https://another-site.com"],
    max_concurrency=5  # Control parallel execution
)
```

### `CrawlResult`
The object returned after crawling, containing:
- `markdown`: Clean markdown representation of the page
- `urls`: Discovered URLs
- `metadata`: Page metadata
- `extraction_results`: Structured data from extraction strategies

## Extraction Strategies

### LLM-Free Strategies
Extraction without requiring an LLM:

#### CSS Strategy
```python
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

# CSS Selector approach
schema = {
    "name": "Product List",
    "baseSelector": ".product-card",
    "fields": [
        {
            "name": "title",
            "selector": "h2.title",
            "type": "text"
        },
        {
            "name": "price",
            "selector": ".price",
            "type": "text",
            "transform": "strip"
        },
        {
            "name": "image",
            "selector": "img",
            "type": "attribute",
            "attribute": "src"
        }
    ]
}

strategy = JsonCssExtractionStrategy(schema, verbose=True)
result = await crawler.arun(url="https://example.com", extraction_strategy=strategy)
extracted_data = json.loads(result.extracted_content)
```

#### XPath Strategy
```python
from crawl4ai.extraction_strategy import JsonXPathExtractionStrategy

# XPath approach
schema = {
    "name": "Product List",
    "baseSelector": "//div[@class='product-card']",
    "fields": [
        {
            "name": "product_names",
            "selector": ".//h2/text()",
            "type": "text"
        },
        {
            "name": "prices",
            "selector": ".//span[@class='price']/text()",
            "type": "text"
        }
    ]
}

strategy = JsonXPathExtractionStrategy(schema)
result = await crawler.arun(url="https://example.com", strategy=strategy)
extracted_data = json.loads(result.extracted_content)
```

### LLM-Based Strategies
For more advanced extraction using LLMs:

```python
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from crawl4ai import LLMConfig

# Define the extraction schema
schema = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "main_points": {"type": "array", "items": {"type": "string"}},
        "author": {"type": "string"},
    }
}

# Using OpenAI model
llm_strategy = LLMExtractionStrategy(
    schema=schema,
    llm_config=LLMConfig(
        provider="openai/gpt-3.5-turbo",
        api_token="your-openai-token"
    ),
    prompt_template="Extract the following information from the content: {schema}"
)

# Alternatively, using Ollama (local model)
llm_strategy = LLMExtractionStrategy(
    schema=schema,
    llm_config=LLMConfig(
        provider="ollama/llama3",
        api_token=None  # Not needed for Ollama
    ),
    prompt_template="Extract the following information from the content: {schema}"
)

result = await crawler.arun(url="https://example.com", extraction_strategy=llm_strategy)
structured_data = json.loads(result.extracted_content)
```

### Clustering Strategies
For extracting content based on semantic similarity:

```python
from crawl4ai.extraction_strategy import CosineStrategy

# Basic usage
cluster_strategy = CosineStrategy(
    semantic_filter="product reviews",    # Target content type
    word_count_threshold=10,              # Minimum words per chunk
    sim_threshold=0.3                     # Similarity threshold
)

# More customized approach
cluster_strategy = CosineStrategy(
    semantic_filter="product features",
    word_count_threshold=20,
    sim_threshold=0.5,
    top_k=5,                              # Return top 5 most relevant clusters
    model_name='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'  # Custom model
)

result = await crawler.arun(url="https://example.com", extraction_strategy=cluster_strategy)
clustered_content = json.loads(result.extracted_content)
```

## Chunking Strategies

For handling large documents with LLM extraction:

```python
from crawl4ai.chunking_strategy import OverlappingWindowChunking
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from crawl4ai import LLMConfig

# Create chunking strategy
chunker = OverlappingWindowChunking(
    window_size=500,  # 500 words per chunk
    overlap=50        # 50 words overlap
)

# Use with extraction strategy
strategy = LLMExtractionStrategy(
    llm_config=LLMConfig(provider="ollama/llama3"),
    chunking_strategy=chunker
)

result = await crawler.arun(
    url="https://example.com/long-article",
    extraction_strategy=strategy
)
```

## Advanced Features

### Content Selection
Target specific parts of a page:

```python
result = await crawler.arun(
    url="https://example.com",
    content_selector="main.content",
    exclude_selectors=["nav", "footer", ".ads"]
)
```

### Handling Authentication
For sites requiring login:

```python
async def auth_hook(page):
    await page.goto("https://example.com/login")
    await page.fill("input[name=username]", "myusername")
    await page.fill("input[name=password]", "mypassword")
    await page.click("button[type=submit]")
    await page.wait_for_navigation()

crawler = AsyncWebCrawler(crawler_config={"hooks": {"auth": auth_hook}})
```

### Lazy Loading Content
For dynamic content:

```python
result = await crawler.arun(
    url="https://example.com",
    crawler_config={
        "scroll_behavior": "full",  # Scroll to trigger lazy loading
        "wait_time": 2000  # Wait 2 seconds after scrolling
    }
)
```

### Handling Pagination
For multi-page content:

```python
async def pagination_hook(page, context):
    next_button = await page.query_selector(".pagination .next")
    if next_button:
        await next_button.click()
        await page.wait_for_load_state("networkidle")
        return True  # Continue pagination
    return False  # Stop pagination

result = await crawler.arun(
    url="https://example.com",
    crawler_config={
        "hooks": {"pagination": pagination_hook},
        "max_pages": 5  # Limit to 5 pages
    }
)
```

## Docker Deployment

### Quick Start with Docker
```bash
# Pull and run the basic version
docker pull unclecode/crawl4ai:basic
docker run -p 11235:11235 unclecode/crawl4ai:basic

# With increased shared memory (if needed)
docker run --shm-size=2gb -p 11235:11235 unclecode/crawl4ai:basic
```

### Docker with LLM Support
```bash
# With LLM support and security
docker run -p 11235:11235 \
    -e CRAWL4AI_API_TOKEN=your_secret_token \
    -e OPENAI_API_KEY=sk-... \
    -e ANTHROPIC_API_KEY=sk-ant-... \
    unclecode/crawl4ai:all
```

### Using Docker Compose
Create a `docker-compose.yml`:
```yaml
version: '3.8'

services:
  crawl4ai:
    image: unclecode/crawl4ai:all
    ports:
      - "11235:11235"
    environment:
      - CRAWL4AI_API_TOKEN=${CRAWL4AI_API_TOKEN:-}
      - MAX_CONCURRENT_TASKS=5
      # LLM Provider Keys
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
    volumes:
      - /dev/shm:/dev/shm
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 1G
```

## Best Practices

1. **Start Simple**: Begin with basic extraction before adding complexity
2. **Use Appropriate Strategy**: 
   - Use CSS/XPath strategies for structured data with predictable patterns
   - Use clustering strategies for similar content sections
   - Use LLM strategies only for complex, unstructured data or when context understanding is needed
3. **Content Selection**: Always narrow down content using selectors to improve accuracy
4. **Caching**: Enable caching for development to avoid repeated requests
5. **Error Handling**: Implement try/except blocks around crawler operations
6. **Respect Robots.txt**: Configure crawler to respect site policies
7. **Monitor Performance**: For large-scale scraping, track performance metrics
8. **Optimize Chunking**: For long documents, adjust window size and overlap parameters 