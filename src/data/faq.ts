import { FaqItem } from '@/types/faq';

export const DEFAULT_FAQ_PROPS = {
  heading: "Frequently asked questions",
  description: "Find answers to common questions about our products. Can't find what you're looking for? Contact our support team.",
  items: [] as FaqItem[]
};

// GrokInterviews specific FAQ items
export const GROK_INTERVIEW_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-grok-1',
    question: 'What is GrokInterviews?',
    answer:
      'GrokInterviews is a comprehensive, AI-enhanced interview preparation platform with over 3.6 million curated resources and 50,000+ technical questions. Our mission is to provide the best tools and content to help software engineers and data scientists ace their interviews.',
  },
  {
    id: 'faq-grok-2',
    question: 'How does the AI answer generation work and why is it so fast?',
    answer:
      'We utilize multiple Large Language Models (LLMs) via one of the fastest inference provider to generate dynamic, high-quality answers to technical questions. Users can even select their preferred AI model based on their learning preferences.',
  },
  {
    id: 'faq-grok-3',
    question: 'What are resources?',
    answer:
      'Resources are collected using a custom-built web search meta search engine hosted locally, then preprocessed, filtered, and embedded to compute a relevance score for each question. These resources are stored in our database and linked to every question.',
  },
  {
    id: 'faq-grok-4',
    question: 'Can I track my progress?',
    answer:
      'Absolutely! We offer advanced progress tracking with real-time analytics, hierarchical progress calculation (from domain down to individual questions), visual activity grids, and an intelligent bookmarking system.',
  },
  {
    id: 'faq-grok-5',
    question: 'Is GrokInterviews free to use?',
    answer:
      'GrokInterviews offers a substantial amount of free content and features, including AI-powered answer generation and resource lists! We are committed to keeping these features free for as long as possible.',
  },
  {
    id: 'faq-grok-6',
    question: 'What future features are planned?',
    answer:
      'We are exploring exciting updates such as voice interviews, Duolingo-style roadmaps for every domain, both typed and voice-based quizzes, streak tracking, and a dedicated section for coding questions with virtual machines for live testing and much more. These features will be prioritized if the platform gains traction!',
  },
];