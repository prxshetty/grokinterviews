export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Faq3Props {
  /** Main heading for the FAQ section */
  heading?: string;
  /** Description text below the heading */
  description?: string;
  /** Array of FAQ items to display */
  items?: FaqItem[];
}
