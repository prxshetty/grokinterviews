"use client";

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// Define mapping from our topic IDs to numeric database IDs
const TOPIC_ID_MAP: Record<string, number> = {
  // Main Categories
  "ml": 1,
  "ai": 2,
  "webdev": 3,
  "system-design": 4,
  "dsa": 5,
  
  // ML Topics
  "ml-foundations": 1,
  "ml-core-concepts": 1,
  "ml-math-foundations": 2,
  "ml-data-preprocessing": 3,
  "ml-supervised": 5,
  "ml-regression": 6,
  "ml-classification": 7,
  "ml-unsupervised": 8,
  "ml-clustering": 9,
  "ml-dimensionality": 10,
  "ml-neural-networks": 11,
  "ml-nn-fundamentals": 11,
  "ml-nn-architectures": 11,
  "ml-cnn": 11,
  "ml-rnn": 11,
  "ml-transformers": 11,
  "ml-decision-trees": 12,
  "ml-naive-bayes": 13,
  "ml-ensemble": 14,
  
  "ml-model-evaluation": 15,
  "ml-validation": 15,
  "ml-metrics": 15,
  
  "ml-deep-learning": 16,
  "ml-transfer-learning": 16,
  "ml-gans": 16,
  
  "ml-nlp": 17,
  "ml-word-embeddings": 17,
  "ml-llm": 17,
  
  "ml-reinforcement": 5, // Map to supervised learning as fallback
  "ml-time-series": 18,
  "ml-practical": 20,
  
  // AI Topics (will map to related ML topics where applicable)
  "ai-foundations": 1,
  "ai-nlp": 17,
  "ai-cv": 16,
  "ai-rl": 5,
  "ai-ethics": 15,
  
  // Other topics will fall back to ML foundations if no specific mapping
};

interface Question {
  question_id: number;
  title: string;
}

interface Content {
  content_id: number | string;
  content_type: string;
  content: string | null;
  media_url: string | null;
  caption: string | null;
  subtype: string | null;
  youtube_video_id?: string;
  display_order?: number;
}

interface QuestionWithAnswerProps {
  topicId: number | string;
}

