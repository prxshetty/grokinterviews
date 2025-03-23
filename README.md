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
