'use client';

import React from 'react';

export default function ProjectsSection() {
  return (
    <div className="mt-32 mb-24 max-w-screen-xl mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
        {/* Left side with description */}
        <div className="md:col-span-4 flex flex-col">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Interview Preparation Platform</div>
            <h2 className="text-3xl md:text-4xl font-serif font-light tracking-tight leading-tight mb-6">Master<br />Technical<br />Interviews.</h2>
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-700 mb-6"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Key Features
            </p>
          </div>
          <div className="mt-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span>grokinterviews.co</span>
            </div>
          </div>
        </div>

        {/* Right side with projects */}
        <div className="md:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Navigation</div>
              <h3 className="text-lg font-medium mb-2">Hierarchical<br />Topic Trees</h3>
              <div className="relative bg-gray-100 dark:bg-gray-800 mb-4 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <img
                  src="/images/model.webp"
                  alt="Hierarchical Topic Trees"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>Browse questions by main topics (ML, DSA, WebDev, etc.) and dive deep with intuitive subtopic trees.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">AI Powered Answers</div>
              <h3 className="text-lg font-medium mb-2">Custom<br />Concierge</h3>
              <div className="relative bg-gray-100 dark:bg-gray-800 mb-4 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <img
                  src="/images/agents.webp"
                  alt="Comprehensive Coverage"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>Access expertly curated content across multiple domains with AI-powered answers from GPT-4, Claude, or Gemini for AI, System Design, and core CS fundamentals.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Experience</div>
              <h3 className="text-lg font-medium mb-2">Modern<br />Learning UI</h3>
              <div className="relative bg-gray-100 dark:bg-gray-800 mb-4 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <img
                  src="/images/llm.webp"
                  alt="Modern Learning UI"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>Enjoy a seamless, responsive interface with dark mode support for focused preparation.</p>
              </div>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="mt-12 flex justify-end">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