export default function QuestionWithAnswer({ topicId }: QuestionWithAnswerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [contentMap, setContentMap] = useState<Record<number, Content[]>>({});
  const [loadingContentId, setLoadingContentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we're only rendering on the client
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Convert string topic ID to numeric ID if needed
  const numericTopicId = typeof topicId === 'string' 
    ? TOPIC_ID_MAP[topicId] || 1
    : topicId;

  // Fetch questions for the selected topic
  useEffect(() => {
    if (!mounted) return;
    
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/questions?topicId=${numericTopicId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        
        const data = await response.json();
        setQuestions(data);
        setExpandedQuestionId(null);
        setContentMap({});
      } catch (err) {
        setError('Error loading questions. Please try again.');
        console.error('Error fetching questions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [numericTopicId, mounted]);

  // Fetch content for a question when it's expanded
  const fetchContentForQuestion = async (questionId: number) => {
    // If we already have the content, no need to fetch again
    if (contentMap[questionId]) return;
    
    try {
      setLoadingContentId(questionId);
      const response = await fetch(`/api/content?questionId=${questionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();

      // Process the content to remove "Related Questions" and format properly
      const processedData = processContent(data);
      
      setContentMap(prevMap => ({
        ...prevMap,
        [questionId]: processedData
      }));
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoadingContentId(null);
    }
  };

  // Process content to clean and format properly
  const processContent = (contentItems: Content[]) => {
    return contentItems.map(item => {
      if (item.content_type === 'text' && item.content) {
        // Remove "Related Questions" section if present
        let content = item.content;
        
        // Check for variations of "Related Questions"
        const relatedQuestionsPatterns = [
          /^Related Questions:[\s\S]*?\n\n/i,
          /^Related Questions[\s\S]*?\n\n/i,
          /^Related:[\s\S]*?\n\n/i,
          /^Related questions and answers:[\s\S]*?\n\n/i,
          /^Similar Questions:[\s\S]*?\n\n/i,
          /^Additional Questions:[\s\S]*?\n\n/i,
          /^Other questions:[\s\S]*?\n\n/i
        ];
        
        for (const pattern of relatedQuestionsPatterns) {
          content = content.replace(pattern, '');
        }

        // Also try to find these patterns if they appear in the middle of the text
        const midTextPatterns = [
          /\n\nRelated Questions:[\s\S]*?(\n\n|$)/gi,
          /\n\nRelated Questions[\s\S]*?(\n\n|$)/gi,
          /\n\nRelated:[\s\S]*?(\n\n|$)/gi,
          /\n\nSimilar Questions:[\s\S]*?(\n\n|$)/gi
        ];

        for (const pattern of midTextPatterns) {
          content = content.replace(pattern, '\n\n');
        }
        
        // Enhance text with proper heading formatting and SVG handling
        content = enhanceTextFormatting(content);
        
        return { ...item, content };
      } else if (item.content_type === 'image' && item.content && item.content.includes('<svg')) {
        // Handle SVG content properly
        return {
          ...item,
          content_type: 'svg',
          svg_content: item.content
        };
      }
      return item;
    });
  };

  // Enhance text formatting
  const enhanceTextFormatting = (text: string) => {
    // Add ## to lines that look like headings but don't already have markdown
    return text
      // Format lines that end with a colon and are short as headings
      .replace(/^(.{5,50}):(\s*)$/gm, '## $1:$2')
      // Format text in ALL CAPS as headings (likely section titles)
      .replace(/^([A-Z][A-Z\s]{5,50})$/gm, '## $1')
      // Add proper list formatting to lines starting with - or *
      .replace(/^[•\-\*]\s+/gm, '- ')
      // Format URLs to be proper markdown links if they're not already
      .replace(/(\s|^)(https?:\/\/[^\s]+)(\s|$)/g, '$1[$2]($2)$3')
      // Format code blocks
      .replace(/```([\s\S]*?)```/g, '\n```\n$1\n```\n')
      // Convert numbered lists (1. 2. etc) to proper markdown
      .replace(/^(\d+)\.\s+/gm, '$1. ')
      // Add blank lines between paragraphs if missing
      .replace(/([^\n])\n([^\n])/g, '$1\n\n$2')
      // Clean up excessive blank lines
      .replace(/\n{3,}/g, '\n\n');
  };

  // Toggle question expansion
  const toggleQuestion = async (questionId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
    } else {
      setExpandedQuestionId(questionId);
      await fetchContentForQuestion(questionId);
    }
  };

  // Don't render until mounted on client
  if (!mounted) {
    return <div className="p-4 font-mono">Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="p-4 font-mono">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 font-mono text-red-500">
        {error}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 font-mono">
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h2 className="text-xl mb-4 text-gray-800 dark:text-white">No Questions Yet</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Questions and answers for this topic will be added soon. Check back later or explore other topics!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 font-mono">
      <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Questions ({questions.length})</h2>
      
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={`question-${question.question_id}`} className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <div 
              onClick={(e) => toggleQuestion(question.question_id, e)}
              className={`cursor-pointer py-2 ${
                expandedQuestionId === question.question_id 
                  ? 'text-gray-900 dark:text-white font-bold' 
                  : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {loadingContentId === question.question_id ? (
                <span className="inline-block w-4 h-4 border-2 border-gray-500 dark:border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <span className={`inline-block mr-2 transform transition-transform ${expandedQuestionId === question.question_id ? 'rotate-90' : ''}`}>
                  ▼
                </span>
              )}
              {question.title}
            </div>
            
            {expandedQuestionId === question.question_id && (
              <div className="py-4 pl-6 text-gray-800 dark:text-gray-200">
                {contentMap[question.question_id] ? (
                  <div className="space-y-4">
                    {contentMap[question.question_id].map((item) => (
                      <div key={`content-${item.content_id}`}>
                        {item.content_type === 'text' && item.content && (
                          <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown>
                              {item.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        {item.content_type === 'image' && item.media_url && (
                          <div className="my-4">
                            <img 
                              src={item.media_url} 
                              alt={item.caption || 'Image'} 
                              className="max-w-full"
                              loading="lazy"
                            />
                            {item.caption && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">{item.caption}</p>
                            )}
                          </div>
                        )}

                        {item.content_type === 'svg' && (item as any).svg_content && (
                          <div className="my-4 flex justify-center">
                            <div 
                              className="max-w-full" 
                              dangerouslySetInnerHTML={{ __html: (item as any).svg_content }}
                            />
                          </div>
                        )}

                        {item.content_type === 'video' && item.youtube_video_id && (
                          <div className="my-4">
                            <div className="relative pb-[56.25%] h-0">
                              <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${item.youtube_video_id}`}
                                title="YouTube video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 