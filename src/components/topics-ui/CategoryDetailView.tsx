'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { QuestionWithAnswer } from '@/components/questions';
import ProgressBar from '../ui/ProgressBar';
import { fetchCategoryProgress, fetchSubtopicProgress, isQuestionCompleted } from '@/app/utils/progress';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TopicCategoryGrid from './TopicCategoryGrid';
import FloatingSettings from './FloatingSettings';

// Import types
interface QuestionType {
  id: number;
  question_text: string;
  answer_text?: string | null;
  keywords?: string[] | string | null;
  difficulty?: string | null;
  category_id?: number | null;
  topic_id?: number | null;
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

type TopicItem = {
  id?: string;
  label: string;
  content?: string;
  questions?: QuestionType[];
  categoryId?: number;
  subtopicId?: number;
  subtopics?: Record<string, TopicItem>;
  isGenerated?: boolean;
};

interface SubtopicProgress {
  completionPercentage: number;
  questionsCompleted: number;
  totalQuestions: number;
  categoriesCompleted: number;
  totalCategories: number;
}

interface CategoryProgress {
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
}

interface CategoryDetailViewProps {
  categoryId: string;
  categoryDetails: TopicItem | null;
  highlightedQuestionId?: number;
  selectedDifficulty?: string | null;
  onDifficultyChange?: (difficulty: string | null) => void;
  domain?: string;
  onBackToMainCategories?: () => void;
  subtopicProgressData?: Record<string, SubtopicProgress>;
  categoryProgressData?: CategoryProgress | null;
  currentSubtopicProgress?: SubtopicProgress | null;
}

// Add these types for API response
interface CategoryResponse {
  id: number;
  topic_id: number;
  name: string;
  description?: string;
  created_at: string;
  questions?: QuestionType[];
}

interface TopicResponse {
  topic: {
    id: number;
    name: string;
    section_name: string;
    created_at: string;
    domain: string;
    description?: string;
  };
  categories: CategoryResponse[];
}

export default function CategoryDetailView({
  categoryId,
  categoryDetails,
  highlightedQuestionId,
  selectedDifficulty: propSelectedDifficulty,
  onDifficultyChange,
  domain,
  onBackToMainCategories,
  subtopicProgressData: passedInSubtopicProgress,
  categoryProgressData,
  currentSubtopicProgress
}: CategoryDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Local state for UI elements
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [subtopicDetails, setSubtopicDetails] = useState<TopicItem | null>(null);
  
  // Progress tracking states
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress | null>(null);
  
  const [subtopicProgress, setSubtopicProgress] = useState<SubtopicProgress | null>(null);
  
  // Update type for subtopicsProgress to include category counts
  const [subtopicsProgress, setSubtopicsProgress] = useState<Record<string, SubtopicProgress>>({});
  
  const [completedQuestions, setCompletedQuestions] = useState<Record<number, boolean>>({});
  const [isSubtopicProgressLoading, setIsSubtopicProgressLoading] = useState(false);
  
  // Check if this is section/header or specific topic
  const isSectionHeader = categoryId.startsWith('header-');
  const hasSubtopics = categoryDetails?.subtopics && Object.keys(categoryDetails.subtopics).length > 0;
  const hasRealSubtopics = hasSubtopics && Object.keys(categoryDetails?.subtopics || {}).some(id => id.startsWith('topic-'));
  const hasQuestions = categoryDetails?.questions && categoryDetails.questions.length > 0;

  // Memoize expensive calculations
  
  // Memoize the questions to filter based on selected subtopic
  const questionsToFilter = useMemo(() => {
    return selectedSubtopic && subtopicDetails?.questions 
      ? subtopicDetails.questions 
      : categoryDetails?.questions || [];
  }, [selectedSubtopic, subtopicDetails?.questions, categoryDetails?.questions]);

  // Memoize the filtered questions calculation
  const memoizedFilteredQuestions = useMemo(() => {
    if (!questionsToFilter || questionsToFilter.length === 0) return [];
    
    if (propSelectedDifficulty) {
      return questionsToFilter.filter(q => q.difficulty === propSelectedDifficulty);
    }
    return questionsToFilter;
  }, [questionsToFilter, propSelectedDifficulty]);

  // Available difficulty levels - memoized since it's static
  const difficulties = useMemo(() => [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ], []);

  // Memoize the expensive questionsByCategory grouping operation
  const questionsByCategory = useMemo(() => {
    const grouped: Record<number, { name: string; questions: QuestionType[], topic_id: number; }> = {};
    
    if (memoizedFilteredQuestions.length > 0) {
      // Group questions by their category
      memoizedFilteredQuestions.forEach(question => {
        if (question.categories) {
          const categoryId = question.categories.id;
          if (!grouped[categoryId]) {
            grouped[categoryId] = { 
              name: question.categories.name, 
              questions: [],
              topic_id: question.categories.topic_id
            };
          }
          grouped[categoryId].questions.push(question);
        }
      });
    }
    
    return grouped;
  }, [memoizedFilteredQuestions]);

  // Memoize data for the subtopic grid
  const subtopicItemsForGrid = useMemo(() => {
    if (!categoryDetails?.subtopics) {
      return [];
    }
    
    return Object.entries(categoryDetails.subtopics)
      .filter(([id]) => id.startsWith('topic-'))
      .map(([id, subtopic]) => {
        const progress = subtopicsProgress[id];
        return {
          id,
          label: subtopic.label,
          progress: progress ? {
            questionsCompleted: progress.questionsCompleted,
            totalQuestions: progress.totalQuestions,
            completionPercentage: progress.completionPercentage,
          } : undefined, // Let TopicCategoryGrid fetch if not provided
        };
      });
  }, [categoryDetails?.subtopics, subtopicsProgress]);

  // Memoize check for grouped questions
  const hasGroupedQuestions = useMemo(() => {
    return Object.keys(questionsByCategory).length > 0;
  }, [questionsByCategory]);

  // Update filtered questions when calculation changes
  useEffect(() => {
    if (passedInSubtopicProgress) {
      setSubtopicsProgress(passedInSubtopicProgress);
    }
  }, [passedInSubtopicProgress]);

  useEffect(() => {
    if (categoryProgressData) {
      setCategoryProgress(categoryProgressData);
    }
  }, [categoryProgressData]);

  useEffect(() => {
    if (currentSubtopicProgress) {
      setSubtopicProgress(currentSubtopicProgress);
    }
  }, [currentSubtopicProgress]);

  // Handle question completion events for optimistic updates
  useEffect(() => {
    const handleQuestionCompleted = (event: CustomEvent) => {
      const { questionId } = event.detail;
      setCompletedQuestions(prev => ({ ...prev, [questionId]: true }));
    };

    const handleQuestionCompletionFailed = (event: CustomEvent) => {
      const { questionId } = event.detail;
      setCompletedQuestions(prev => ({ ...prev, [questionId]: false }));
    };

    window.addEventListener('questionCompleted', handleQuestionCompleted as EventListener);
    window.addEventListener('questionCompletionFailed', handleQuestionCompletionFailed as EventListener);

    return () => {
      window.removeEventListener('questionCompleted', handleQuestionCompleted as EventListener);
      window.removeEventListener('questionCompletionFailed', handleQuestionCompletionFailed as EventListener);
    };
  }, []);

  // Fetch progress data for category and subtopic
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProgress = async () => {
      try {
        if (!selectedSubtopic) {
          // For categories, fetch their progress data
          if (categoryId && !categoryId.startsWith('header-')) {
            const numericId = parseInt(categoryId.replace('topic-', ''));
            if (!isNaN(numericId) && !categoryProgressData) { // Fetch only if not provided
              console.log(`Fetching progress for category ID: ${numericId}`);
              const progress = await fetchCategoryProgress(numericId, true);
              if (!signal.aborted) {
                setCategoryProgress(progress);
              }
            }
          }
        }
        
        // For subtopics, fetch their progress
        if (selectedSubtopic) {
          const numericId = parseInt(selectedSubtopic.replace('topic-', ''));
          if (!isNaN(numericId) && !currentSubtopicProgress) { // Fetch only if not provided
            console.log(`Fetching progress for subtopic ID: ${numericId}`);
            const progress = await fetchSubtopicProgress(numericId, true);
            if (!signal.aborted) {
              setSubtopicProgress(progress);
            }
          }
        }
        
        // Update completed questions tracking
        const questions = memoizedFilteredQuestions;
        
        // Check each question's completion status
        const completionStatus: Record<number, boolean> = {};
        const questionIds = questions.map(q => q.id);
        
        if (questionIds.length > 0) {
          // Batch check question completion status
          const completedResults = await Promise.all(questionIds.map(id => isQuestionCompleted(id)));
          if (!signal.aborted) {
            questionIds.forEach((id, index) => {
              completionStatus[id] = completedResults[index];
            });
            setCompletedQuestions(completionStatus);
          }
        } else if (!signal.aborted) {
          setCompletedQuestions({});
        }

      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error fetching progress:', error);
        }
      }
    };

