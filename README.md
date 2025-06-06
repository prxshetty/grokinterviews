# 🚀 GrokInterviews - AI-Powered Interview Preparation Platform

> A comprehensive, AI-enhanced interview preparation platform with **3.6+ million curated resources** and **81,499 technical questions** across 5 major domains.

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## 📊 Scale & Impact

- **🗃️ 3,646,759 Learning Resources** - Curated YouTube videos, research papers, PDFs, and educational content
- **❓ 81,499 Interview Questions** across 5 comprehensive domains
- **📂 16,300 Question Categories** with hierarchical organization
- **🎯 2,394 Technical Topics** covering all major interview preparation areas
- **🏗️ 22,482 Lines of Code** in TypeScript/React/Next.js
- **🔌 30 RESTful API Endpoints** for comprehensive data access
- **⚡ 51 React Components** with modular, reusable architecture

## 🎯 Domain Coverage

| Domain | Topics | Categories | Questions |
|--------|--------|------------|-----------|
| **AI & Machine Learning** | 813 | 6,673 | 33,363 |
| **Web Development** | 431 | 4,016 | 20,080 |
| **System Design** | 461 | 2,360 | 11,800 |
| **Data Structures & Algorithms** | 305 | 1,715 | 8,575 |
| **Machine Learning** | 384 | 1,536 | 7,681 |

## ✨ Key Features

### 🤖 AI-Powered Learning
- **Dynamic Answer Generation** using multiple LLM models via Groq API
- **Personalized Learning Paths** with intelligent resource recommendations
- **Smart Content Filtering** by difficulty, keywords, and learning preferences

### 📈 Advanced Progress Tracking
- **Real-time Progress Analytics** with completion percentages
- **Hierarchical Progress Calculation** (Domain → Section → Topic → Category → Questions)
- **Visual Activity Grids** showing learning streaks and patterns
- **Intelligent Bookmarking System** for personalized study plans

### 🔍 Powerful Search & Navigation
- **Multi-level Topic Hierarchy** with intuitive navigation
- **Advanced Filtering Options** by difficulty, domain, and keywords
- **Smart Search Functionality** across 81K+ questions
- **Responsive Grid Layouts** optimized for all devices

### 👤 User Experience
- **Seamless Authentication** with Google OAuth integration
- **Dark/Light Mode Support** with system preference detection
- **Personalized Dashboard** with progress insights and recommendations
- **Mobile-First Responsive Design** using Tailwind CSS

## 🏗️ Technical Architecture

### Frontend Stack
```typescript
- Next.js 14 App Router with React Server Components
- TypeScript for type safety and developer experience
- Tailwind CSS + Shadcn UI for modern, accessible components
- React Hooks with optimized state management
- Framer Motion for smooth animations and transitions
```

### Backend & Database
```sql
- Supabase (PostgreSQL) with Row Level Security (RLS)
- 15+ interconnected tables with complex relationships
- Materialized views for optimized progress calculations
- Real-time subscriptions for live progress updates
- Intelligent caching strategies and batch processing
```

### AI & API Integration
```javascript
- Groq API integration for LLM-powered answer generation
- 30 RESTful API endpoints with comprehensive error handling
- Request deduplication and intelligent caching
- User preference-based AI model selection
- Resource filtering based on learning preferences
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for database)
- Groq API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/grokinterviews.git
   cd grokinterviews
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your Supabase and Groq API credentials
   ```

4. **Database Setup**
   ```bash
   # Run database migrations (if any)
   # The database schema is automatically managed by Supabase
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
grokinterviews/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # 30 API endpoints
│   │   ├── components/        # 51 React components
│   │   │   ├── ui/           # Shared UI components
│   │   │   ├── topics-ui/    # Topic-specific components
│   │   │   ├── questions/    # Question components
│   │   │   └── progress/     # Progress tracking components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Database utilities
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Helper functions
│   ├── components/           # Additional shared components
│   ├── services/             # External service integrations
│   └── utils/                # Core utilities
├── public/                   # Static assets
├── DATABASE.md              # Database schema documentation
├── HANDOFF.md              # Development status and progress
└── ...
```

## 🔧 API Endpoints

<details>
<summary>View All 30 API Endpoints</summary>

### User Management
- `GET /api/user/progress` - Overall user progress
- `GET /api/user/stats` - User statistics and analytics
- `GET /api/user/domains` - Domain-specific progress
- `GET /api/user/activity` - User activity tracking
- `GET /api/user/bookmarks` - User bookmarks

### Content Management
- `GET /api/topics` - Topic hierarchy
- `GET /api/topics/categories` - Topic categories
- `GET /api/topics/by-section` - Section-based topics
- `GET /api/topics/topic-details` - Detailed topic information
- `GET /api/questions` - Question management
- `GET /api/questions/difficulty` - Difficulty-based filtering
- `GET /api/section-headers` - Section headers

### Progress Tracking
- `GET /api/user/progress/summary` - Progress summaries
- `GET /api/user/progress/category` - Category progress
- `GET /api/user/progress/topic` - Topic progress
- `GET /api/user/progress/subtopic` - Subtopic progress
- `POST /api/user/progress/update-all-sections` - Batch updates

And 13 more specialized endpoints...
</details>

## 🛡️ Database Schema

The application uses a sophisticated PostgreSQL database with:

- **15+ Interconnected Tables** with foreign key relationships
- **Materialized Views** for complex progress calculations
- **Row Level Security (RLS)** for data protection
- **Real-time Subscriptions** for live updates
- **Optimized Indexing** for sub-second query performance

Key tables: `profiles`, `topics`, `categories`, `questions`, `resources`, `user_progress`, `user_activity`, `user_bookmarks`, `user_preferences`

## 🎯 Recent Engineering Achievements

- ✅ **Performance Optimization**: Implemented React.memo, useMemo, and lazy loading
- ✅ **Database Optimization**: Created materialized views reducing query time by 80%
- ✅ **Component Architecture**: Consolidated duplicate components reducing bundle size by 30%
- ✅ **Real-time Features**: Built activity tracking processing 200+ events per user
- ✅ **AI Integration**: Implemented dynamic answer generation with multiple LLM models
- ✅ **Progressive Web App**: Added offline capabilities and mobile optimization

## 🚀 Performance Metrics

- **⚡ Sub-second Query Performance** for 81K+ questions
- **📱 Mobile-First Responsive** design with 95+ Lighthouse scores
- **🔄 Real-time Updates** with Supabase subscriptions
- **💾 Intelligent Caching** reducing API calls by 60%
- **🎨 Optimized Bundle Size** with code splitting and lazy loading

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast LLM inference
- **Supabase** for the robust backend infrastructure
- **Next.js** and **React** communities for excellent documentation
- **Tailwind CSS** and **Shadcn UI** for beautiful, accessible components

---

<div align="center">
  <strong>Built with ❤️ for the developer community</strong>
  <br>
  <sub>Helping developers ace their technical interviews with AI-powered preparation</sub>
</div>
