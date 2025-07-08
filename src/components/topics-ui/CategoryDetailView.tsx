'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { QuestionWithAnswer } from '@/components/questions';
import { ProgressBar, LoadingSpinner, Accordion } from '@/components/ui';
import { fetchCategoryProgress, fetchSubtopicProgress, isQuestionCompleted, isQuestionBookmarked } from '@/app/utils/progress';
import TopicCategoryGrid from './TopicCategoryGrid';
import FloatingSettings from './FloatingSettings';

// Imported shared types
import { QuestionType } from '@/types/topics';
import { SubtopicProgress, CategoryProgress } from '@/types/topic-page.types';

// Animation variants that don't use transforms
const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const }
  }
};

// Local type definition for DisplayItem (mimicking TopicCategoryGrid.tsx)
interface DisplayItem {
  id: string;
  label: string;
  progress?: {
    questionsCompleted: number;
    totalQuestions: number;
    completionPercentage: number;
  };
}

// Local types that remain (or are specific to this component's internal API handling)
// Type definitions for component-specific data structures or direct API response shapes
// not covered by shared types.
// Restoring TopicItem definition
type TopicItem = {
  id?: string;
  label: string;
  content?: string;
  questions?: QuestionType[];
  categoryId?: number;
  subtopicId?: number;
  subtopics?: Record<string, TopicItem>; // Allows for nested TopicItems
  isGenerated?: boolean;
};

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

