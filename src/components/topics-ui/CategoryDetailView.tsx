'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { QuestionWithAnswer } from '@/components/questions';
import { LoadingSpinner, Accordion, ProgressBar } from '@/components/ui';
import { TurnstileComponent } from '@/components/ui/turnstile';
import { questionCache } from '@/utils/questionCache';
import { useAuth } from '@/hooks/auth';
import TopicCategoryGrid from './TopicCategoryGrid';
import FloatingSettings from './FloatingSettings';

// Imported shared types
import { QuestionType, TopicItem, DisplayItem, TopicResponse } from '@/types/topics';

// Animation variants that don't use transforms
const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const }
  }
};

interface CategoryDetailViewProps {
  categoryId: string;
  categoryDetails: TopicItem | null;
  highlightedQuestionId?: number;
  domain?: string;
  onBackToMainCategories?: () => void;
}

export default function CategoryDetailView({
  categoryId,
  categoryDetails,
  highlightedQuestionId,
  domain,
  onBackToMainCategories,
}: CategoryDetailViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Set user ID on questionCache when user changes
  useEffect(() => {
    questionCache.setUserId(user?.id);
  }, [user?.id]);
  
  // Local state for UI elements
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize subtopic state from URL parameters
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(() => {
    return searchParams.get('subtopic') || null;
  });
  const [subtopicDetails, setSubtopicDetails] = useState<TopicItem | null>(null);
  
  const [completedQuestions, setCompletedQuestions] = useState<Record<number, boolean>>({});
  const [isSubtopicProgressLoading, ] = useState(false);
  
  // Local state to store bookmark status
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<number, boolean>>({});

  // Turnstile verification state
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // Local state for difficulty to handle filtering entirely on the client
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(() => searchParams.get('difficulty'));
  
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

  // Memoize the filtered questions calculation using local state
  const memoizedFilteredQuestions = useMemo(() => {
    if (!questionsToFilter || questionsToFilter.length === 0) return [];
    
    if (selectedDifficulty) {
      return questionsToFilter.filter((q: QuestionType) => q.difficulty === selectedDifficulty);
    }
    return questionsToFilter;
  }, [questionsToFilter, selectedDifficulty]);

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
  ) => {
    setBookmarkStatus(prevStatus => ({
      ...prevStatus,
      [questionId]: newStatus,
    }));
  }, []);

  // Fetch bookmark status for each question (progress tracking disabled)
  const fetchBookmarkStatus = async (questions: QuestionType[]) => {
    const bookmarkStatus: Record<number, boolean> = {};
    // Initialize all questions as not bookmarked - let individual components handle their own state
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
        const questions = memoizedFilteredQuestions;
        const questionIds = questions.map(q => q.id);
        
        if (questionIds.length > 0) {
          try {
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

        const newBookmarkStatus = await fetchBookmarkStatus(questions);
        if (!signal.aborted) {
          setBookmarkStatus(newBookmarkStatus);
        }

      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // console.error('Error in fetchProgressAndBookmarks:', error);
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
      
      const topicNumericId = parseInt(topicId.replace('topic-', ''));
      if (isNaN(topicNumericId)) {
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`/api/topics/topic-details?topicId=${topicNumericId}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch subtopic details: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const data: TopicResponse = await response.json();
      
      if (data && data.topic) {
        const formattedSubtopic: TopicItem = {
          id: topicId,
          label: data.topic.name,
          content: data.topic.description || '',
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
        setOpenQuestionId(undefined);
      } else {
        // console.error('Invalid subtopic data structure:', data);
      }
    } catch { 
      // console.error('Error fetching subtopic details:', error);
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
    if (highlightedQuestionId && 
        (memoizedFilteredQuestions.length > 0 || (hasGroupedQuestions && Object.keys(questionsByCategory).length > 0)) &&
        allowScrollEffect &&
        handledQuestionId !== highlightedQuestionId) {
      
      const performStagedScroll = () => {
        let scrollTarget = null;
        let isQuestionElement = false;
        
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
          const navHeight = 64;
          const additionalOffset = 20;
          const elementRect = scrollTarget.getBoundingClientRect();
          let scrollPosition;
          
          if (isQuestionElement) {
            scrollPosition = window.scrollY + elementRect.top - navHeight - additionalOffset;
          } else {
            scrollPosition = window.scrollY + elementRect.top - navHeight - additionalOffset;
          }
          
          scrollPosition = Math.max(0, scrollPosition);
          
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
          
          setTimeout(() => {
            setOpenQuestionId(highlightedQuestionId.toString());
            setHandledQuestionId(highlightedQuestionId);
            
            setTimeout(() => {
              const updatedElement = isQuestionElement 
                ? document.querySelector(`[data-value="${highlightedQuestionId}"]`)
                : document.getElementById(`category-${searchParams.get('categoryId') || ''}`);
                
              if (updatedElement) {
                const updatedRect = updatedElement.getBoundingClientRect();
                if (updatedRect.top < navHeight || updatedRect.top > navHeight + 100) {
                  const adjustedPosition = window.scrollY + updatedRect.top - navHeight - additionalOffset;
                  window.scrollTo({
                    top: Math.max(0, adjustedPosition),
                    behavior: 'smooth'
                  });
                }
              }
            }, 300);
          }, 500);
        }
      };

      performStagedScroll();
      setTimeout(performStagedScroll, 800);
    }
  }, [highlightedQuestionId, hasGroupedQuestions, questionsByCategory, searchParams, memoizedFilteredQuestions, allowScrollEffect, handledQuestionId]);

  // Handle back button click - use parent handler if provided, otherwise fallback to URL manipulation
  const handleBackToMainCategories = useCallback(() => {
    if (onBackToMainCategories) {
      onBackToMainCategories();
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('category');
      searchParams.delete('q');
      const newUrl = `${pathname}?${searchParams.toString()}`;
      router.push(newUrl);
    }
  }, [onBackToMainCategories, pathname, router]);

  // Handle subtopic selection
  const handleSubtopicSelect = useCallback(async (topicId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('subtopic', topicId);
    newSearchParams.delete('q');
    router.push(`${pathname}?${newSearchParams.toString()}`);
    
    setSelectedSubtopic(topicId);
    await loadSubtopicDetails(topicId);
  }, [searchParams, router, pathname, loadSubtopicDetails]);

  // Handle back to category from subtopic
  const handleBackToCategory = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('subtopic');
    newSearchParams.delete('q');
    router.push(`${pathname}?${newSearchParams.toString()}`);
    
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
    setOpenQuestionId(undefined);
  }, [searchParams, router, pathname]);

  // Handle difficulty selection locally
  const handleDifficultySelect = useCallback((difficulty: string) => {
    const newDifficulty = selectedDifficulty === difficulty ? null : difficulty;
    setSelectedDifficulty(newDifficulty);

    // Update URL manually to keep it in sync, without triggering parent fetches
    const params = new URLSearchParams(searchParams.toString());
    if (newDifficulty) {
      params.set('difficulty', newDifficulty);
    } else {
      params.delete('difficulty');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedDifficulty, searchParams, pathname, router]);

  const handleClearDifficulty = useCallback(() => {
    setSelectedDifficulty(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('difficulty');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);
  
  const handleCompletionChange = useCallback(async (
    questionId: number, 
    status: boolean,
    _changedQuestionTopicId?: number, 
    _changedQuestionCategoryId?: number
  ) => {
    setCompletedQuestions(prev => ({ ...prev, [questionId]: status }));

    if (status && typeof window !== 'undefined' && window.invalidateStreakCache) {
      window.invalidateStreakCache();
    }
  }, [setCompletedQuestions]);

  // Handler for Accordion's onValueChange
  const handleOpenQuestionChange = useCallback((value: string) => {
    setOpenQuestionId(value);
    
    setAllowScrollEffect(false);
    setTimeout(() => setAllowScrollEffect(true), 1000);
    
    if (value) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('q', value);
      
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
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('q');
      newSearchParams.delete('categoryId');
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname, hasGroupedQuestions, questionsByCategory]);

  // Turnstile handlers
  const handleTurnstileVerify = useCallback((token: string) => {
    console.log('Turnstile verification successful:', token);
    setIsTurnstileVerified(true);
    setTurnstileError(null);
  }, []);

  const handleTurnstileError = useCallback((error: string) => {
    setIsTurnstileVerified(false);
    setTurnstileError(error);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setIsTurnstileVerified(false);
    setTurnstileError(null);
  }, []);

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
    );
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
            <h1 className="text-3xl sm:text-4xl font-editorial font-extralight tracking-tight md:text-5xl dark:text-white">
              {subtopicDetails.label}
            </h1>
          </div>
          {/* FloatingSettings */}
          <div className="flex items-center gap-2">
            {subtopicDetails.questions && subtopicDetails.questions.length > 0 && (
              <FloatingSettings
                selectedDifficulty={selectedDifficulty || null}
                onSelectDifficulty={handleDifficultySelect}
                onClear={handleClearDifficulty}
              />
            )}
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDifficulty}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {!isTurnstileVerified ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="text-center mb-6">
                </div>
                <TurnstileComponent
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  action="access-questions"
                  className="mb-4"
                />
                {turnstileError && (
                  <div className="text-red-600 dark:text-red-400 text-sm text-center">
                    Verification failed: {turnstileError}
                  </div>
                )}
              </div>
            ) : hasGroupedQuestions ? (
              <div className="no-select no-print">
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
                        <h2 className="text-2xl sm:text-3xl font-editorial font-extralight tracking-tight md:text-2xl dark:text-white truncate flex-1 min-w-0">{category.name}</h2>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                            {category.questions.filter(q => completedQuestions[q.id]).length}/{category.questions.length} completed
                          </span>
                          {/* Mobile FloatingSettings - only show on first category */}
                          {index === 0 && subtopicDetails.questions && subtopicDetails.questions.length > 0 && (
                            <div className="sm:hidden">
                              <FloatingSettings
                                selectedDifficulty={selectedDifficulty || null}
                                onSelectDifficulty={handleDifficultySelect}
                                onClear={handleClearDifficulty}
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
              </div>
            ) : memoizedFilteredQuestions.length > 0 ? (
              // Fallback to simple question list if no category info
              <div className="pt-12 sm:pt-16 md:pt-20 lg:pt-16 xl:pt-20 no-select no-print">
                <h2 className="text-3xl sm:text-4xl font-editorial font-extralight tracking-tight md:text-5xl lg:text-4xl xl:text-5xl mb-6">Questions</h2>
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
                <p>{selectedDifficulty ? `No ${selectedDifficulty} questions available.` : 'No questions available for this topic.'}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
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
          <h1 className="text-3xl sm:text-4xl font-editorial font-extralight tracking-tight md:text-5xl text-gray-900 dark:text-white">
            {categoryDetails?.label}
          </h1>
        </div>
        {/* FloatingSettings */}
        <div className="flex items-center gap-2">
          {hasQuestions && (
            <FloatingSettings
              selectedDifficulty={selectedDifficulty || null}
              onSelectDifficulty={handleDifficultySelect}
              onClear={handleClearDifficulty}
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
            <h2 className="text-3xl sm:text-4xl font-editorial font-extralight tracking-tight md:text-5xl lg:text-4xl xl:text-5xl">Questions</h2>
            <div className="flex items-center justify-end gap-3 w-full">
              {/* Removed category progress display */}
              {/* Mobile FloatingSettings */}
              {hasQuestions && (
                <div className="sm:hidden ml-auto">
                  <FloatingSettings
                    selectedDifficulty={selectedDifficulty || null}
                    onSelectDifficulty={handleDifficultySelect}
                    onClear={handleClearDifficulty}
                  />
                </div>
              )}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDifficulty}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {!isTurnstileVerified ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-center mb-6">
                  </div>
                  <TurnstileComponent
                    onVerify={handleTurnstileVerify}
                    onError={handleTurnstileError}
                    onExpire={handleTurnstileExpire}
                    action="access-questions"
                    className="mb-4"
                  />
                  {turnstileError && (
                    <div className="text-red-600 dark:text-red-400 text-sm text-center">
                      Verification failed: {turnstileError}
                    </div>
                  )}
                </div>
              ) : memoizedFilteredQuestions.length > 0 ? (
                <div className="no-select no-print">
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
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                  <p>{selectedDifficulty ? `No ${selectedDifficulty} questions available.` : 'No questions available for this category.'}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
