"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

const mainTopics = [
  { id: "ml", label: "Machine Learning" },
  { id: "ai", label: "Artificial Intelligence" },
  { id: "webdev", label: "Web Development" },
  { id: "sdesign", label: "System Design" },
  { id: "dsa", label: "Data Structures & Algorithms" },
];

interface TopicNavProps {
  onTopicSelect: (topicId: string) => void;
  selectedTopic?: string | null;
}

export default function TopicNav({ onTopicSelect, selectedTopic }: TopicNavProps) {
  const [internalSelectedTopic, setInternalSelectedTopic] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Use external selected topic if provided, otherwise use internal state
  const effectiveSelectedTopic = selectedTopic !== undefined ? selectedTopic : internalSelectedTopic;

  // Sync with external state when it changes
  useEffect(() => {
    if (selectedTopic !== undefined) setInternalSelectedTopic(selectedTopic);
  }, [selectedTopic]);

  const handleTopicClick = useCallback((topicId: string) => {
    // If clicking the same topic that is already selected, force a complete refresh
    if (effectiveSelectedTopic === topicId) {
      // Dispatch the resetCategorySelection event first to reset any category state
      window.dispatchEvent(new CustomEvent('resetCategorySelection', {
        detail: { domain: topicId }
      }));
      
      // Force a full refresh of the topic page to reset all states
      // We can also use router.replace instead of direct page navigation for a cleaner UX
      router.replace(`/topics/${topicId}`);
      return;
    }

    // Normal navigation for switching between topics
    setInternalSelectedTopic(topicId);
    onTopicSelect(topicId);
    // Navigate to the correct /topics/[domain] page
    router.push(`/topics/${topicId}`);
  }, [effectiveSelectedTopic, router, onTopicSelect]);

  return (
    <nav className="w-full px-4 py-4">
      <ul className="flex flex-wrap gap-3 justify-center items-center">
        {mainTopics.map((topic, index) => (
          <li key={topic.id}>
            <button
              type="button"
              onClick={() => handleTopicClick(topic.id)}
              className={`px-5 py-2 text-sm md:text-base font-normal rounded-full border border-gray-200 dark:border-gray-700 transition-colors duration-200 whitespace-nowrap
                ${effectiveSelectedTopic === topic.id
                  ? "bg-black text-white dark:bg-black" 
                  : "bg-white text-black dark:bg-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"}
              `}
              aria-current={effectiveSelectedTopic === topic.id ? "page" : undefined}
            >
              {topic.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}