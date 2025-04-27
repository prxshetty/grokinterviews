'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import QuestionList from './QuestionList';

// Import types
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

interface CategoryDetailViewProps {
  categoryId: string;
  categoryDetails: TopicItem | null;
  highlightedQuestionId?: number;
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
  highlightedQuestionId
}: CategoryDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Local state for UI elements
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [subtopicDetails, setSubtopicDetails] = useState<TopicItem | null>(null);
  
  // Check if this is section/header or specific topic
  const isSectionHeader = categoryId.startsWith('header-');
  const hasSubtopics = categoryDetails?.subtopics && Object.keys(categoryDetails.subtopics).length > 0;
  const hasRealSubtopics = hasSubtopics && Object.keys(categoryDetails?.subtopics || {}).some(id => id.startsWith('topic-'));
  const hasQuestions = categoryDetails?.questions && categoryDetails.questions.length > 0;
  
  // Handle back button click
  const handleBackToMainCategories = () => {
    // For deep linking, go back to the domain page
    const segments = pathname.split('/');
    if (segments.length >= 3) {
      const domain = segments[2];
      router.push(`/topics/${domain}`);
    } else {
      // Fallback in case URL structure isn't as expected
      router.back();
    }
  };

  // Handle subtopic selection
  const handleSubtopicSelect = async (topicId: string) => {
    // If already selected, toggle off
    if (selectedSubtopic === topicId) {
      setSelectedSubtopic(null);
      setSubtopicDetails(null);
      return;
    }

    setIsLoading(true);
    setSelectedSubtopic(topicId);

    try {
      // Fix the API endpoint - use /api/topics/topic-details instead of /api/topic-detail
      const response = await fetch(`/api/topics/topic-details?topicId=${topicId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch topic details: ${response.statusText}`);
      }

      const responseData = await response.json() as TopicResponse;
      console.log('Topic API response:', responseData);
      
      // The API returns a different structure than what our component expects
      // Transform the data to match the expected structure
      if (responseData.topic && responseData.categories) {
        // Create a properly formatted details object from the API response
        const formattedDetails: TopicItem = {
          id: responseData.topic.id.toString(),
          label: responseData.topic.name,
          content: responseData.topic.description || `Details for ${responseData.topic.name}`,
          // Combine all questions from all categories
          questions: responseData.categories.flatMap(category => 
            (category.questions || []).map(q => ({
              ...q,
              // Add category information to each question for display
              categories: {
                id: category.id,
                name: category.name,
                topic_id: category.topic_id
              }
            }))
          )
        };
        
        console.log('Formatted topic details:', formattedDetails);
        setSubtopicDetails(formattedDetails);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error(`Error loading details for subtopic ${topicId}:`, error);
      setSubtopicDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to category from subtopic
  const handleBackToCategory = () => {
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
  };
  
  if (isLoading && !categoryDetails) {
    return (
      <div className="w-full text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
        <p className="mt-3 text-gray-500">Loading content...</p>
      </div>
    );
  }

  // If a subtopic is selected, show its details
  if (selectedSubtopic && subtopicDetails) {
    // Group questions by category if the subtopicDetails has questions with category info
    const questionsByCategory: Record<number, { name: string; questions: QuestionType[] }> = {};
    
    if (subtopicDetails.questions && subtopicDetails.questions.length > 0) {
      // Group questions by their category
      subtopicDetails.questions.forEach(question => {
        if (question.categories) {
          const categoryId = question.categories.id;
          if (!questionsByCategory[categoryId]) {
            questionsByCategory[categoryId] = { 
              name: question.categories.name, 
              questions: [] 
            };
          }
          questionsByCategory[categoryId].questions.push(question);
        }
      });
    }
    
    const hasGroupedQuestions = Object.keys(questionsByCategory).length > 0;
    
    return (
      <div className="p-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {subtopicDetails.label}
          </h1>
          <button
            onClick={handleBackToCategory}
            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {categoryDetails?.label || 'Category'}
          </button>
        </div>
        
        {subtopicDetails.content && (
          <div className="mb-6 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md">
            <p>{subtopicDetails.content}</p>
          </div>
        )}

        {/* When we have questions grouped by categories */}
        {hasGroupedQuestions ? (
          <div>
            {Object.values(questionsByCategory).map((category, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                <QuestionList 
                  questions={category.questions} 
                  highlightedQuestionId={highlightedQuestionId}
                  groupByCategory={false}
                />
              </div>
            ))}
          </div>
        ) : subtopicDetails.questions && subtopicDetails.questions.length > 0 ? (
          // Fallback to simple question list if no category info
          <div>
            <h2 className="text-xl font-semibold mb-4">Questions</h2>
            <QuestionList 
              questions={subtopicDetails.questions} 
              highlightedQuestionId={highlightedQuestionId}
              groupByCategory={false}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No questions available for this topic.</p>
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
        <h1 className="text-2xl font-bold">
          {categoryDetails?.label}
        </h1>
        <button
          onClick={handleBackToMainCategories}
          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Categories
        </button>
      </div>
      
      {/* Description if available */}
      {categoryDetails?.content && (
        <div className="mb-6 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md">
          <p>{categoryDetails.content}</p>
        </div>
      )}
      
      {/* If the category has subtopics, show them */}
      {hasRealSubtopics && categoryDetails?.subtopics && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryDetails.subtopics)
              .filter(([id]) => id.startsWith('topic-'))
              .map(([id, subtopic]) => (
                <div 
                  key={id} 
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSubtopicSelect(id)}
                >
                  <h3 className="font-medium mb-2">{subtopic.label}</h3>
                  {subtopic.content && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {subtopic.content}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Show questions if available */}
      {hasQuestions && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          <QuestionList 
            questions={categoryDetails?.questions || []} 
            highlightedQuestionId={highlightedQuestionId}
            groupByCategory={false}
          />
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