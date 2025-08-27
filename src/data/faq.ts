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
  {
    id: 'faq-grok-voice-1',
    question: 'What\'s the difference between web voice and phone voice interviews?',
    answer:
      'Web voice interviews run directly in your browser using your computer\'s microphone and speakers, offering instant feedback and visual interface. Phone voice interviews simulate real phone calls to your actual phone number, providing a more authentic interview experience. Web interviews are available globally, while phone interviews are currently US-only.',
  },
  {
    id: 'faq-grok-voice-3',
    question: 'Are there any usage limits for voice interviews?',
    answer:
      'Free users get 5 voice interview sessions per month (both web and phone combined). Each session has a question limit of 5. Extended session duration and unlimited interviews are planned for future release.',
  },
  {
    id: 'faq-grok-voice-4',
    question: 'How can I extend my voice interview limits?',
    answer:
      'Currently, voice interview limits reset weekly while phone interviews are just 1 per month per account. We\'re working on offering additional voice and phone interviews, extended sessions, and priority access to new voice features. Join our waitlist to be notified when these features launch!',
  },
  {
    id: 'faq-grok-voice-7',
    question: 'Is my voice data stored or shared?',
    answer:
      'Your voice data is not stored or shared in web interviews but is analyzed and recorded in real-time for phone interviews. ',
  },
];