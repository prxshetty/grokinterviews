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
    question: 'What are resources?',
    answer:
      'Resources are collected using a custom-built web search meta search engine hosted locally, then preprocessed, filtered, and embedded to compute a relevance score for each question. These resources are stored in our database and linked to every question.',
  },
  {
    id: 'faq-grok-2',
    question: 'Is GrokInterviews free to use?',
    answer:
      'Yes! GrokInterviews is proudly open source. You can use the platform freely by bringing your own API keys. We believe in democratizing access to interview preparation tools.',
  },
  {
    id: 'faq-grok-3',
    question: 'How can I request features or contribute?',
    answer:
      'We welcome community contributions! Since the project is open source, you can head over to our GitHub repository to request features, report bugs, or submit Pull Requests. Join us in building the best interview prep platform!',
  },
  {
    id: 'faq-grok-data-privacy',
    question: 'What data is stored locally on my device?',
    answer:
      'We prioritize your privacy by storing all sensitive data locally in your browser\'s storage. This includes your API keys, interview transcripts, bookmarks, learning progress, and custom preferences. Your voice data is processed transiently by your chosen AI provider (e.g., OpenAI) and is never stored on our servers.',
  },
];