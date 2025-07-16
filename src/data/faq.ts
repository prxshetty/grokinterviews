import { FaqItem } from '@/types/faq';

export const DEFAULT_FAQ_PROPS = {
  heading: "Frequently asked questions",
  description: "Find answers to common questions about our products. Can't find what you're looking for? Contact our support team.",
  items: [] as FaqItem[]
};

// Example FAQ items (can be used for testing or as defaults)
export const EXAMPLE_FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    question: "What is the return policy?",
    answer: "You can return any item within 30 days of purchase for a full refund, provided it is in its original condition.",
  },
  {
    id: "faq-2",
    question: "How do I track my order?",
    answer: "Once your order is shipped, you will receive an email with a tracking number. You can use this number on our website to track your order.",
  },
  {
    id: "faq-3",
    question: "Do you offer international shipping?",
    answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary depending on the destination.",
  },
];
