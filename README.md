# Grok Interviews

A modern web application that aggregates, organizes, and presents Data Science and Software Engineering interview preparation resources.

## Features

- **Hierarchical Topic Navigation**: Browse interview questions by main topics and dive into subtopics with an intuitive two-tier navigation system
- **Comprehensive Topic Coverage**: Access content across multiple domains including Machine Learning, Data Structures & Algorithms, System Design, Web Development, and more
- **Responsive Design**: Enjoy a seamless experience across all device sizes
- **Dark Mode Support**: Switch between light and dark themes for comfortable reading
- **Clean Interface**: Focus on learning with a distraction-free, modern UI

## Tech Stack

- **Frontend**: 
  - Next.js 15.2 with React 19
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Framer Motion for animations
  
- **Content Management**:
  - Markdown-based topic structure
  - Dynamic content parsing
  - SQLite database for structured data

- **Performance Optimizations**:
  - Multi-level caching (localStorage, HTTP caching)
  - Memoized components
  - Server components where appropriate

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

## Project Structure

```
grokinterviews/
├── src/                 # Source code
│   ├── app/             # Next.js app directory
│   └── utils/           # Utility functions
├── topics/              # Markdown topic files
│   ├── ml.md            # Machine Learning topics
│   ├── dsa.md           # Data Structures & Algorithms topics
│   ├── sdesign.md       # System Design topics
│   ├── webdev.md        # Web Development topics
│   └── ai.md            # AI topics
├── public/              # Static assets
└── ...
```

## Architecture

### Core Components

1. **Navigation System**:
   - Main topic navigation (horizontal bar)
   - Subtopic tree navigation (expandable hierarchical structure)
   - Topic data provider for centralized state management

2. **Content Management**:
   - Dynamic loading of topics from markdown files
   - Hierarchical parsing with support for nested subtopics
   - Question and answer display components

3. **API Layer**:
   - `/api/topics` - Serves parsed topic data from markdown files

### Data Flow

1. User selects a main topic from the navigation bar
2. The application loads the corresponding topic structure
3. Subtopics are displayed in a card-based layout below the main navigation
4. User can navigate through the subtopic hierarchy to find specific content
5. Questions and answers for the selected topic are displayed in the main content area

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- All content is organized for educational purposes
- Special thanks to the Next.js and React communities for their excellent documentation
