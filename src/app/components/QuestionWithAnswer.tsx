import { useState, useEffect } from 'react';

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
  topicId: number;
}

export default function QuestionWithAnswer({ topicId }: QuestionWithAnswerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [contentMap, setContentMap] = useState<Record<number, Content[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions for the selected topic
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/questions?topicId=${topicId}`);
        
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
  }, [topicId]);

  // Fetch content for a question when it's expanded
  const fetchContentForQuestion = async (questionId: number) => {
    // If we already have the content, no need to fetch again
    if (contentMap[questionId]) return;
    
    try {
      const response = await fetch(`/api/content?questionId=${questionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      setContentMap(prevMap => ({
        ...prevMap,
        [questionId]: data
      }));
    } catch (err) {
      console.error('Error fetching content:', err);
    }
  };

  // Toggle question expansion
  const toggleQuestion = async (questionId: number) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
    } else {
      setExpandedQuestionId(questionId);
      await fetchContentForQuestion(questionId);
    }
  };

  if (isLoading) {
    return (
      <div className="card shadow-card p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
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

  if (questions.length === 0) {
    return (
      <div className="card shadow-card p-4 text-gray-500">
        No questions found for this topic.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Questions</h2>
      
      {questions.map((question) => (
        <div key={question.question_id} className="card shadow-card overflow-hidden">
          <button
            onClick={() => toggleQuestion(question.question_id)}
            className={`w-full text-left p-5 bg-card hover:bg-gray-50 transition-colors flex justify-between items-center ${
              expandedQuestionId === question.question_id ? 'border-b border-gray-100' : ''
            }`}
          >
            <h3 className={`text-lg ${expandedQuestionId === question.question_id ? 'text-orange-500 font-semibold' : 'text-gray-800'}`}>
              {question.title}
            </h3>
            <span className={`transition-transform ${expandedQuestionId === question.question_id ? 'text-orange-500 rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          
          <div className={`question-content overflow-hidden transition-all duration-300 ${
            expandedQuestionId === question.question_id ? 'expanded' : ''
          }`}>
            <div className="p-6 bg-white">
              {contentMap[question.question_id] ? (
                <div className="space-y-6 fade-in">
                  {contentMap[question.question_id].map((item) => (
                    <div key={item.content_id}>
                      {item.content_type === 'text' && item.content && (
                        <div className="prose max-w-none">
                          {item.content.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-3 text-gray-800">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {item.content_type === 'image' && item.media_url && (
                        <div className="mt-4">
                          <img 
                            src={item.media_url} 
                            alt={item.caption || 'Image'} 
                            className="max-w-full rounded-md shadow-sm"
                          />
                          {item.caption && (
                            <p className="mt-2 text-sm text-gray-600 italic">{item.caption}</p>
                          )}
                        </div>
                      )}

                      {item.content_type === 'video' && item.youtube_video_id && (
                        <div className="mt-6 mb-6">
                          <div className="relative pb-[56.25%] h-0">
                            <iframe
                              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                              src={`https://www.youtube.com/embed/${item.youtube_video_id}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                          {item.caption && (
                            <p className="mt-3 text-sm text-gray-600 italic">{item.caption}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-pulse flex space-x-4 justify-center">
                    <div className="flex-1 space-y-4 py-1 max-w-md">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 