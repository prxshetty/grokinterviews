import { useState, useEffect } from 'react';
import TopicTree from './TopicTree';
import dynamic from 'next/dynamic';

// Define the QuestionWithAnswer props interface here
interface QuestionWithAnswerProps {
  topicId: string | number;
}

// Dynamically import QuestionWithAnswer with no SSR
const DynamicQuestionWithAnswer = dynamic<QuestionWithAnswerProps>(
  () => import('./QuestionWithAnswer'),
  { ssr: false }
);

// Root level topic IDs - don't show questions for these
const ROOT_TOPIC_IDS = ['ml', 'ai', 'webdev', 'system-design', 'dsa'];

// Topic name mapping
const TOPIC_NAMES: Record<string, string> = {
  // Main categories
  "ml": "Machine Learning",
  "ai": "Artificial Intelligence",
  "webdev": "Web Development",
  "system-design": "System Design",
  "dsa": "Data Structures & Algorithms",
  
  // ML Topics
  "ml-foundations": "Foundations of Machine Learning",
  "ml-core-concepts": "Core Concepts",
  "ml-math-foundations": "Mathematical Foundations",
  "ml-data-preprocessing": "Data Preprocessing",
  "ml-supervised": "Supervised Learning",
  "ml-regression": "Regression Methods",
  "ml-classification": "Classification Techniques",
  "ml-decision-trees": "Decision Trees and Random Forests",
  "ml-naive-bayes": "Naive Bayes",
  "ml-ensemble": "Ensemble Methods",
  "ml-unsupervised": "Unsupervised Learning",
  "ml-clustering": "Clustering",
  "ml-dimensionality": "Dimensionality Reduction",
  "ml-neural-networks": "Neural Networks",
  "ml-nn-fundamentals": "Fundamental Concepts",
  "ml-nn-architectures": "Architectures",
  "ml-cnn": "Convolutional Neural Networks",
  "ml-rnn": "Recurrent Neural Networks",
  "ml-transformers": "Transformers",
  "ml-model-evaluation": "Model Evaluation",
  "ml-validation": "Validation Techniques",
  "ml-metrics": "Performance Metrics",
  "ml-deep-learning": "Advanced Deep Learning",
  "ml-transfer-learning": "Transfer Learning",
  "ml-gans": "Generative Adversarial Networks",
  "ml-reinforcement": "Reinforcement Learning",
  "ml-nlp": "Natural Language Processing",
  "ml-word-embeddings": "Word Embeddings",
  "ml-llm": "Large Language Models",
  "ml-time-series": "Time Series Analysis",
  "ml-practical": "Practical ML and Deployment",
  
  // AI Topics
  "ai-foundations": "AI Foundations",
  "ai-nlp": "Natural Language Processing",
  "ai-cv": "Computer Vision",
  "ai-rl": "Reinforcement Learning",
  "ai-ethics": "Ethics and Fairness",
  
  // Web Dev Topics
  "web-frontend": "Frontend Development",
  "web-backend": "Backend Development",
  "web-fullstack": "Full Stack Development",
  "web-security": "Web Security",
  "web-performance": "Performance Optimization",
  
  // System Design Topics
  "sd-fundamentals": "System Design Fundamentals",
  "sd-scalability": "Scalability",
  "sd-databases": "Database Design",
  "sd-distributed": "Distributed Systems",
  "sd-microservices": "Microservices Architecture",
  
  // DSA Topics
  "dsa-arrays": "Arrays and Strings",
  "dsa-linked-lists": "Linked Lists",
  "dsa-trees": "Trees and Graphs",
  "dsa-sorting": "Sorting and Searching",
  "dsa-dynamic": "Dynamic Programming"
};

export default function InterviewPrep() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Ensure we're mounted before rendering
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  const handleTopicSelect = (topicId: string) => {
    const isRootTopic = ROOT_TOPIC_IDS.includes(topicId);
    
    if (selectedTopicId === topicId) {
      // If clicking the same topic again, toggle content visibility
      // But only if it's not a root topic
      if (!isRootTopic) {
        setShowContent(!showContent);
      }
    } else {
      // If clicking a new topic, set the new topic
      setSelectedTopicId(topicId);
      // Only show content if it's not a root topic
      setShowContent(!isRootTopic);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  // Check if the selected topic is a root topic
  const isRootTopicSelected = selectedTopicId ? ROOT_TOPIC_IDS.includes(selectedTopicId) : false;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <TopicTree onSelectTopic={handleTopicSelect} />
        
        {selectedTopicId && showContent && !isRootTopicSelected && (
          <div className="mt-10 font-mono">
            <h2 className="text-2xl mb-4 text-gray-800 border-b border-gray-200 pb-2">
              {TOPIC_NAMES[selectedTopicId] || selectedTopicId}
            </h2>
            <DynamicQuestionWithAnswer topicId={selectedTopicId} />
          </div>
        )}
      </div>
    </div>
  );
} 