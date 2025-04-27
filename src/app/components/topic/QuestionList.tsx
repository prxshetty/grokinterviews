'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface QuestionType {
  id: number;
  category_id: number;
  question_text: string;
  answer_text?: string;
  keywords?: string[];
  difficulty?: string;
  created_at?: string;
  categories?: {
    id: number;
    name: string;
    topic_id: number;
    topics?: {
      id: number;
      name: string;
      domain: string;
    }
  };
}

interface QuestionsByCategory {
  [categoryId: string]: {
    categoryName: string;
    questions: QuestionType[];
  };
}

interface QuestionListProps {
  questions: QuestionType[];
  highlightedQuestionId?: number;
  groupByCategory?: boolean;
}

export default function QuestionList({
  questions,
  highlightedQuestionId,
  groupByCategory = true
}: QuestionListProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<number, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Auto-expand highlighted question
  useEffect(() => {
    if (highlightedQuestionId && !expandedQuestions[highlightedQuestionId]) {
      setExpandedQuestions(prev => ({
        ...prev,
        [highlightedQuestionId]: true
      }));
      // Load the answer for the highlighted question
      fetchAnswerForQuestion(highlightedQuestionId);
    }
  }, [highlightedQuestionId]);
  
  // Function to fetch answer content from the API
  const fetchAnswerForQuestion = async (questionId: number) => {
    // Skip if we already have the answer
    if (questionAnswers[questionId]) return;
    
    // Set loading state
    setLoadingAnswers(prev => ({ ...prev, [questionId]: true }));
    
    try {
      console.log(`Fetching answer for question ID: ${questionId}`);
      const response = await fetch(`/api/questions/answer?questionId=${questionId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if we need to generate the answer via AI
        if (data && data.needs_generation) {
          console.log(`Question ${questionId} needs answer generation, fetching from Groq API...`);
          
          // Try to get the question text from our local state
          let questionText = "";
          const questionInState = questions.find(q => q.id === questionId);
          
          if (questionInState) {
            questionText = questionInState.question_text;
          } else {
            // If not in local state, use the question text from the API response
            console.log(`Question ${questionId} not found in local state, using API data`);
            
            if (data.question_text) {
              questionText = data.question_text;
            } else {
              // If we don't have the question text from either source, show an error
              throw new Error(`Unable to find question text for ID ${questionId}`);
            }
          }
          
          // Show loading message while we generate
          setQuestionAnswers(prev => ({ 
            ...prev, 
            [questionId]: "Generating answer using AI. This may take a few moments..." 
          }));
          
          // Call the generate-answer API
          const generateResponse = await fetch('/api/generate-answer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questionText: questionText,
              questionId: questionId,
            }),
          });
          
          if (generateResponse.ok) {
            const generateData = await generateResponse.json();
            
            if (generateData.answer) {
              console.log(`Successfully generated answer for question ${questionId}`);
              setQuestionAnswers(prev => ({ 
                ...prev, 
                [questionId]: generateData.answer 
              }));
            } else if (generateData.message) {
              // Handle case where generation failed but we have a message (e.g. missing API key)
              console.warn(`Answer generation returned a message: ${generateData.message}`);
              setQuestionAnswers(prev => ({ 
                ...prev, 
                [questionId]: generateData.message
              }));
            } else {
              throw new Error('Empty response from answer generation API');
            }
          } else {
            throw new Error(`Failed to generate answer: ${generateResponse.statusText}`);
          }
        } else if (data && data.answer_text) {
          // We have a pre-stored answer in the database
          console.log(`Successfully received answer for question ${questionId}`);
          setQuestionAnswers(prev => ({ 
            ...prev, 
            [questionId]: data.answer_text 
          }));
        } else {
          console.warn(`No answer text in response for question ${questionId}`);
          setQuestionAnswers(prev => ({ 
            ...prev, 
            [questionId]: "No answer available for this question." 
          }));
        }
      } else {
        console.error(`Error fetching answer for question ${questionId}: ${response.statusText}`);
        // Still provide a fallback answer instead of showing an error to the user
        const fallbackAnswer = "We're currently preparing a detailed answer for this question.";
        setQuestionAnswers(prev => ({ 
          ...prev, 
          [questionId]: fallbackAnswer 
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch answer for question ${questionId}:`, error);
      // Use a fallback answer for better user experience
      const fallbackAnswer = "We're currently preparing a detailed answer for this question.";
      setQuestionAnswers(prev => ({ 
        ...prev, 
        [questionId]: fallbackAnswer 
      }));
    } finally {
      setLoadingAnswers(prev => ({ ...prev, [questionId]: false }));
    }
  };
  
  // Format an answer for display - handles paragraphs and other formatting
  const formatAnswer = (answerText: string) => {
    if (!answerText) return null;
    
    // Split into paragraphs and render each one
    const paragraphs = answerText.split('\n\n');
    if (paragraphs.length > 1) {
      return (
        <>
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-4">{paragraph}</p>
          ))}
        </>
      );
    }
    
    // Single paragraph
    return <p>{answerText}</p>;
  };
  
  const toggleQuestion = (questionId: number) => {
    // Toggle expanded state
    const newExpandedState = !expandedQuestions[questionId];
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: newExpandedState
    }));
    
    // If expanding and we don't have the answer yet, fetch it
    if (newExpandedState && !questionAnswers[questionId]) {
      fetchAnswerForQuestion(questionId);
    }
    
    // Update URL when expanding/collapsing question
    const params = new URLSearchParams(searchParams);
    if (newExpandedState) {
      params.set('question', questionId.toString());
    } else {
      params.delete('question');
    }
    
    // Update URL without full refresh using replace to avoid adding to history stack
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  // Get answer text for a question - from props, state, or fallback
  const getAnswerText = (question: QuestionType) => {
    if (questionAnswers[question.id]) {
      return questionAnswers[question.id];
    }
    
    if (question.answer_text) {
      return question.answer_text;
    }
    
    return null;
  };
  
  // If no questions are provided, show a message
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No questions found.</p>
      </div>
    );
  }
  
  // Group questions by category if requested
  if (groupByCategory) {
    const questionsByCategory: QuestionsByCategory = {};
    
    // Group questions by category
    questions.forEach(question => {
      const categoryId = String(question.category_id);
      const categoryName = 
        question.categories?.name || 
        `Category ${question.category_id}`;
      
      if (!questionsByCategory[categoryId]) {
        questionsByCategory[categoryId] = {
          categoryName,
          questions: []
        };
      }
      
      questionsByCategory[categoryId].questions.push(question);
    });
    
    // Render grouped by category
    return (
      <div className="space-y-8 animate-fadeIn">
        {Object.entries(questionsByCategory).map(([categoryId, { categoryName, questions }]) => (
          <div key={categoryId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium">{categoryName}</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {questions.map((question) => (
                <div 
                  key={question.id} 
                  className={`p-4 ${highlightedQuestionId === question.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                  id={`question-${question.id}`}
                >
                  <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleQuestion(question.id)}>
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{question.question_text}</p>
                      
                      {/* Question metadata (difficulty, keywords) */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {question.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            question.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                            question.difficulty === 'intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </span>
                        )}
                        
                        {question.keywords && question.keywords.map((keyword, index) => (
                          <span 
                            key={index} 
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-gray-400">
                      <svg
                        className={`h-5 w-5 transform transition-transform ${expandedQuestions[question.id] ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Answer */}
                  {expandedQuestions[question.id] && (
                    <div className="mt-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">Answer</h4>
                        
                        {/* Share button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent toggling the question
                            
                            // Create a shareable URL
                            const url = `${window.location.origin}${pathname}?question=${question.id}`;
                            
                            // Copy to clipboard
                            navigator.clipboard.writeText(url)
                              .then(() => {
                                alert('Question link copied to clipboard!');
                              })
                              .catch(err => {
                                console.error('Failed to copy URL:', err);
                              });
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share
                        </button>
                      </div>
                      
                      <div className="prose dark:prose-invert max-w-none">
                        {loadingAnswers[question.id] ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 animate-spin"></div>
                            <p className="text-gray-500">Loading answer...</p>
                          </div>
                        ) : getAnswerText(question) ? (
                          formatAnswer(getAnswerText(question)!)
                        ) : (
                          <p className="italic text-gray-500 dark:text-gray-400">No answer available.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    // Render flat list of questions
    return (
      <div className="space-y-4 animate-fadeIn">
        {questions.map((question) => (
          <div 
            key={question.id} 
            className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
              highlightedQuestionId === question.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
            }`}
            id={`question-${question.id}`}
          >
            <div 
              className="p-4 cursor-pointer" 
              onClick={() => toggleQuestion(question.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{question.question_text}</p>
                  
                  {/* Question metadata */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {question.categories?.name && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {question.categories.name}
                      </span>
                    )}
                    
                    {question.difficulty && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        question.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        question.difficulty === 'intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                    )}
                    
                    {question.keywords && question.keywords.map((keyword, index) => (
                      <span 
                        key={index} 
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-gray-400">
                  <svg
                    className={`h-5 w-5 transform transition-transform ${expandedQuestions[question.id] ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Answer */}
              {expandedQuestions[question.id] && (
                <div className="mt-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Answer</h4>
                    
                    {/* Share button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent toggling the question
                        
                        // Create a shareable URL with the question ID
                        const url = `${window.location.origin}${pathname}?question=${question.id}`;
                        
                        // Copy to clipboard
                        navigator.clipboard.writeText(url)
                          .then(() => {
                            alert('Question link copied to clipboard!');
                          })
                          .catch(err => {
                            console.error('Failed to copy URL:', err);
                          });
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    {loadingAnswers[question.id] ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full border-2 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 animate-spin"></div>
                        <p className="text-gray-500">Loading answer...</p>
                      </div>
                    ) : getAnswerText(question) ? (
                      formatAnswer(getAnswerText(question)!)
                    ) : (
                      <p className="italic text-gray-500 dark:text-gray-400">No answer available.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
} 