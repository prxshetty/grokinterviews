import { Metadata } from 'next'
import { Faq3 } from '@/components/ui/faq3'
import ContactForm from './components/ContactForm'
import { FaqItem } from '@/types/faq'

export const metadata: Metadata = {
  title: 'About GrokInterviews',
  description:
    'Learn more about GrokInterviews, an AI-powered platform for interview preparation, and how we help you ace your technical interviews.',
}

const grokInterviewFaqItems: FaqItem[] = [
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
]

export default function AboutPage() {
  return (
    <div className="w-full">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          {/* Header Section */}
          <header className="mb-16 md:mb-24 text-left">
            <div className="max-w-3xl">
              <h2 className="text-2xl md:text-3xl text-gray-600 dark:text-gray-400 font-light tracking-wide">
                About Us
              </h2>
              <h1 className="text-5xl md:text-7xl mt-2 font-light tracking-tight leading-tight text-black dark:text-white">
                GrokInterviews
              </h1>
            </div>
          </header>

          {/* Our Mission Section */}
          <section className="mb-16 md:mb-24 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-normal text-black dark:text-white mb-6">
              Our Mission
            </h2>
            <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                At GrokInterviews, our mission is to empower software engineers and
                data scientists with the most comprehensive and intelligent tools
                for interview preparation. We aggregate, organize, and present a
                vast array of resources, enhanced by AI, to help you master
                technical concepts and excel in your interviews.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16 md:mb-24">
            <Faq3
              heading="Frequently Asked Questions"
              description="Find answers to common questions about our platform and features."
              items={grokInterviewFaqItems}
            />
          </section>

          {/* Contact Section */}
          <section id="contact-form" className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-light mb-4">Let's Have a Chat</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Questions about our platform, features, or just want to say hello? We're here to help
              </p>
            </div>
            <ContactForm />
          </section>
        </main>
      </div>
  )
}