// Types for API response structure specific to handleSubtopicSelect
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
  
  // Update type for subtopicsProgress to include category counts
  const [subtopicsProgress, setSubtopicsProgress] = useState<Record<string, SubtopicProgress>>({});
  
  const [completedQuestions, setCompletedQuestions] = useState<Record<number, boolean>>({});
  const [isSubtopicProgressLoading, ] = useState(false);
  
  // Local state to store bookmark status
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<number, boolean>>({});
  
  // TODO: PERSISTENT LINTER ERROR - The isBookmarked prop in QuestionWithAnswer components
  // is causing "Type 'boolean | undefined' is not assignable to type 'boolean'" errors
  // despite multiple attempts to fix with ??, !!, === true, etc. This may require:
  // 1. Reviewing QuestionWithAnswer component's prop types
  // 2. Checking if bookmarkStatus state initialization is correct
  // 3. Investigating if there's a TypeScript config issue with exactOptionalPropertyTypes
  
  // State for Accordion: stores the value (questionId.toString()) of the currently open item.
  const [openQuestionId, setOpenQuestionId] = useState<string | undefined>(
    highlightedQuestionId ? highlightedQuestionId.toString() : undefined
  );

  // Check if this is section/header or specific topic
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
      return questionsToFilter.filter((q: QuestionType) => q.difficulty === propSelectedDifficulty);
    }
    return questionsToFilter;
  }, [questionsToFilter, propSelectedDifficulty]);

  // Memoize the expensive questionsByCategory grouping operation
  const questionsByCategory = useMemo(() => {
    const grouped: Record<number, { name: string; questions: QuestionType[], topic_id: number; }> = {};
    
    if (memoizedFilteredQuestions.length > 0) {
      // Group questions by their category
      memoizedFilteredQuestions.forEach((question: QuestionType) => {
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
      .map(([id, subtopicData]) => {
        const subtopic = subtopicData as TopicItem; // Type assertion for subtopic
        const progress = subtopicsProgress[id];
        const item: DisplayItem = {
          id,
          label: subtopic.label,
        };
        if (progress) {
          item.progress = {
            questionsCompleted: progress.questionsCompleted,
            totalQuestions: progress.totalQuestions,
            completionPercentage: progress.completionPercentage,
          };
        }
        return item;
      });
  }, [categoryDetails?.subtopics, subtopicsProgress]);

  // Memoize check for grouped questions
  const hasGroupedQuestions = useMemo(() => {
    return Object.keys(questionsByCategory).length > 0;
  }, [questionsByCategory]);

  // Callback to handle bookmark status changes from individual QuestionWithAnswer components
  const handleBookmarkChangeFromQuestion = useCallback((
    questionId: number, 
    newStatus: boolean
    // topicId?: number, // topicId and categoryId are not strictly needed here if we only update bookmark icon
    // categoryIdFromQuestion?: number 
  ) => {
    setBookmarkStatus(prevStatus => ({
      ...prevStatus,
      [questionId]: newStatus,
    }));
  }, []);

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
      setSubtopicsProgress(prev => ({ ...prev, [selectedSubtopic || '']: currentSubtopicProgress }));
    }
  }, [selectedSubtopic, currentSubtopicProgress]);

  // Fetch bookmark status for each question
  const fetchBookmarkStatus = async (questions: QuestionType[]) => {
    const bookmarkStatus: Record<number, boolean> = {};
    await Promise.all(questions.map(async (question) => {
      bookmarkStatus[question.id] = await isQuestionBookmarked(question.id);
    }));
    return bookmarkStatus;
  };

  // Fetch progress data for category and subtopic
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProgressAndBookmarks = async () => {
      try {
        if (!selectedSubtopic) {
          // For categories, fetch their progress data
          if (categoryId && !categoryId.startsWith('header-')) {
            const numericId = parseInt(categoryId.replace(/^(topic-|category-)/, ''));
            if (!isNaN(numericId) && !categoryProgressData) { // Fetch only if not provided
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
            const progress = await fetchSubtopicProgress(numericId, true);
            if (!signal.aborted) {
              setSubtopicsProgress(prev => ({ ...prev, [selectedSubtopic]: progress }));
            }
          }
        }
        
        // Update completed questions tracking
        const questions = memoizedFilteredQuestions;
        const questionIds = questions.map(q => q.id);
        
        if (questionIds.length > 0) {
          try {
            const completedResults = await Promise.all(questionIds.map((id: number) => isQuestionCompleted(id)));
            
            if (!signal.aborted) {
              const newCompletedStatus: Record<number, boolean> = {};
              questionIds.forEach((id: number, index: number) => {
                newCompletedStatus[id] = completedResults[index] ?? false;
              });
              setCompletedQuestions(newCompletedStatus);
            }
          } catch {
            if (!signal.aborted) {
              setCompletedQuestions({}); // Fallback on error
            }
          }
        } else if (!signal.aborted) {
          setCompletedQuestions({});
        }

        // Fetch bookmark status for questions
        const newBookmarkStatus = await fetchBookmarkStatus(questions);
        if (!signal.aborted) {
          setBookmarkStatus(newBookmarkStatus);
        }

      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // console.error('Error in fetchProgressAndBookmarks:', error); // Example of logging if needed
        }
      }
    };

    fetchProgressAndBookmarks();

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
      
      // Fetch the subtopic details
      const topicNumericId = parseInt(topicId.replace('topic-', ''));
      if (isNaN(topicNumericId)) {
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
        
        setSubtopicDetails(formattedSubtopic);
        setSelectedSubtopic(topicId);
        setOpenQuestionId(undefined); // Close any previously open question
      } else {
        // console.error('Invalid subtopic data structure:', data); // Example of logging if needed
      }
    } catch { // This catch correctly has no 'error' parameter as it's unused.
      // console.error('Error fetching subtopic details:', error); // Example of logging if needed
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle back to category from subtopic
  const handleBackToCategory = useCallback(() => {
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
    setOpenQuestionId(undefined); // Close any open question when navigating
  }, []);

  // Handle difficulty selection from FloatingSettings
  const handleDifficultySelect = useCallback((difficulty: string) => {
    if (!onDifficultyChange) return;
    
    // If current difficulty is clicked again, clear the filter (toggle off)
    // Otherwise, set the new difficulty
    const newDifficulty = propSelectedDifficulty === difficulty ? null : difficulty;
    onDifficultyChange(newDifficulty);
  }, [propSelectedDifficulty, onDifficultyChange]);
  
  const handleCompletionChange = useCallback(async (
    questionId: number, 
    status: boolean,
    // Add topicId and categoryId of the question that changed
    _changedQuestionTopicId?: number, 
    _changedQuestionCategoryId?: number
  ) => {
    setCompletedQuestions(prev => ({ ...prev, [questionId]: status }));

    // After local state for the specific question is updated,
    // re-fetch the aggregate progress for the current view.
    if (selectedSubtopic && subtopicDetails) {
      const currentViewSubtopicId = subtopicDetails.subtopicId ?? parseInt(selectedSubtopic.replace('topic-', ''));
      if (!isNaN(currentViewSubtopicId)) {
        const progress = await fetchSubtopicProgress(currentViewSubtopicId, true); // forceRefresh = true
        setSubtopicsProgress(prev => ({ ...prev, [selectedSubtopic]: progress }));
      }
    } else if (!selectedSubtopic && categoryId && !categoryId.startsWith('header-')) {
      // We are in a "category-like" view. Re-fetch its progress.
      // The `categoryId` prop of CategoryDetailView defines this view.
      const numericViewId = parseInt(categoryId.replace(/^(topic-|category-)/, ''));
      if (!isNaN(numericViewId)) {
        // This assumes numericViewId is a valid category_id for fetchCategoryProgress
        const progress = await fetchCategoryProgress(numericViewId, true); // forceRefresh = true
        setCategoryProgress(progress);
      }
    }
  }, [
    selectedSubtopic, 
    subtopicDetails, 
    categoryId, 
    setCompletedQuestions, 
    setSubtopicsProgress, 
    setCategoryProgress
  ]);

  // Handler for Accordion's onValueChange
  const handleOpenQuestionChange = useCallback((value: string) => {
    setOpenQuestionId(value);
    // If a question is opened, update URL for shareability, but only if not clearing
    if (value) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('q', value); // q for question id
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    } else {
      // If accordion is closed (value is empty for single collapsible)
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('q');
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

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

  if (selectedSubtopic && isLoading) {
    return (
      <LoadingSpinner 
        size="lg" 
        color="primary" 
        text="Loading topic questions..." 
        centered={true}
      />
    )
  }

  // If a subtopic is selected, show its details
  if (selectedSubtopic && subtopicDetails) {
    return (
      <motion.div 
        className="p-4 pt-12 sm:pt-16 md:pt-20"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl dark:text-white">
            {subtopicDetails.label}
          </h1>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {subtopicDetails.questions && subtopicDetails.questions.length > 0 && onDifficultyChange && (
              <FloatingSettings
                selectedDifficulty={propSelectedDifficulty || null}
                onSelectDifficulty={handleDifficultySelect}
                className="mr-2"
              />
            )}
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
        </div>
        
        {/* When we have questions grouped by categories */}
        {hasGroupedQuestions ? (
          <Accordion 
            type="single" 
            collapsible 
            className="w-full space-y-2" // Added space-y-2 for spacing between items
            value={openQuestionId || ""}
            onValueChange={handleOpenQuestionChange}
          >
            {Object.entries(questionsByCategory).map(([catId, category]) => (
              <div key={catId} className="mb-12"> {/* Keep existing margin for category groups */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight md:text-2xl dark:text-white">{category.name}</h2>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                    {category.questions.filter(q => completedQuestions[q.id]).length}/{category.questions.length} completed
                  </span>
                </div>
                <div className="mb-6">
                  <ProgressBar
                    progress={(category.questions.filter(q => completedQuestions[q.id]).length / category.questions.length) * 100}
                    completed={category.questions.filter(q => completedQuestions[q.id]).length}
                    total={category.questions.length}
                    height="md"
                    showText={false}
                    className={category.name}
                  />
                </div>
                {/* Accordion items for questions within this category group */}
                {category.questions.map((question, _) => (
                  <QuestionWithAnswer 
                    key={question.id}
                    question={question}
                    topicId={question.categories?.topic_id ?? 0}
                    domain={domain} // Pass domain for optimization
                    onCompletionChange={handleCompletionChange}
                    isBookmarked={bookmarkStatus[question.id] ?? false}
                    onBookmarkStatusChange={handleBookmarkChangeFromQuestion}
                    isOpen={openQuestionId === question.id.toString()}
                    onRequestClose={() => handleOpenQuestionChange("")}
                  />
                ))}
              </div>
            ))}
          </Accordion>
        ) : memoizedFilteredQuestions.length > 0 ? (
          // Fallback to simple question list if no category info
          <div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl mb-6">Questions</h2>
            <Accordion 
              type="single" 
              collapsible 
              className="w-full space-y-2"
              value={openQuestionId || ""}
              onValueChange={handleOpenQuestionChange}
            >
              {memoizedFilteredQuestions.map((question, _) => (
                <QuestionWithAnswer 
                  key={question.id}
                  question={question}
                  topicId={subtopicDetails?.subtopicId ?? 0}
                  domain={domain} // Pass domain for optimization
                  onCompletionChange={handleCompletionChange}
                  isBookmarked={bookmarkStatus[question.id] ?? false}
                  onBookmarkStatusChange={handleBookmarkChangeFromQuestion}
                  isOpen={openQuestionId === question.id.toString()}
                  onRequestClose={() => handleOpenQuestionChange("")}
                />
              ))}
            </Accordion>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-300">
            <p>{propSelectedDifficulty ? `No ${propSelectedDifficulty} questions available.` : 'No questions available for this topic.'}</p>
          </div>
        )}
      </motion.div>
    );
  }
  
  // Render category details
  return (
    <motion.div 
      className="p-4 pt-12 sm:pt-16 md:pt-20"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      {/* Title and back button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl text-gray-900 dark:text-white">
          {categoryDetails?.label}
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {hasQuestions && onDifficultyChange && (
            <FloatingSettings
              selectedDifficulty={propSelectedDifficulty || null}
              onSelectDifficulty={handleDifficultySelect}
              className="mr-2"
            />
          )}
          <button
            onClick={handleBackToMainCategories}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* If the category has subtopics, show them */}
      {hasRealSubtopics && categoryDetails?.subtopics && (
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-light tracking-wide mb-4 text-gray-900 dark:text-white">Topics</h2>
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
              domain={domain || ""}
              isLoading={isSubtopicProgressLoading}
              showDomainTitle={false}
            />
          )}
        </div>
      )}
      
      {/* Show questions if available */}
      {hasQuestions && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2 sm:gap-0 text-gray-900 dark:text-white">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl">Questions</h2>
            {categoryProgress && (
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {categoryProgress.questionsCompleted}/{categoryProgress.totalQuestions} completed     
              </span>
            )}
          </div>
          
          {memoizedFilteredQuestions.length > 0 ? (
            <Accordion 
              type="single" 
              collapsible 
              className="w-full space-y-2" // Added for consistent spacing
              value={openQuestionId || ""}
              onValueChange={handleOpenQuestionChange}
            >
              {memoizedFilteredQuestions.map((question, _) => (
                <QuestionWithAnswer 
                  key={question.id}
                  question={question}
                  topicId={question.topic_id ?? 0}
                  domain={domain} // Pass domain for optimization
                  onCompletionChange={handleCompletionChange}
                  isBookmarked={bookmarkStatus[question.id] ?? false}
                  onBookmarkStatusChange={handleBookmarkChangeFromQuestion}
                  isOpen={openQuestionId === question.id.toString()}
                  onRequestClose={() => handleOpenQuestionChange("")}
                />  
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-300">
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
    </motion.div>
  );
} 