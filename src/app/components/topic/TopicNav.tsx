"use client";

import React, { useEffect, useState } from "react";
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

  function handleTopicClick(topicId: string) {
    setInternalSelectedTopic(topicId);
    onTopicSelect(topicId);
    // Navigate to the correct /topics/[domain] page
    router.push(`/topics/${topicId}`);
  }

  return (
    <nav className="w-full px-0 py-2 bg-transparent">
      <ul className="flex flex-row gap-2 md:gap-4 justify-center items-center">
        {mainTopics.map((topic) => (
          <li key={topic.id}>
            <button
              type="button"
              onClick={() => handleTopicClick(topic.id)}
              className={`px-4 py-1 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-full transition-colors duration-200
                ${effectiveSelectedTopic === topic.id
                  ? "bg-black text-white dark:bg-white dark:text-black shadow"
                  : "bg-white text-black dark:bg-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"}
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