    fetchProgress();

    return () => {
      controller.abort();
    };
  }, [categoryId, selectedSubtopic, memoizedFilteredQuestions, categoryProgressData, currentSubtopicProgress]);

  // Handle back button click - use parent handler if provided, otherwise fallback to URL manipulation
  const handleBackToMainCategories = useCallback(() => {
    if (onBackToMainCategories) {
      // Use the parent's handler which properly resets state
      onBackToMainCategories();
    } else {
      // Fallback to URL manipulation (original implementation)
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('category');
      searchParams.delete('q'); // Clear question ID when going back
      const newUrl = `${pathname}?${searchParams.toString()}`;
      router.push(newUrl);
    }
  }, [onBackToMainCategories, pathname, router]);

  // Handle subtopic selection
  const handleSubtopicSelect = useCallback(async (topicId: string) => {
    try {
      setIsLoading(true);
      console.log(`Fetching details for subtopic: ${topicId}`);
      
      // Fetch the subtopic details
      const topicNumericId = parseInt(topicId.replace('topic-', ''));
      if (isNaN(topicNumericId)) {
        console.error('Invalid topic ID format:', topicId);
        setIsLoading(false);
        return;
      }
      
      // Use 'topicId' parameter as expected by the API endpoint
      const response = await fetch(`/api/topics/topic-details?topicId=${topicNumericId}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch subtopic details: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const data: TopicResponse = await response.json();
      console.log('API Response for subtopic:', data);
      
      // Format the response into the expected TopicItem structure
      if (data && data.topic) {
        const formattedSubtopic: TopicItem = {
          id: topicId,
          label: data.topic.name,
          content: data.topic.description || '', // Use description as content
          questions: data.categories && data.categories.length > 0 
            ? data.categories.flatMap(cat => (cat.questions || []).map(q => ({
                ...q,
                categories: {
                  id: cat.id,
                  name: cat.name,
                  topic_id: cat.topic_id
                }
              })))
            : [],
          subtopicId: data.topic.id
        };
        
        console.log('Formatted subtopic data:', formattedSubtopic);
        setSubtopicDetails(formattedSubtopic);
        setSelectedSubtopic(topicId);
      } else {
        console.error('Invalid subtopic data structure:', data);
      }
    } catch (error) {
      console.error('Error fetching subtopic details:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle back to category from subtopic
  const handleBackToCategory = useCallback(() => {
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
  }, []);

  // Handle difficulty selection from FloatingSettings
  const handleDifficultySelect = useCallback((difficulty: string) => {
    if (!onDifficultyChange) return;
    
    // If current difficulty is clicked again, clear the filter (toggle off)
    // Otherwise, set the new difficulty
    const newDifficulty = propSelectedDifficulty === difficulty ? null : difficulty;
    onDifficultyChange(newDifficulty);
  }, [propSelectedDifficulty, onDifficultyChange]);
  
  if (isLoading && !categoryDetails) {
    return (
      <LoadingSpinner 
        size="lg" 
        color="primary" 
        text="Loading content..." 
        centered={true}
      />
    );
  }

  // If a subtopic is selected, show its details
  if (selectedSubtopic && subtopicDetails) {
    return (
      <div className="p-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">
            {subtopicDetails.label}
          </h1>
          <button
            onClick={handleBackToCategory}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={`Back to ${categoryDetails?.label || 'Category'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
        
        {/* Floating Settings for difficulty filter */}
        {subtopicDetails.questions && subtopicDetails.questions.length > 0 && onDifficultyChange && (
          <FloatingSettings
            selectedDifficulty={propSelectedDifficulty}
            onSelectDifficulty={handleDifficultySelect}
          />
        )}

        {/* When we have questions grouped by categories */}
        {hasGroupedQuestions ? (
          <div>
            {Object.entries(questionsByCategory).map(([categoryId, category]) => (
              <div key={categoryId} className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-light tracking-wide">{category.name}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {category.questions.filter(q => completedQuestions[q.id]).length}/{category.questions.length} completed
                  </span>
                </div>
                <div className="mb-4">
                  <ProgressBar
                    progress={(category.questions.filter(q => completedQuestions[q.id]).length / category.questions.length) * 100}
                    completed={category.questions.filter(q => completedQuestions[q.id]).length}
                    total={category.questions.length}
                    height="md"
                    showText={false}
                    className={category.name}
                  />
                </div>
                {category.questions.map((question, index) => (
                  <QuestionWithAnswer 
                    key={question.id}
                    question={question}
                    questionIndex={index}
                    isHighlighted={highlightedQuestionId === question.id}
                    topicId={category.topic_id}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : memoizedFilteredQuestions.length > 0 ? (
          // Fallback to simple question list if no category info
          <div>
            <h2 className="text-2xl font-light tracking-wide mb-4">Questions</h2>
            {memoizedFilteredQuestions.map((question, index) => (
              <QuestionWithAnswer 
                key={question.id}
                question={question}
                questionIndex={index}
                isHighlighted={highlightedQuestionId === question.id}
                topicId={subtopicDetails?.subtopicId ?? undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>{propSelectedDifficulty ? `No ${propSelectedDifficulty} questions available.` : 'No questions available for this topic.'}</p>
          </div>
        )}
      </div>
    );
  }
  
  // Render category details
  return (
    <div className="p-4 animate-fadeIn">
      {/* Title and back button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">
          {categoryDetails?.label}
        </h1>
        <button
          onClick={handleBackToMainCategories}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={`Back to ${domain}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>
      
      {/* If the category has subtopics, show them */}
      {hasRealSubtopics && categoryDetails?.subtopics && (
        <div className="mb-8">
          <h2 className="text-2xl font-light tracking-wide mb-4">Topics</h2>
          {isSubtopicProgressLoading ? (
            // Loading indicator
            <LoadingSpinner 
              size="md" 
              color="secondary" 
              text="Loading topic progress..." 
              centered={true}
            />
          ) : (
            // Card-based grid layout for subtopics
            <TopicCategoryGrid
              items={subtopicItemsForGrid}
              level="topic"
              onSelectItem={handleSubtopicSelect}
              domain={domain}
              isLoading={isSubtopicProgressLoading}
            />
          )}
        </div>
      )}
      
      {/* Show difficulty filter if we have questions */}
      {hasQuestions && renderDifficultyFilter()}
      
      {/* Show questions if available */}
      {hasQuestions && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-light tracking-wide">Questions</h2>
            {categoryProgress && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {categoryProgress.questionsCompleted}/{categoryProgress.totalQuestions} completed
              </span>
            )}
          </div>
          
          {memoizedFilteredQuestions.length > 0 ? (
            <div>
              {memoizedFilteredQuestions.map((question, index) => (
                <QuestionWithAnswer 
                  key={question.id}
                  question={question}
                  questionIndex={index}
                  isHighlighted={highlightedQuestionId === question.id}
                  topicId={question.topic_id ?? undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>{propSelectedDifficulty ? `No ${propSelectedDifficulty} questions available.` : 'No questions available for this category.'}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Show a message if no content is available */}
      {!hasRealSubtopics && !hasQuestions && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No content available for this category.</p>
        </div>
      )}
    </div>
  );
} 