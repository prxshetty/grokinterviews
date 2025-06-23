'use client';

import React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { TopicCategoryGrid } from './index';
import { Pagination } from '@/components/ui';
import { QuestionWithAnswer } from '@/components/questions';
import { CategoryDetailView } from './';
import { LoadingSpinner } from '@/components/ui';
import { createClient } from "@/utils/supabase/client";

// Import necessary types
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

type CategoryItem = {
  id: string;
  label: string;
};

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

interface ContentDisplayProps {
  selectedTopic: string | null;
  selectedCategory: string | null;
  selectedDifficulty: string | null;
  categoryDetails: TopicItem | null;
  topicCategories: CategoryItem[];
  difficultyQuestions: QuestionType[];
  isLoading: {
    categories: boolean;
    sections: boolean;
    difficultyQuestions: boolean;
  };
  onSelectCategory: (categoryId: string) => void;
  // Pass other props needed by the different views
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  domain: string;
  highlightedQuestionId?: number;
  clearDifficultyFilter?: () => void;
  onDifficultyChange?: (difficulty: string | null) => void;
  onBackToMainCategories?: () => void;
  subtopicProgressData?: Record<string, SubtopicProgress>;
  categoryProgressData?: CategoryProgress | null;
  currentSubtopicProgress?: SubtopicProgress | null;
}

export default function ContentDisplay({
  selectedTopic,
  selectedCategory,
  selectedDifficulty,
  categoryDetails,
  topicCategories,
  difficultyQuestions,
  isLoading,
  onSelectCategory,
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
  domain,
  highlightedQuestionId,
  clearDifficultyFilter,
  onDifficultyChange,
  onBackToMainCategories,
  subtopicProgressData,
  categoryProgressData,
  currentSubtopicProgress,
}: ContentDisplayProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  // New state for bookmarks
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());

  // Scroll to highlighted question if it exists
  useEffect(() => {
    if (highlightedQuestionId) {
      setTimeout(() => {
        const questionElement = document.getElementById(`question-${highlightedQuestionId}`);
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // Give enough time for the component to render
    }
  }, [highlightedQuestionId, selectedCategory, selectedDifficulty]);

  // Fetch bookmarks when difficultyQuestions change or user changes (implicitly via supabase client)
  useEffect(() => {
    const fetchUserAndBookmarks = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && difficultyQuestions.length > 0) {
        const questionIds = difficultyQuestions.map(q => q.id);
        try {
          const { data: bookmarksData, error } = await supabase
            .from('user_bookmarks')
            .select('question_id')
            .eq('user_id', user.id)
            .in('question_id', questionIds);

          if (error) {
            setBookmarkedQuestions(new Set()); // Reset on error
            return;
          }
          setBookmarkedQuestions(new Set(bookmarksData.map(b => b.question_id)));
        } catch {
          setBookmarkedQuestions(new Set()); // Reset on error
        }
      } else {
        setBookmarkedQuestions(new Set()); // Clear if no user or no questions
      }
    };

    if (difficultyQuestions.length > 0) { // Only fetch if there are questions to check
        fetchUserAndBookmarks();
    } else {
        setBookmarkedQuestions(new Set()); // Ensure bookmarks are cleared if questions are cleared
    }
  }, [supabase, difficultyQuestions]);

  // Handler for bookmark changes from QuestionWithAnswer
  const handleBookmarkChange = (questionId: number, newStatus: boolean) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newStatus) {
        newSet.add(questionId);
      } else {
        newSet.delete(questionId);
      }
      return newSet;
    });
  };

  // Decide what content to display based on current selection state
  if (isLoading.difficultyQuestions) {
    return <LoadingSpinner centered text="Loading questions..." />;
  }

  if (selectedDifficulty) {
    return (
      <div className="p-4 animate-fadeIn">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Questions
            </h2>
            {selectedTopic && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Filtered to: {selectedTopic.toUpperCase()}
              </p>
            )}
          </div>
          <button
            onClick={() => clearDifficultyFilter && clearDifficultyFilter()}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear
          </button>
        </div>
        
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {isLoading.difficultyQuestions ? (
            <p>Loading questions...</p>
          ) : difficultyQuestions.length > 0 ? (
            <>
              Showing {difficultyQuestions.length} of {totalResults} questions
              {totalPages > 1 && (
                <span> (Page {currentPage} of {totalPages})</span>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
                No {selectedDifficulty} difficulty questions found for {selectedTopic?.toUpperCase()}.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Try selecting a different difficulty level or topic.
              </p>
            </div>
          )}
        </div>
        
        {difficultyQuestions.length > 0 ? (
          <>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {difficultyQuestions.map((question, index) => (
                  <QuestionWithAnswer
                    key={question.id}
                    question={question}
                    questionIndex={index}
                    isBookmarked={bookmarkedQuestions.has(question.id)}
                    onBookmarkStatusChange={handleBookmarkChange}
                  />
                ))}
              </div>
            </div>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </>
        ) : null}
      </div>
    );
  }
  

  
  if (isLoading.sections || isLoading.categories) {
    return <LoadingSpinner centered text="Loading content..." />;
  }

  if (selectedCategory) {
    if (isLoading.sections) {
      return <LoadingSpinner centered text="Loading category details..." />;
    }
    const categoryDetailViewProps: React.ComponentProps<typeof CategoryDetailView> = {
      categoryId: selectedCategory,
      categoryDetails: categoryDetails,
    };

    // Only add optional props if they have defined values
    if (highlightedQuestionId !== undefined) {
      categoryDetailViewProps.highlightedQuestionId = highlightedQuestionId;
    }
    if (selectedDifficulty !== undefined) {
      categoryDetailViewProps.selectedDifficulty = selectedDifficulty;
    }
    if (onDifficultyChange !== undefined) {
      categoryDetailViewProps.onDifficultyChange = onDifficultyChange;
    }
    if (domain !== undefined) {
      categoryDetailViewProps.domain = domain;
    }
    if (onBackToMainCategories !== undefined) {
      categoryDetailViewProps.onBackToMainCategories = onBackToMainCategories;
    }
    if (subtopicProgressData !== undefined) {
      categoryDetailViewProps.subtopicProgressData = subtopicProgressData;
    }
    if (categoryProgressData !== undefined) {
      categoryDetailViewProps.categoryProgressData = categoryProgressData;
    }
    if (currentSubtopicProgress !== undefined) {
      categoryDetailViewProps.currentSubtopicProgress = currentSubtopicProgress;
    }

    return <CategoryDetailView {...categoryDetailViewProps} />;
  }
  
  if (selectedTopic) {
    return (
      <div className="p-4">
        {/* Topic header can go here */}
        
        {/* Main topic categories */}
        <div className="w-full">
          <div className="w-full">
            {topicCategories.length > 0 ? (
              <TopicCategoryGrid 
                categories={topicCategories}
                onSelectCategory={onSelectCategory}
                domain={selectedTopic}
                level="section"
                isLoading={isLoading.categories}
                subtopicProgress={subtopicProgressData ?? {}}
              />
            ) : (
              <div className="w-full text-center py-6">
                <p className="text-sm text-gray-500">No sections found for this topic.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Specific fallback for when we're on the main /topics page
  // This ensures we don't make any API calls or show loading states
  if (!selectedTopic && pathname === '/topics') {
            // Return empty div - navigation will be handled by MainNavigation
    return <div className="h-8"></div>;
  }
  
  // Default view when nothing is selected - we're either on the main topics page or a 
  // specific domain page but no topic is selected yet
  // Return nothing - the topics page will handle this case with MainNavigation
  return null;
} 