# Grok Interviews

A web application that aggregates and organizes Data Science interview preparation resources from aiml.com.

## Features

- **Topic-based browsing**: Browse interview questions by topic (e.g., Neural Networks, Deep Learning)
- **Job role exploration**: Find relevant questions for specific job roles (e.g., Data Scientist, ML Engineer)
- **Custom search**: Search for specific keywords or concepts
- **Direct links**: Click through to aiml.com for complete answers and resources

## Tech Stack

- **Frontend**: Next.js with React and Tailwind CSS
- **API Routes**: Next.js API routes for data fetching and processing
- **Scraping**: Cheerio for parsing HTML content
- **Caching**: Node-cache for temporary storage

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/grokinterviews.git
   cd grokinterviews
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

### Core Components

1. **API Layer**:
   - `/api/search` - Fetches and scrapes search results from aiml.com
   - `/api/job-topics` - Maps job roles to relevant ML topics

2. **UI Components**:
   - Topic selection
   - Job role selection
   - Custom search bar
   - Results display

### Data Flow

1. User selects a topic or job role (or enters a custom search)
2. The app constructs a search URL for aiml.com
3. Backend fetches and processes the HTML content
4. Results are displayed to the user
5. User can click through to read full articles on aiml.com

## Alternative Names

- DataPrep Pro
- InterviewML
- AIQuest Hub
- MLPrep Central
- DataSciQuery

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Note

This application does not store aiml.com content locally beyond temporary caching. It respects the source website's content and only provides a streamlined way to access publicly available resources.

# Crawl4AI Implementation Examples

This repository contains examples and reference documentation for [Crawl4AI](https://github.com/unclecode/crawl4ai), an open-source LLM-friendly web crawler and scraper designed for AI applications.

## Contents

- `llm4crawl.md`: Comprehensive reference guide for Crawl4AI
- `crawl4ai_example.py`: Example implementations for various extraction techniques
- `requirements.txt`: Dependencies for the examples

## Installation

1. Install the required dependencies:

```bash
# Install base requirements
pip install -r requirements.txt

# Run the post-installation setup
crawl4ai-setup
```

2. For advanced features, uncomment the relevant dependencies in `requirements.txt` before installing:

```bash
# For clustering features
pip install crawl4ai[torch]
crawl4ai-setup

# For transformer-based features  
pip install crawl4ai[transformer]
crawl4ai-setup

# For all features
pip install crawl4ai[all]
crawl4ai-setup
```

## Running the Examples

The example script demonstrates several extraction approaches:

```bash
# Run all examples
python crawl4ai_example.py
```

## Example Features

1. **Basic Crawling**: Extracts clean markdown from a webpage
2. **CSS-based Extraction**: Extracts structured data using CSS selectors
3. **Clustering-based Extraction**: Extracts content clusters based on semantic similarity
4. **Parallel Crawling**: Crawls multiple URLs in parallel

## Customizing the Examples

To use the examples with your own websites:

1. Update the URLs in the `main()` function in `crawl4ai_example.py`
2. Adjust the CSS selectors in the schema to match the structure of your target website
3. Customize the extraction parameters based on your specific needs

## Additional Resources

- [Crawl4AI Documentation](https://docs.crawl4ai.com/)
- [Crawl4AI GitHub Repository](https://github.com/unclecode/crawl4ai)

## Troubleshooting

If you encounter browser-related issues:
```bash
python -m playwright install --with-deps chromium
```

For detailed diagnostics:
```bash
crawl4ai-doctor
```
