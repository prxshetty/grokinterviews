'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { QuestionWithAnswer } from '@/components/questions';
import { LoadingSpinner, Accordion, ProgressBar } from '@/components/ui';
import { questionCache } from '@/utils/questionCache';
import TopicCategoryGrid from './TopicCategoryGrid';
import FloatingSettings from './FloatingSettings';

// Imported shared types
import { QuestionType } from '@/types/topics';
// Removed progress-related type imports

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
  // Removed progress-related props
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
  // Removed progress-related props
}: CategoryDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Local state for UI elements
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize subtopic state from URL parameters
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(() => {
    return searchParams.get('subtopic') || null;
  });
  const [subtopicDetails, setSubtopicDetails] = useState<TopicItem | null>(null);
  
  // Removed progress-related state variables
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

  // Track if we should allow scroll effects to prevent interference with manual accordion operations
  const [allowScrollEffect, setAllowScrollEffect] = useState(true);
  
  // Track which question ID we've already handled from URL to prevent re-opening
  const [handledQuestionId, setHandledQuestionId] = useState<number | null>(null);

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
        const item: DisplayItem = {
          id,
          label: subtopic.label,
        };
        // Removed progress property
        return item;
      });
  }, [categoryDetails?.subtopics]);

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

  // Removed progress-related useEffect hooks

  // Fetch bookmark status for each question (progress tracking disabled)
  const fetchBookmarkStatus = async (questions: QuestionType[]) => {
    const bookmarkStatus: Record<number, boolean> = {};
    // Progress tracking disabled - return empty bookmark status
    questions.forEach((question) => {
      bookmarkStatus[question.id] = false;
    });
    return bookmarkStatus;
  };

  // Fetch progress data for category and subtopic
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProgressAndBookmarks = async () => {
      try {
        // Removed progress fetching logic
        
        // Update completed questions tracking from cache
        const questions = memoizedFilteredQuestions;
        const questionIds = questions.map(q => q.id);
        
        if (questionIds.length > 0) {
          try {
            // Get completion status from cache
            const completedResults = questionIds.map(id => questionCache.isQuestionCompleted(id));
            
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
  }, [categoryId, selectedSubtopic, memoizedFilteredQuestions]);

  // Separate function for loading subtopic details without URL updates
  const loadSubtopicDetails = useCallback(async (topicId: string) => {
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

  // Load subtopic details when selectedSubtopic changes (from URL or state)
  useEffect(() => {
    if (selectedSubtopic && !subtopicDetails) {
      loadSubtopicDetails(selectedSubtopic);
    }
  }, [selectedSubtopic, subtopicDetails, loadSubtopicDetails]);

  // Auto-scroll to question or category section when question is highlighted from URL
  useEffect(() => {
    // Only attempt scroll when we have data loaded and a highlighted question
    // Also check if scroll effects are allowed and we haven't already handled this question ID
    if (highlightedQuestionId && 
        (memoizedFilteredQuestions.length > 0 || (hasGroupedQuestions && Object.keys(questionsByCategory).length > 0)) &&
        allowScrollEffect &&
        handledQuestionId !== highlightedQuestionId) {
      
      const performStagedScroll = () => {
        // Stage 1: Find the scroll target (question or category section)
        let scrollTarget = null;
        let isQuestionElement = false;
        
        // Try to find the question element first
        const possibleQuestionSelectors = [
          `[data-value="${highlightedQuestionId}"]`,
          `[value="${highlightedQuestionId}"]`,
          `#question-${highlightedQuestionId}`,
          `[data-question-id="${highlightedQuestionId}"]`
        ];
        
        for (const selector of possibleQuestionSelectors) {
          scrollTarget = document.querySelector(selector);
          if (scrollTarget) {
            isQuestionElement = true;
            break;
          }
        }
        
        // Fallback: find category section
        if (!scrollTarget && hasGroupedQuestions && Object.keys(questionsByCategory).length > 0) {
          const categoryIdFromUrl = searchParams.get('categoryId');
          
          const targetCategoryId = categoryIdFromUrl || 
            Object.entries(questionsByCategory).find(([_, category]) =>
              category.questions.some(q => q.id === highlightedQuestionId)
            )?.[0];
          
          if (targetCategoryId) {
            scrollTarget = document.getElementById(`category-${targetCategoryId}`);
          }
        }
        
        if (scrollTarget) {
          // Stage 1: Scroll to position the element optimally in viewport
          const navHeight = 64; // pt-16 = 64px from MainNavigation
          const additionalOffset = 20; // Extra spacing for better visual positioning
          
          const elementRect = scrollTarget.getBoundingClientRect();
          
          // For question elements, position the question trigger (header) at the top
          // For category sections, position at the top with some padding
          let scrollPosition;
          
          if (isQuestionElement) {
            // Position question header at the top of viewport (just below nav)
            scrollPosition = window.scrollY + elementRect.top - navHeight - additionalOffset;
          } else {
            // For category sections, ensure they're well-positioned at top
            scrollPosition = window.scrollY + elementRect.top - navHeight - additionalOffset;
          }
          
          // Ensure we don't scroll past the beginning of the page
          scrollPosition = Math.max(0, scrollPosition);
          
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
          
          // Stage 2: After scroll completes and 0.5s delay, open the accordion
          setTimeout(() => {
            setOpenQuestionId(highlightedQuestionId.toString());
            
            // Mark this question ID as handled to prevent re-opening
            setHandledQuestionId(highlightedQuestionId);
            
            // Stage 3: After opening, fine-tune the scroll position if needed
            // This handles the case where opening changes the layout significantly
            setTimeout(() => {
              const updatedElement = isQuestionElement 
                ? document.querySelector(`[data-value="${highlightedQuestionId}"]`)
                : document.getElementById(`category-${searchParams.get('categoryId') || ''}`);
                
              if (updatedElement) {
                const updatedRect = updatedElement.getBoundingClientRect();
                // Only adjust if the element moved significantly out of view
                if (updatedRect.top < navHeight || updatedRect.top > navHeight + 100) {
                  const adjustedPosition = window.scrollY + updatedRect.top - navHeight - additionalOffset;
                  window.scrollTo({
                    top: Math.max(0, adjustedPosition),
                    behavior: 'smooth'
                  });
                }
              }
            }, 300); // Allow accordion animation to complete
          }, 500);
        }
      };

      // Try immediately first
      performStagedScroll();
      
      // Retry after delay to handle async rendering
      setTimeout(performStagedScroll, 800);
    }
  }, [highlightedQuestionId, hasGroupedQuestions, questionsByCategory, searchParams, memoizedFilteredQuestions, allowScrollEffect, handledQuestionId]);

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
    // Update URL first
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('subtopic', topicId);
    newSearchParams.delete('q'); // Clear question ID when selecting subtopic
    router.push(`${pathname}?${newSearchParams.toString()}`);
    
    // Update state and load details
    setSelectedSubtopic(topicId);
    await loadSubtopicDetails(topicId);
  }, [searchParams, router, pathname, loadSubtopicDetails]);

  // Handle back to category from subtopic
  const handleBackToCategory = useCallback(() => {
    // Update URL first
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('subtopic');
    newSearchParams.delete('q'); // Clear question ID when going back
    router.push(`${pathname}?${newSearchParams.toString()}`);
    
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
    setOpenQuestionId(undefined); // Close any open question when navigating
  }, [searchParams, router, pathname]);

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

    // No need for database delays since we're using local cache
    // Progress is automatically updated via the cache service
  }, [
    selectedSubtopic, 
    subtopicDetails, 
    categoryId, 
    setCompletedQuestions
  ]);

  // Handler for Accordion's onValueChange
  const handleOpenQuestionChange = useCallback((value: string) => {
    setOpenQuestionId(value);
    
    // Temporarily disable scroll effects to prevent interference
    setAllowScrollEffect(false);
    setTimeout(() => setAllowScrollEffect(true), 1000);
    
    // If a question is opened, update URL for shareability, but only if not clearing
    if (value) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('q', value); // q for question id
      
      // Find the category ID for this question and add it to URL
      const questionId = parseInt(value);
      if (questionId && hasGroupedQuestions) {
        const categoryEntry = Object.entries(questionsByCategory).find(([_, category]) =>
          category.questions.some(q => q.id === questionId)
        );
        if (categoryEntry) {
          const [catId] = categoryEntry;
          newSearchParams.set('categoryId', catId);
        }
      }
      
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    } else {
      // If accordion is closed (value is empty for single collapsible)
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('q');
      newSearchParams.delete('categoryId');
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname, hasGroupedQuestions, questionsByCategory]);

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
        className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-x-hidden min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          {/* Back button + Title */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleBackToCategory}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title={`Back to ${categoryDetails?.label || 'Category'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl dark:text-white">
              {subtopicDetails.label}
            </h1>
          </div>
          {/* FloatingSettings */}
          <div className="flex items-center gap-2">
            {subtopicDetails.questions && subtopicDetails.questions.length > 0 && onDifficultyChange && (
              <FloatingSettings
                selectedDifficulty={propSelectedDifficulty || null}
                onSelectDifficulty={handleDifficultySelect}
              />
            )}
          </div>
        </div>
        
        {/* When we have questions grouped by categories */}
        {hasGroupedQuestions ? (
          <Accordion 
            type="single" 
            collapsible 
            className="w-full space-y-1"
            value={openQuestionId || ""}
            onValueChange={handleOpenQuestionChange}
          >
            {Object.entries(questionsByCategory).map(([catId, category], index) => (
              <div key={catId} id={`category-${catId}`} className="mb-8">
                <div className="flex flex-row justify-between items-center mb-3 gap-2">
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight md:text-2xl dark:text-white truncate flex-1 min-w-0">{category.name}</h2>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                      {category.questions.filter(q => completedQuestions[q.id]).length}/{category.questions.length} completed
                    </span>
                    {/* Mobile FloatingSettings - only show on first category */}
                    {index === 0 && subtopicDetails.questions && subtopicDetails.questions.length > 0 && onDifficultyChange && (
                      <div className="sm:hidden">
                        <FloatingSettings
                          selectedDifficulty={propSelectedDifficulty || null}
                          onSelectDifficulty={handleDifficultySelect}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* Progress bar with transparent background and stretched container */}
                <div className="w-full mb-4">
                  <ProgressBar
                    progress={(category.questions.filter(q => completedQuestions[q.id]).length / category.questions.length) * 100}
                    total={category.questions.length}
                    completed={category.questions.filter(q => completedQuestions[q.id]).length}
                    showText={false}
                    height="sm"
                    className="bg-transparent"
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
          <div className="pt-12 sm:pt-16 md:pt-20 lg:pt-16 xl:pt-20">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl lg:text-4xl xl:text-5xl mb-6">Questions</h2>
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
      className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-x-hidden min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-4 pt-12 sm:pt-16 md:pt-20"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      {/* Title and back button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
        {/* Back button + Title */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleBackToMainCategories}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl text-gray-900 dark:text-white">
            {categoryDetails?.label}
          </h1>
        </div>
        {/* FloatingSettings */}
        <div className="flex items-center gap-2">
          {hasQuestions && onDifficultyChange && (
            <FloatingSettings
              selectedDifficulty={propSelectedDifficulty || null}
              onSelectDifficulty={handleDifficultySelect}
            />
          )}
        </div>
      </div>
      
      {/* If the category has subtopics, show them */}
      {hasRealSubtopics && categoryDetails?.subtopics && (
        <div className="mb-6">
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
              compact={true}
            />
          )}
        </div>
      )}
      
      {/* Show questions if available */}
      {hasQuestions && (
        <div className="mt-6 pt-12 sm:pt-16 md:pt-20 lg:pt-16 xl:pt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 text-gray-900 dark:text-white">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl lg:text-4xl xl:text-5xl">Questions</h2>
            <div className="flex items-center justify-end gap-3 w-full">
              {/* Removed category progress display */}
              {/* Mobile FloatingSettings */}
              {hasQuestions && onDifficultyChange && (
                <div className="sm:hidden ml-auto">
                  <FloatingSettings
                    selectedDifficulty={propSelectedDifficulty || null}
                    onSelectDifficulty={handleDifficultySelect}
                  />
                </div>
              )}
            </div>
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-300">
              <p>{propSelectedDifficulty ? `No ${propSelectedDifficulty} questions available.` : 'No questions available for this category.'}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Show a message if no content is available */}
      {!hasRealSubtopics && !hasQuestions && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No content available for this category.</p>
        </div>
      )}
    </motion.div>
  );
}