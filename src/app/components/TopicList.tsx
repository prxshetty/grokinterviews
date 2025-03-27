import { useState, useEffect } from 'react';

interface Topic {
  topic_id: number;
  name: string;
}

interface TopicListProps {
  onSelectTopic: (topicId: number) => void;
  selectedTopicId: number | null;
}

export default function TopicList({ onSelectTopic, selectedTopicId }: TopicListProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch topics on initial load
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/topics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        
        const data = await response.json();
        setTopics(data);
      } catch (err) {
        setError('Error loading topics. Please try again.');
        console.error('Error fetching topics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  if (isLoading) {
    return (
      <div className="card shadow-card p-4">
        Loading topics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card shadow-card p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="card shadow-card overflow-hidden">
      <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Interview Topics</h2>
      
      <div className="p-4 bg-card flex flex-wrap gap-3">
        {topics.map((topic) => (
          <button
            key={topic.topic_id}
            onClick={() => onSelectTopic(topic.topic_id)}
            className={`py-2 px-4 rounded-full transition-colors ${
              selectedTopicId === topic.topic_id 
                ? 'bg-orange-500 text-white font-medium shadow-md' 
                : 'bg-white hover:bg-gray-100 text-gray-800 shadow-sm'
            }`}
          >
            {topic.name}
          </button>
        ))}
      </div>
    </div>
  );
} 