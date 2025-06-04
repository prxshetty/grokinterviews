'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { QuestionWithAnswer } from '@/app/components/questions';
import ProgressBar from '../ui/ProgressBar';
import { fetchCategoryProgress, fetchSubtopicProgress, isQuestionCompleted } from '@/app/utils/progress';

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

interface CategoryDetailViewProps {
  categoryId: string;
  categoryDetails: TopicItem | null;
  highlightedQuestionId?: number;
  selectedDifficulty?: string | null;
  onDifficultyChange?: (difficulty: string | null) => void;
  domain?: string;
  onBackToMainCategories?: () => void;
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
  onBackToMainCategories
}: CategoryDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Local state for UI elements
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [subtopicDetails, setSubtopicDetails] = useState<TopicItem | null>(null);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);
  
  // Progress tracking states
  const [categoryProgress, setCategoryProgress] = useState<{
    questionsCompleted: number;
    totalQuestions: number;
    completionPercentage: number;
  } | null>(null);
  
  const [subtopicProgress, setSubtopicProgress] = useState<{
    categoriesCompleted: number;
    totalCategories: number;
    questionsCompleted: number;
    totalQuestions: number;
    completionPercentage: number;
  } | null>(null);
  
  // Update type for subtopicsProgress to include category counts
  const [subtopicsProgress, setSubtopicsProgress] = useState<Record<string, {
    categoriesCompleted: number;
    totalCategories: number;
    questionsCompleted: number;
    totalQuestions: number;
    completionPercentage: number;
  }>>({});
  
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
    const grouped: Record<number, { name: string; questions: QuestionType[] }> = {};
    
    if (filteredQuestions.length > 0) {
      // Group questions by their category
      filteredQuestions.forEach(question => {
        if (question.categories) {
          const categoryId = question.categories.id;
          if (!grouped[categoryId]) {
            grouped[categoryId] = { 
              name: question.categories.name, 
              questions: [] 
            };
          }
          grouped[categoryId].questions.push(question);
        }
      });
    }
    
    return grouped;
  }, [filteredQuestions]);

  // Memoize check for grouped questions
  const hasGroupedQuestions = useMemo(() => {
    return Object.keys(questionsByCategory).length > 0;
  }, [questionsByCategory]);

  // Update filtered questions when calculation changes
  useEffect(() => {
    setFilteredQuestions(memoizedFilteredQuestions);
  }, [memoizedFilteredQuestions]);

  // Fetch progress data for category and subtopic
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // For categories, fetch their progress data
        if (categoryId && !categoryId.startsWith('header-')) {
          const numericId = parseInt(categoryId.replace('topic-', ''));
          if (!isNaN(numericId)) {
            console.log(`Fetching progress for category ID: ${numericId}`);
            const progress = await fetchCategoryProgress(numericId, true);
            setCategoryProgress(progress);
          }
        }
        
        // For subtopics, fetch their progress
        if (selectedSubtopic) {
          const numericId = parseInt(selectedSubtopic.replace('topic-', ''));
          if (!isNaN(numericId)) {
            console.log(`Fetching progress for subtopic ID: ${numericId}`);
            const progress = await fetchSubtopicProgress(numericId, true);
            setSubtopicProgress(progress);
          }
        }
        
        // --- Fetch progress for all subtopics in parallel ---
        if (categoryDetails?.subtopics) {
          setIsSubtopicProgressLoading(true);
          const subtopicEntries = Object.entries(categoryDetails.subtopics)
            .filter(([id]) => id.startsWith('topic-'));
          
          const progressPromises = subtopicEntries.map(async ([id, subtopic]) => {
            try {
              const numericId = parseInt(id.replace('topic-', ''));
              if (!isNaN(numericId)) {
                // Use fetchSubtopicProgress to get category-based progress
                const progress = await fetchSubtopicProgress(numericId, false); // false to not fetch detailed question data
                return { id, progress };
              }
            } catch (error) {
              console.error(`Error fetching progress for subtopic ${id}:`, error);
              // Return null or a specific error indicator if needed
              return { id, progress: null }; 
            }
            return { id, progress: null }; // Return null if numericId is NaN or other issues
          });

          // Wait for all promises to resolve
          const results = await Promise.all(progressPromises);
          
          // Aggregate results into the state object
          const progressData: Record<string, any> = {};
          results.forEach(result => {
            if (result && result.progress) {
              progressData[result.id] = result.progress;
            }
          });
          
          setSubtopicsProgress(progressData);
          setIsSubtopicProgressLoading(false);
        }
        // --- End parallel fetching ---
        
        // Update completed questions tracking
        const questions = filteredQuestions.length > 0 ? filteredQuestions : (categoryDetails?.questions || []);
        
        // Check each question's completion status
        const completionStatus: Record<number, boolean> = {};
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
      } catch (error) {
        console.error('Error fetching progress data:', error);
      }
    };
    
    fetchProgress();
    
    // Listen for question completion events
    const handleQuestionCompleted = (event: CustomEvent) => {
      const { questionId } = event.detail;
      // Update the completed questions state
      setCompletedQuestions(prev => ({
        ...prev,
        [questionId]: true
      }));
      
      // Refresh progress data after a short delay to allow the server to update
      setTimeout(() => {
        fetchProgress();
      }, 1000);
    };
    
    // Listen for subtopic progress update events - allows faster progress bar updates
    const handleSubtopicProgressUpdated = (event: CustomEvent) => {
      const { subtopicId, progress } = event.detail;
      
      // Check if this update is relevant for currently selected subtopic
      if (selectedSubtopic && subtopicId && selectedSubtopic === `topic-${subtopicId}`) {
        console.log(`Updating progress for currently selected subtopic: ${subtopicId}`, progress);
        setSubtopicProgress(progress);
      }
      
      // Update in the subtopics progress collection if relevant
      if (categoryDetails?.subtopics && subtopicId) {
        const topicKey = `topic-${subtopicId}`;
        if (topicKey in (categoryDetails.subtopics || {})) {
          console.log(`Updating progress for subtopic in grid: ${topicKey}`, progress);
          setSubtopicsProgress(prev => ({
            ...prev,
            [topicKey]: progress
          }));
        }
      }
    };
    
    // Handle domain subtopics progress updates for section-level refreshes
    const handleDomainSubtopicsProgressUpdated = (event: CustomEvent) => {
      console.log('[handleDomainSubtopicsProgressUpdated] Event received:', event.detail); // Log the entire event detail
      
      const { subtopics, questionInfo } = event.detail;
      
      if (!subtopics || !categoryDetails?.subtopics) {
         console.log('[handleDomainSubtopicsProgressUpdated] Skipping: No subtopics in event or categoryDetails.');
         return;
      }
      
      // Update any matching subtopics in our current view
      let updatedProgress = { ...subtopicsProgress };
      let isUpdated = false;
      
      Object.entries(subtopics).forEach(([subtopicId, progress]) => {
        const topicKey = `topic-${subtopicId}`;
        if (topicKey in (categoryDetails.subtopics || {})) {
          console.log(`[handleDomainSubtopicsProgressUpdated] Updating progress for ${topicKey} with:`, progress); // Log the specific progress object being applied
          updatedProgress[topicKey] = progress as {
            categoriesCompleted: number;
            totalCategories: number;
            questionsCompleted: number;
            totalQuestions: number;
            completionPercentage: number;
          };
          isUpdated = true;
        } else {
           console.log(`[handleDomainSubtopicsProgressUpdated] Skipping update for ${topicKey}: Not found in current categoryDetails.subtopics`);
        }
      });
      
      if (isUpdated) {
        console.log('[handleDomainSubtopicsProgressUpdated] Applying updated subtopicsProgress:', updatedProgress); // Log the final object before setting state
        setSubtopicsProgress(updatedProgress);
      } else {
         console.log('[handleDomainSubtopicsProgressUpdated] No relevant subtopics were updated.');
      }
      
      // If the category of the completed question matches current category, update its progress too
      if (questionInfo?.categoryId && categoryId && categoryId === `topic-${questionInfo.categoryId}`) {
        console.log('[handleDomainSubtopicsProgressUpdated] Refreshing category progress due to related question completion:', questionInfo.categoryId);
        fetchCategoryProgress(questionInfo.categoryId, true)
          .then(progress => setCategoryProgress(progress))
          .catch(error => console.error('[handleDomainSubtopicsProgressUpdated] Failed to refresh category progress:', error));
      }
    };
    
    window.addEventListener('questionCompleted', handleQuestionCompleted as EventListener);
    window.addEventListener('subtopicProgressUpdated', handleSubtopicProgressUpdated as EventListener);
    window.addEventListener('domainSubtopicsProgressUpdated', handleDomainSubtopicsProgressUpdated as EventListener);
    
    return () => {
      window.removeEventListener('questionCompleted', handleQuestionCompleted as EventListener);
      window.removeEventListener('subtopicProgressUpdated', handleSubtopicProgressUpdated as EventListener);
      window.removeEventListener('domainSubtopicsProgressUpdated', handleDomainSubtopicsProgressUpdated as EventListener);
    };
  }, [categoryId, selectedSubtopic, categoryDetails?.subtopics, categoryDetails?.questions, filteredQuestions]);
  
  // Memoize domain display name for dynamic labels
  const domainDisplayName = useMemo(() => {
    const domainMap: Record<string, string> = {
      'ml': 'Machine Learning',
      'ai': 'Artificial Intelligence', 
      'webdev': 'Web Development',
      'sdesign': 'System Design',
      'dsa': 'Data Structures & Algorithms'
    };
    return domain ? domainMap[domain] || domain.toUpperCase() : 'Categories';
  }, [domain]);

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
            ? data.categories.flatMap(cat => cat.questions || [])
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

  // Render difficulty filter
  const renderDifficultyFilter = () => {
    if (!onDifficultyChange) return null; // Don't render if no handler is provided

    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Filter by Difficulty:</h4>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                // If current difficulty is clicked again, clear the filter (toggle off)
                // Otherwise, set the new difficulty
                const newDifficulty = propSelectedDifficulty === d.id ? null : d.id;
                onDifficultyChange(newDifficulty);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors
                ${propSelectedDifficulty === d.id
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {d.label}
            </button>
          ))}
          {propSelectedDifficulty && (
            <button
              onClick={() => onDifficultyChange(null)} // Explicit clear button
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 flex items-center"
              title="Clear difficulty filter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>
    );
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
    return (
      <div className="p-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">
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
        
        {/* Progress bar for subtopic */}
        {subtopicProgress && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {subtopicProgress.questionsCompleted}/{subtopicProgress.totalQuestions} questions completed
              </span>
            </div>
            <ProgressBar 
              progress={subtopicProgress.completionPercentage}
              completed={subtopicProgress.questionsCompleted}
              total={subtopicProgress.totalQuestions}
              height="md"
              showText={true}
              className={subtopicDetails.label}
            />
          </div>
        )}

        {/* Difficulty filter */}
        {subtopicDetails.questions && subtopicDetails.questions.length > 0 && renderDifficultyFilter()}

        {/* When we have questions grouped by categories */}
        {hasGroupedQuestions ? (
          <div>
            {Object.values(questionsByCategory).map((category, index) => (
              <div key={index} className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-medium">{category.name}</h2>
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
                  />
                ))}
              </div>
            ))}
          </div>
        ) : filteredQuestions.length > 0 ? (
          // Fallback to simple question list if no category info
          <div>
            <h2 className="text-xl font-medium mb-4">Questions</h2>
            {filteredQuestions.map((question, index) => (
              <QuestionWithAnswer 
                key={question.id}
                question={question}
                questionIndex={index}
                isHighlighted={highlightedQuestionId === question.id}
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
        <h1 className="text-2xl font-semibold">
          {categoryDetails?.label}
        </h1>
        <button
          onClick={handleBackToMainCategories}
          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {domainDisplayName}
        </button>
      </div>
      
      {/* If the category has subtopics, show them */}
      {hasRealSubtopics && categoryDetails?.subtopics && (
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Topics</h2>
          {isSubtopicProgressLoading ? (
            // Loading indicator
            <div className="w-full text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
              <p className="mt-2 text-sm text-gray-500">Loading topic progress...</p>
            </div>
          ) : (
            // Card-based grid layout for subtopics
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {Object.entries(categoryDetails.subtopics)
                .filter(([id]) => id.startsWith('topic-'))
                .map(([id, subtopic]) => (
                  <div
                    key={id}
                    onClick={() => handleSubtopicSelect(id)}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between h-full"
                  >
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white truncate">{subtopic.label}</h3>
                    </div>
                    {/* Progress bar section */}
                    <div className="mt-auto pt-2">
                      {subtopicsProgress[id] && subtopicsProgress[id].totalCategories > 0 ? (
                        <>
                          <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>Progress</span>
                            <span>
                              {subtopicsProgress[id].categoriesCompleted}/{subtopicsProgress[id].totalCategories} Categories
                            </span>
                          </div>
                          <ProgressBar
                            progress={
                              (subtopicsProgress[id].categoriesCompleted / subtopicsProgress[id].totalCategories) * 100
                            }
                            completed={subtopicsProgress[id].categoriesCompleted}
                            total={subtopicsProgress[id].totalCategories}
                            height="sm"
                            showText={false} // Text is shown above
                            className={subtopic.label}
                          />
                        </>
                      ) : (
                        <div className="h-5 mt-3"> {/* Placeholder to maintain layout */}
                          <span className="text-xs text-gray-400 dark:text-gray-500">Progress not available</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      
      {/* Show difficulty filter if we have questions */}
      {hasQuestions && renderDifficultyFilter()}
      
      {/* Show questions if available */}
      {hasQuestions && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-medium">Questions</h2>
            {categoryProgress && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {categoryProgress.questionsCompleted}/{categoryProgress.totalQuestions} completed
              </span>
            )}
          </div>
          
          {/* Progress bar for category */}
          {categoryProgress && (
            <div className="mb-4">
              <ProgressBar
                progress={categoryProgress.completionPercentage}
                completed={categoryProgress.questionsCompleted}
                total={categoryProgress.totalQuestions}
                height="md"
                showText={false}
                className={categoryDetails?.label || 'category'}
              />
            </div>
          )}
          
          {filteredQuestions.length > 0 ? (
            <div>
              {filteredQuestions.map((question, index) => (
                <QuestionWithAnswer 
                  key={question.id}
                  question={question}
                  questionIndex={index}
                  isHighlighted={highlightedQuestionId === question.id}
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