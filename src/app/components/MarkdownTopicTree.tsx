import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TopicItem {
  id: string;
  label: string;
  content?: string;
}

interface MarkdownTopicTreeProps {
  onSelectTopic: (topicId: string) => void;
  defaultTopic?: string;
}

const MarkdownTopicTree: React.FC<MarkdownTopicTreeProps> = ({
  onSelectTopic,
  defaultTopic = 'ml'
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get the current topic from the URL or use the default
  const currentTopicId = searchParams.get('topic') || defaultTopic;

  // Fetch topics when component mounts or topic changes
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        console.log(`MarkdownTopicTree - Fetching topics for ${currentTopicId}`);

        // Use our new markdown-tree API endpoint
        const response = await fetch(`/api/topics/markdown-tree?topicId=${currentTopicId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch topics: ${response.statusText}`);
        }

        const topicData = await response.json();
        console.log('MarkdownTopicTree - Got topic data:', topicData);

        if (!topicData || !topicData[currentTopicId] || !topicData[currentTopicId].subtopics) {
          setError(`No topics found for ${currentTopicId}`);
          setTopics([]);
          return;
        }

        // Convert the topics to the format we need
        const formattedTopics = Object.entries(topicData[currentTopicId].subtopics)
          .map(([id, details]: [string, any]) => ({
            id,
            label: details.label,
            content: details.content || 'No content available',
            hasSubtopics: details.subtopics && Object.keys(details.subtopics).length > 0
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

        console.log('MarkdownTopicTree - Formatted topics:', formattedTopics);
        setTopics(formattedTopics);
        setError(null);
      } catch (err) {
        console.error(`Error fetching topics for ${currentTopicId}:`, err);
        setError(`Failed to load topics for ${currentTopicId}`);

        // Fallback to sample data if there's an error
        setTopics([
          { id: 'section-1', label: 'Section 1', content: 'Content for section 1' },
          { id: 'section-2', label: 'Section 2', content: 'Content for section 2' },
          { id: 'section-3', label: 'Section 3', content: 'Content for section 3' },
          { id: 'section-4', label: 'Section 4', content: 'Content for section 4' },
          { id: 'section-5', label: 'Section 5', content: 'Content for section 5' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [currentTopicId]); // Re-run when the topic changes

  const handleTopicClick = (topicId: string) => {
    console.log('MarkdownTopicTree - handleTopicClick:', topicId);
    setSelectedTopic(topicId);
    onSelectTopic(topicId);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {currentTopicId.charAt(0).toUpperCase() + currentTopicId.slice(1).replace(/-/g, ' ')} Topics
      </h3>

      {loading ? (
        <div className="text-center p-4">
          <div className="animate-pulse">Loading topics...</div>
        </div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">
          {error}
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          No topics found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className={`p-2 rounded cursor-pointer ${
                selectedTopic === topic.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleTopicClick(topic.id)}
            >
              <div className="flex justify-between">
                <div className="font-medium">{topic.label}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  {topic.content ? 'View Content' : 'No Content'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkdownTopicTree;
