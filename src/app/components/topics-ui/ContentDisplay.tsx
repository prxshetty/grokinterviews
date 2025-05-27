'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { TopicCategoryGrid } from './index';
import { Pagination } from '../ui';
import { QuestionWithAnswer } from '@/app/components/questions';
import { CategoryDetailView } from './';

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

interface ContentDisplayProps {
  selectedTopic: string | null;
  selectedCategory: string | null;
  selectedKeyword: string | null;
  selectedDifficulty: string | null;
  categoryDetails: TopicItem | null;
  topicCategories: CategoryItem[];
  keywordQuestions: QuestionType[];
  difficultyQuestions: QuestionType[];
  loadingCategories: boolean;
  loadingSections: boolean;
  onSelectCategory: (categoryId: string) => void;
  // Pass other props needed by the different views
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  domain: string;
  highlightedQuestionId?: number;
}

export default function ContentDisplay({
  selectedTopic,
  selectedCategory,
  selectedKeyword,
  selectedDifficulty,
  categoryDetails,
  topicCategories,
  keywordQuestions,
  difficultyQuestions,
  loadingCategories,
  loadingSections,
  onSelectCategory,
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
  domain,
  highlightedQuestionId,
}: ContentDisplayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  }, [highlightedQuestionId, selectedCategory, selectedKeyword, selectedDifficulty]);
  
  // Decide what content to display based on current selection state
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
            onClick={() => {
              // Reset difficulty filter in URL but maintain other parameters
              const params = new URLSearchParams(searchParams);
              params.delete('difficulty');
              const newUrl = `${pathname}?${params.toString()}`;
              router.push(newUrl);
            }}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear
          </button>
        </div>
        
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {difficultyQuestions.length > 0 ? (
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
              {difficultyQuestions.map((question, index) => (
                <QuestionWithAnswer 
                  key={question.id}
                  question={question}
                  questionIndex={index}
                  isHighlighted={highlightedQuestionId === question.id}
                />
              ))}
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
  
  if (selectedKeyword) {
    return (
      <div className="p-4 animate-fadeIn">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              Questions for keyword: <span className="text-blue-600 dark:text-blue-400">{selectedKeyword}</span>
            </h2>
            {selectedTopic && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Filtered to: {selectedTopic.toUpperCase()}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              // Reset keyword filter in URL but maintain other parameters
              const params = new URLSearchParams(searchParams);
              params.delete('q');
              const newUrl = `${pathname}?${params.toString()}`;
              router.push(newUrl);
            }}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear
          </button>
        </div>
        
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Showing {keywordQuestions.length} of {totalResults} questions
          {totalPages > 1 && (
            <span> (Page {currentPage} of {totalPages})</span>
          )}
        </div>
        
        <div>
          {keywordQuestions.map((question, index) => (
            <QuestionWithAnswer 
              key={question.id}
              question={question}
              questionIndex={index}
              isHighlighted={highlightedQuestionId === question.id}
            />
          ))}
        </div>
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    );
  }
  
  if (selectedCategory) {
    return (
      <CategoryDetailView 
        categoryId={selectedCategory}
        categoryDetails={categoryDetails}
        highlightedQuestionId={highlightedQuestionId}
      />
    );
  }
  
  if (selectedTopic) {
    return (
      <div className="mb-12 animate-fadeIn">
        <h1 className="text-4xl font-normal tracking-tight mb-8 px-4">
          {selectedTopic.toUpperCase()} Topics
        </h1>
        
        {/* Main topic categories */}
        <div className="w-full">
          {loadingCategories || loadingSections ? (
            <div className="w-full text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
              <p className="mt-2 text-sm text-gray-500">Loading categories...</p>
            </div>
          ) : (
            <div className="w-full">
              {topicCategories.length > 0 ? (
                <TopicCategoryGrid
                  categories={topicCategories}
                  onSelectCategory={onSelectCategory}
                  topicId={selectedTopic}
                  domain={selectedTopic}
                  level="section"
                  isLoading={false}
                />
              ) : (
                <div className="w-full text-center py-6">
                  <p className="text-sm text-gray-500">No sections found for this topic.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Specific fallback for when we're on the main /topics page
  // This ensures we don't make any API calls or show loading states
  if (!selectedTopic && pathname === '/topics') {
    // Return empty div - navigation will be handled by TopicNavWrapper
    return <div className="h-8"></div>;
  }
  
  // Default view when nothing is selected - we're either on the main topics page or a 
  // specific domain page but no topic is selected yet
  if (!selectedTopic) {
    // Return nothing - the topics page will handle this case with TopicNavWrapper
    return null;
  }
}

// Main topics with their corresponding colors - same as in page.tsx and TopicTabs.tsx
const mainTopics = [
  { id: 'ml', label: 'Machine Learning', color: 'bg-blue-500' },
  { id: 'ai', label: 'Artificial Intelligence', color: 'bg-red-500' },
  { id: 'webdev', label: 'Web Development', color: 'bg-gray-300' },
  { id: 'sdesign', label: 'System Design', color: 'bg-yellow-300' },
  { id: 'dsa', label: 'Data Structures & Algorithms', color: 'bg-green-500' }
]; 