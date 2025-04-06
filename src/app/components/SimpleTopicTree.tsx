import React, { useState, useEffect } from 'react';
import TopicDataService from '@/services/TopicDataService';

interface SimpleTopicTreeProps {
  onSelectTopic: (topicId: string) => void;
}

interface TopicItem {
  id: string;
  label: string;
  content?: string;
}

const SimpleTopicTree: React.FC<SimpleTopicTreeProps> = ({ onSelectTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ML topics when component mounts
  useEffect(() => {
    const fetchMlTopics = async () => {
      try {
        setLoading(true);
        console.log('SimpleTopicTree - Fetching ML topics');

        // Get ML topics from the service
        const mlTopicsData = await TopicDataService.getMlTopicData();
        console.log('SimpleTopicTree - Got ML topics:', mlTopicsData);

        if (!mlTopicsData || !mlTopicsData.ml || !mlTopicsData.ml.subtopics) {
          setError('No ML topics found');
          setTopics([]);
          return;
        }

        // Convert the ML topics to the format we need
        const formattedTopics = Object.entries(mlTopicsData.ml.subtopics).map(([id, details]: [string, any]) => ({
          id,
          label: details.label,
          content: details.content || 'No content available'
        }));

        console.log('SimpleTopicTree - Formatted topics:', formattedTopics);
        setTopics(formattedTopics);
        setError(null);
      } catch (err) {
        console.error('Error fetching ML topics:', err);
        setError('Failed to load ML topics');

        // Fallback to sample data if there's an error
        setTopics([
          { id: 'supervised-learning', label: 'Supervised Learning', content: 'Supervised learning algorithms' },
          { id: 'unsupervised-learning', label: 'Unsupervised Learning', content: 'Unsupervised learning algorithms' },
          { id: 'deep-learning', label: 'Deep Learning', content: 'Deep learning algorithms' },
          { id: 'reinforcement-learning', label: 'Reinforcement Learning', content: 'Reinforcement learning algorithms' },
          { id: 'model-evaluation', label: 'Model Evaluation', content: 'Model evaluation techniques' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMlTopics();
  }, []);

  const handleTopicClick = (topicId: string) => {
    console.log('SimpleTopicTree - handleTopicClick:', topicId);
    setSelectedTopic(topicId);
    onSelectTopic(topicId);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Machine Learning Topics</h3>

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

export default SimpleTopicTree;
