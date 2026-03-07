import { Metadata } from 'next'
import Link from 'next/link'
import { Faq3 } from '@/components/ui/faq3'
import ContactForm from './components/ContactForm'
import { GROK_INTERVIEW_FAQ_ITEMS } from '@/data/faq'
export const metadata: Metadata = {
  title: 'About GrokInterviews',
  description:
    'Learn more about GrokInterviews, an AI-powered platform for interview preparation, and how we help you ace your technical interviews.',
}

export default function AboutPage() {
  return (
    <div className="w-full">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        {/* Header Section */}
        <header className="mb-16 md:mb-24 text-left">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl mt-2 font-editorial font-extralight tracking-[-1.8px] leading-[110%] text-black dark:text-white">
              About Us
            </h1>
          </div>
        </header>

        <section className="mb-16 md:mb-24 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-editorial font-extralight text-black dark:text-white mb-6">
            The Mission
          </h2>
          <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              This project is for students and engineers with the most comprehensive and intelligent resources
              for interview preparation. Aggregated, organized, and presented a
              vast array of resources, enhanced by AI, to help you master
              technical concepts and excel in your interviews.
            </p>
            <p>
              Best of all, GrokInterviews is completely <strong>open source and free</strong>. We believe that high-quality
              educational resources should be accessible to everyone, regardless of their background or financial status.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="https://github.com/prxshetty/grokinterviews"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
            >
              <span className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-6 bg-black/5 dark:bg-white/10" />
              </span>
              <span className="relative flex items-center gap-2">
                View Repository <span className="text-gray-400 dark:text-gray-500">&rarr;</span>
              </span>
            </Link>
          </div>
        </section>

        <section className="mb-16 md:mb-24 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-editorial font-extralight text-black dark:text-white mb-6">
            Our Technology
          </h2>
          <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              We prioritize privacy and speed by leveraging a local-first architecture. Everything—from your learning progress to your custom bookmarks—is cached directly on your device.
            </p>
            <p>
              By bringing your own API keys, your sensitive data remains under your control, ensuring that your interview preparation is both private and incredibly fast.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16 md:mb-24">
          <Faq3
            heading="Frequently Asked Questions"
            description="Find answers to common questions about our platform and features."
            items={GROK_INTERVIEW_FAQ_ITEMS}
          />
        </section>

        {/* Contact Section */}
        <section id="contact-form" className="max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl font-editorial font-extralight mb-4">Let's Have a Chat</h2>
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