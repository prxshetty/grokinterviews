'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizTopicNav } from '@/app/components/quiz-ui';

export default function QuizzesPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const router = useRouter();

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    router.push(`/quizzes/${topicId}`);
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen">
      {/* Topic Navigation for domain selection */}
      <div className="topic-navigation w-full sticky top-12 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-0 mt-0 border-b border-gray-200 dark:border-gray-800">
        <div className="w-full">
          <QuizTopicNav
            onTopicSelect={handleTopicSelect}
            selectedTopic={selectedTopic}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="container mx-auto px-4 md:px-6 py-20">
        <div className="text-center text-gray-400 dark:text-gray-500 text-lg">
          <p>Select a domain above to start a quiz</p>
        </div>
      </div>
    </div>
  );
}
