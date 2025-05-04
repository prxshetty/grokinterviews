'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ResourceList } from '../questions/ResourceList';
import { isQuestionCompleted, markQuestionAsCompleted } from '@/app/utils/progress';
import { BookmarkButton } from '../questions/BookmarkButton';

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
  const [completedQuestions, setCompletedQuestions] = useState<Record<number, boolean>>({});
  const [scrollProgress, setScrollProgress] = useState<Record<number, number>>({});
  const answerRefs = useRef<Record<number, HTMLDivElement | null>>({});
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
  
  // Check completion status of questions when they are loaded
  useEffect(() => {
    const checkCompletionStatus = async () => {
      const completionStatus: Record<number, boolean> = {};
      
      // Check each question's completion status
      for (const question of questions) {
        if (question.id) {
          try {
            const isCompleted = await isQuestionCompleted(question.id);
            completionStatus[question.id] = isCompleted;
          } catch (error) {
            console.error(`Error checking completion status for question ${question.id}:`, error);
            completionStatus[question.id] = false;
          }
        }
      }
      
      setCompletedQuestions(completionStatus);
    };
    
    checkCompletionStatus();
    
    // Setup event listener for question completion events
    const handleQuestionCompleted = (event: CustomEvent) => {
      const { questionId } = event.detail;
      setCompletedQuestions(prev => ({
        ...prev,
        [questionId]: true
      }));
    };
    
    window.addEventListener('questionCompleted', handleQuestionCompleted as EventListener);
    
    return () => {
      window.removeEventListener('questionCompleted', handleQuestionCompleted as EventListener);
    };
  }, [questions]);
  
  // --- Scroll tracking and completion logic ---
  const scrollTimeoutRef = useRef<Record<number, NodeJS.Timeout | null>>({});
  
  useEffect(() => {
    // This effect sets up and cleans up scroll listeners for expanded answers
    const currentlyExpanded = Object.keys(expandedQuestions).filter(id => expandedQuestions[parseInt(id)]);
    
    currentlyExpanded.forEach(idStr => {
      const questionId = parseInt(idStr);
      const answerElement = answerRefs.current[questionId];
      const currentAnswerText = getAnswerText(questionId);
      const answerIsReady = answerElement && currentAnswerText && !loadingAnswers[questionId];

      if (!answerIsReady) return; // Don't track if not ready or element doesn't exist

      const calculateScrollProgress = () => {
        if (!answerElement) return;
        
        const totalHeight = answerElement.scrollHeight - answerElement.clientHeight;
        let percentage = 0;
        
        if (totalHeight <= 0) {
          percentage = currentAnswerText ? 100 : 0;
           if (percentage === 100 && !completedQuestions[questionId]) {
             // Find question details safely
             const question = questions.find(q => q.id === questionId);
             const topicId = question?.categories?.topic_id;
             const categoryId = question?.category_id;

             if (!topicId || !categoryId) { // Check if IDs are valid numbers
                console.error(`Cannot mark short Q:${questionId} as complete. Missing/invalid category/topic info.`);
                return;
             }

             console.log(`Content shorter than container for ${questionId}, marking complete.`);
             markQuestionAsCompleted(questionId, topicId, categoryId).then((success: boolean) => { 
               if (success) {
                 setCompletedQuestions(prev => ({ ...prev, [questionId]: true }));
                  // Update localStorage
                  try {
                    const storedCompleted = JSON.parse(localStorage.getItem('completedQuestions') || '[]');
                    if (!storedCompleted.includes(questionId)) {
                      storedCompleted.push(questionId);
                      localStorage.setItem('completedQuestions', JSON.stringify(storedCompleted));
                    }
                  } catch (e) { console.error('LS update error', e); }
                 // Dispatch event
                 window.dispatchEvent(new CustomEvent('questionCompleted', { detail: { questionId } }));
               }
             });
           }
        } else {
          const scrollPosition = answerElement.scrollTop;
          percentage = Math.min(Math.round((scrollPosition / totalHeight) * 100), 100);
        }
        
        setScrollProgress(prev => ({ ...prev, [questionId]: percentage }));

        // Mark as completed if scrolled >= 90%
        if (percentage >= 90 && !completedQuestions[questionId]) {
          // Find the full question object to get category/topic IDs
          const question = questions.find(q => q.id === questionId);
          const topicId = question?.categories?.topic_id;
          const categoryId = question?.category_id;

          if (!topicId || !categoryId) { // Check if IDs are valid numbers
            console.error(`Cannot mark Q:${questionId} as complete. Missing/invalid category/topic info.`);
            return; 
          }
          
          console.log(`Scroll >= 90% for ${questionId}, marking complete.`);
          markQuestionAsCompleted(questionId, topicId, categoryId)
            .then((success: boolean) => { 
             if (success) {
               setCompletedQuestions(prev => ({ ...prev, [questionId]: true }));
                // Update localStorage
                try {
                  const storedCompleted = JSON.parse(localStorage.getItem('completedQuestions') || '[]');
                  if (!storedCompleted.includes(questionId)) {
                    storedCompleted.push(questionId);
                    localStorage.setItem('completedQuestions', JSON.stringify(storedCompleted));
                  }
                } catch (e) { console.error('LS update error', e); }
               // Dispatch event
               window.dispatchEvent(new CustomEvent('questionCompleted', { detail: { questionId } }));
             }
           });
        }
      };

      const handleScroll = () => {
        if (scrollTimeoutRef.current[questionId]) {
          clearTimeout(scrollTimeoutRef.current[questionId]!);
        }
        scrollTimeoutRef.current[questionId] = setTimeout(calculateScrollProgress, 100);
      };
      
      // Initial check
       const initialTimer = setTimeout(calculateScrollProgress, 500); 

      answerElement.addEventListener('scroll', handleScroll);
      console.log(`Added scroll listener for question ${questionId}`);

      // Return cleanup function for this specific questionId
      return () => {
        if (answerElement) {
          answerElement.removeEventListener('scroll', handleScroll);
        }
        if (scrollTimeoutRef.current[questionId]) {
          clearTimeout(scrollTimeoutRef.current[questionId]!);
        }
         clearTimeout(initialTimer);
        console.log(`Removed scroll listener for question ${questionId}`);
      };
    });

    // Cleanup for questions that are no longer expanded but might still have listeners
    return () => {
       Object.keys(answerRefs.current).forEach(idStr => {
         const questionId = parseInt(idStr);
         if (!expandedQuestions[questionId]) { // If it's not expanded anymore
           const answerElement = answerRefs.current[questionId];
           if (answerElement) {
             // Attempt to remove listener just in case (though the inner return should handle it)
             // answerElement.removeEventListener('scroll', /* need the specific handleScroll instance */ );
           }
           if (scrollTimeoutRef.current[questionId]) {
             clearTimeout(scrollTimeoutRef.current[questionId]!);
           }
         }
       });
    };

  }, [expandedQuestions, questionAnswers, loadingAnswers, completedQuestions]); // Re-run when expansion, answers, loading, or completion changes

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
    
    // Use ReactMarkdown to render the markdown content
    return (
      <ReactMarkdown>{answerText}</ReactMarkdown>
    );
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
  
  // Helper function to get answer text, prioritizing fetched/generated answer
  const getAnswerText = (questionId: number) => {
    return questionAnswers[questionId] || null; // Return null if no specific answer fetched/generated
  };

  // If no questions are provided, show a message
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No questions found.</p>
      </div>
    );
  }
  
  // JSX rendering logic
  const renderQuestionItem = (question: QuestionType) => {
    const isExpanded = !!expandedQuestions[question.id];
    const answerText = getAnswerText(question.id);
    const isLoading = !!loadingAnswers[question.id];
    const isComplete = !!completedQuestions[question.id];
    const currentScrollProgress = scrollProgress[question.id] || 0;

    return (
      <div 
        key={question.id} 
        className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4 ${
          highlightedQuestionId === question.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
        }`}
        id={`question-${question.id}`}
      >
        {/* Question Header (clickable) */}
        <div 
          className="p-4 cursor-pointer flex justify-between items-start" 
          onClick={() => toggleQuestion(question.id)}
        >
          <div className="flex items-start flex-1 pr-4">
            {/* Completed Checkmark */}
            {isComplete ? (
              <div className="mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="mr-2 w-4 flex-shrink-0"></div> // Placeholder for alignment
            )}
            {/* Question Text */}
            <span className="font-medium text-gray-900 dark:text-white">
              {question.question_text}
            </span>
          </div>
          {/* Right side: Buttons and Arrow */}
          <div className="flex items-center space-x-2 flex-shrink-0"> {/* Adjusted classes */}
            {/* Bookmark Button */}
            {question.id && question.category_id && question.categories?.topic_id && ( // Add null checks
                 <div onClick={(e) => e.stopPropagation()}> {/* Added stopPropagation */}
                     <BookmarkButton
                       questionId={question.id}
                       topicId={question.categories.topic_id} // Pass topicId
                       categoryId={question.category_id}     // Pass categoryId
                     />
                 </div>
             )}
            {/* Difficulty Badge (Keep original content) */}
            {question.difficulty && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ 
                  question.difficulty === 'beginner' ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                  question.difficulty === 'intermediate' ? 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                  'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </span>
            )}
            {/* Expand/Collapse Icon (Keep original content) */}
            <div className="text-gray-400"> {/* Ensure icon is wrapped */} 
               <svg
                 xmlns="http://www.w3.org/2000/svg"
                 className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                 fill="none"
                 viewBox="0 0 24 24"
                 stroke="currentColor"
               >
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
             </div>
          </div>
        </div>

        {/* --- Add Resource List Here --- */}
        {isExpanded && question.id && (
          <div className="px-4 pt-3 pb-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
            <ResourceList questionId={question.id} />
          </div>
        )}
        
        {/* Expanded Answer Section */}
        {isExpanded && (
          <AnswerDisplay
            questionId={question.id}
            answerText={answerText}
            isLoading={isLoading}
            scrollProgress={currentScrollProgress}
            isCompleted={isComplete}
            setAnswerRef={(el) => (answerRefs.current[question.id] = el)}
          />
        )}
      </div>
    );
  };

  // Main return logic based on groupByCategory
  if (groupByCategory) {
    const questionsByCategory: QuestionsByCategory = {};
    questions.forEach(question => {
      const categoryId = String(question.category_id);
      const categoryName = question.categories?.name || `Category ${question.category_id}`;
      if (!questionsByCategory[categoryId]) {
        questionsByCategory[categoryId] = { categoryName, questions: [] };
      }
      questionsByCategory[categoryId].questions.push(question);
    });

    return (
      <div className="space-y-8 animate-fadeIn">
        {Object.entries(questionsByCategory).map(([categoryId, { categoryName, questions }]) => (
          <div key={categoryId}>
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">{categoryName}</h2>
            <div className="space-y-4">
              {questions.map(renderQuestionItem)}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    // Render flat list
    return (
      <div className="space-y-4 animate-fadeIn">
        {questions.map(renderQuestionItem)}
      </div>
    );
  }
}

// --- AnswerDisplay Sub-component ---
interface AnswerDisplayProps {
  questionId: number;
  answerText: string | null;
  isLoading: boolean;
  scrollProgress: number;
  isCompleted: boolean;
  setAnswerRef: (el: HTMLDivElement | null) => void;
}

function AnswerDisplay({ 
  questionId,
  answerText, 
  isLoading, 
  scrollProgress, 
  isCompleted,
  setAnswerRef 
}: AnswerDisplayProps) {
  return (
    <div className="mt-2 pt-4 border-t border-gray-200 dark:border-gray-700 px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-md">
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer:</h5>
      <div
        ref={setAnswerRef} // Use the callback ref
        className="text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none h-[600px] overflow-y-auto pr-2 text-base mb-4"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
            <span>Generating answer...</span>
          </div>
        ) : answerText ? (
          <ReactMarkdown>{answerText}</ReactMarkdown>
        ) : (
          <p className="italic text-gray-500">No answer available or failed to load.</p> // More generic message
        )}
      </div>

      {/* Progress indicator - only show if not loading and answer exists */}
      {!isLoading && answerText && (
        <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
           <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
             <span>Read progress</span>
             <span>{scrollProgress}%</span>
           </div>
           <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
             <div
               className="bg-green-500 h-1 rounded-full transition-all duration-300 ease-in-out"
               style={{ width: `${scrollProgress}%` }}
             ></div>
           </div>
           {scrollProgress >= 90 && (
             <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
               </svg>
               {isCompleted ? 'Marked as completed' : 'Almost done! Keep scrolling to mark as completed'}
             </div>
           )}
         </div>
       )}
    </div>
  );
} 