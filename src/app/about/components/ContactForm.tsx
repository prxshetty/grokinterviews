'use client'

export default function ContactForm() {
  return (
    <div className="w-full">
      <div className="rounded-2xl p-8 text-center">
        <a
          href="mailto:support@grokinterviews.org"
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white dark:text-black bg-black dark:bg-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 w-full sm:w-auto"
        >
          support@grokinterviews.org
        </a>
      </div>
    </div>
  )
}