"use client";

import { useState, useEffect } from 'react';
import { useTopicData } from '../components/TopicDataProvider';
import TopicDataService from '@/services/TopicDataService';
// Define our own types for the topics page
import { Question } from '@/types/database';
import ActivityProgress from '../components/ActivityProgress';
import ProgressChart from '../components/ProgressChart';
import TopicCategoryGrid from '../components/topic/TopicCategoryGrid';

// Main topics with their corresponding colors
const mainTopics = [
  { id: 'ml', label: 'Machine Learning', color: 'bg-blue-500' },
  { id: 'ai', label: 'Artificial Intelligence', color: 'bg-red-500' },
  { id: 'webdev', label: 'Web Development', color: 'bg-gray-300' },
  { id: 'system-design', label: 'System Design', color: 'bg-yellow-300' },
  { id: 'dsa', label: 'Data Structures & Algorithms', color: 'bg-green-500' }
];

type CategoryItem = {
  id: string;
  label: string;
};

// Define a type for topic items that includes questions
type TopicItem = {
  id?: string;
  label: string;
  content?: string;
  questions?: Question[];
  categoryId?: number;
  subtopics?: Record<string, TopicItem>;
};

export default function TopicsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [topicCategories, setTopicCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState<any>(null);
  const [loadingCategoryDetails, setLoadingCategoryDetails] = useState(false);
  const { topicData } = useTopicData();

  const handleTopicClick = async (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedCategory(null); // Reset category selection when topic changes

    // Load categories for this topic
    if (selectedTopic !== topicId) {
      await loadTopicCategories(topicId);
    }
  };

  const loadTopicCategories = async (topicId: string) => {
    setLoadingCategories(true);
    try {
      const categories = await TopicDataService.getTopicCategories(topicId);
      setTopicCategories(categories);
    } catch (error) {
      console.error(`Error loading categories for ${topicId}:`, error);
      setTopicCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Function to reset selections has been removed

  const handleCategorySelect = async (categoryId: string) => {
    console.log('topics/page - handleCategorySelect called with:', categoryId);

    if (categoryId === selectedCategory) {
      console.log('topics/page - Same category selected, clearing selection');
      setSelectedCategory(null);
      setCategoryDetails(null);
      return;
    }

    console.log('topics/page - Setting selectedCategory to:', categoryId);
    setSelectedCategory(categoryId);

    // For ML topics, we need to set the selectedTopic to 'ml'
    if (!selectedTopic) {
      console.log('topics/page - Setting selectedTopic to ml for ML topics');
      setSelectedTopic('ml');
    }

    await loadCategoryDetails(categoryId);
  };

  const loadCategoryDetails = async (categoryId: string) => {
    console.log('topics/page - loadCategoryDetails called with:', categoryId);
    console.log('topics/page - Current selectedTopic:', selectedTopic);

    if (!selectedTopic) {
      console.log('topics/page - No topic selected, setting to ml');
      setSelectedTopic('ml');
    }

    setLoadingCategoryDetails(true);
    try {
      // Check if this is a section header ID (format: header-123)
      if (categoryId.startsWith('header-')) {
        console.log(`This is a section header: ${categoryId}`);

        // For section headers, we'll display a placeholder message
        setCategoryDetails({
          label: 'Section Header',
          content: 'Content for this category is being prepared.'
        });
        return;
      }

      // Ensure selectedTopic is not null
      const topicId = selectedTopic || 'ml';
      console.log(`Loading details for category ${categoryId} in topic ${topicId}`);
      const data = await TopicDataService.getCategoryDetails(topicId, categoryId);

      if (!data) {
        console.warn(`No details available for category ${categoryId}`);
        // Set a null value but in a controlled way
        setCategoryDetails(null);
      } else {
        console.log(`Successfully loaded details for category ${categoryId}`);
        console.log('topics/page - Category details:', data);
        setCategoryDetails(data);
      }
    } catch (error) {
      console.error(`Error loading details for category ${categoryId}:`, error);
      setCategoryDetails(null);
    } finally {
      setLoadingCategoryDetails(false);
    }
  };

  const handleBackToMainCategories = () => {
    setSelectedCategory(null);
  };

  // Load categories when selected topic changes
  useEffect(() => {
    if (selectedTopic) {
      loadTopicCategories(selectedTopic);
    }
  }, [selectedTopic]);

  // Renders a category and its content in the structured format
  const renderCategoryContent = (categoryId: string) => {
    if (!selectedTopic) {
      return null;
    }

    if (loadingCategoryDetails) {
      return (
        <div className="w-full space-y-3 animate-fadeIn flex justify-center items-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 border-r-2 border-gray-500 mr-3"></div>
          <p className="text-sm text-gray-500">Loading content...</p>
        </div>
      );
    }

    // Get the selected category label
    let categoryLabel = '';

    // Check if this is a section header (format: header-123)
    if (categoryId.startsWith('header-')) {
      // For section headers, try to find the name from the section headers API
      // If we have category details with a label, use that
      if (categoryDetails && categoryDetails.label && categoryDetails.label !== 'Section Header') {
        categoryLabel = categoryDetails.label;
      } else {
        // For now, use a generic label
        categoryLabel = 'Section Header';
      }
    } else {
      // For regular categories, get the label from the categories list
      categoryLabel = topicCategories.find(cat => cat.id === categoryId)?.label || 'Selected Category';
    }

    // Use the categoryDetails if available, otherwise fallback to topicData
    if (categoryDetails) {
      // Check if this is a section header (used in the message below)

      // Count the actual subtopics
      const hasRealSubtopics = categoryDetails.subtopics && Object.keys(categoryDetails.subtopics).length > 0;

      console.log(`Category ${categoryId} has subtopics: ${hasRealSubtopics}`);
      if (categoryDetails.subtopics) {
        console.log(`Subtopics: ${Object.keys(categoryDetails.subtopics).join(', ')}`);
      }

      // If the category has subtopics, render them in the new format
      if (hasRealSubtopics) {
        const listItems = Object.entries(categoryDetails.subtopics);

        return (
          <div className="w-full animate-fadeIn">
            <h2 className="text-xl font-bold uppercase mb-6">{categoryLabel}</h2>

            {/* Render subtopics in the new format */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              {listItems.map(([listId, listItem], listIndex) => {
                const typedListItem = listItem as TopicItem;
                const itemNumber = listIndex + 1;
                const formattedNumber = String(itemNumber).padStart(2, '0');

                // Check if this subtopic has questions
                const hasQuestions = typedListItem.questions && typedListItem.questions.length > 0;

                return (
                  <div key={listId} className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-16 text-gray-400 text-2xl font-light">{formattedNumber}</div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{typedListItem.label}</h3>
                        {hasQuestions && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {typedListItem.questions?.length} question{typedListItem.questions?.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="w-8 text-center text-gray-400">
                        {hasQuestions ? '+' : '•'}
                      </div>
                    </div>

                    {/* Display questions for this subtopic if available */}
                    {hasQuestions && (
                      <div className="pl-16 pr-8 pb-4">
                        {typedListItem.questions?.map((question: Question, qIndex: number) => (
                          <div key={qIndex} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{question.question_text}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Q{qIndex + 1}</span>
                            </div>
                            {question.answer_text && (
                              <div className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                                <p>{question.answer_text}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      } else {
        // No subtopics but we have a category label - show the empty state
        return (
          <div className="w-full animate-fadeIn">
            <h2 className="text-xl font-bold uppercase mb-6">{categoryLabel}</h2>
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-center text-gray-500 dark:text-gray-400">
                {categoryId.startsWith('header-') ? 'Content for this section is being prepared. Please check back later.' : 'No content available for this category yet.'}
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleBackToMainCategories}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Categories
                </button>
              </div>
            </div>
          </div>
        );
      }
    }

    // Get category from topicData as fallback
    if (topicData && topicData[selectedTopic]?.subtopics) {
      // First look for the exact categoryId
      let category = topicData[selectedTopic].subtopics[categoryId];

      // If not found, try to match based on substring
      if (!category) {
        const subtopics = topicData[selectedTopic].subtopics;
        for (const key in subtopics) {
          if (key.includes(categoryId) || categoryId.includes(key)) {
            category = subtopics[key];
            break;
          }
        }
      }

      // If not found by category ID, try by label
      if (!category) {
        const categoryLabel = topicCategories.find(cat => cat.id === categoryId)?.label;
        if (categoryLabel) {
          const subtopics = topicData[selectedTopic].subtopics;
          for (const key in subtopics) {
            if (subtopics[key].label.toLowerCase().includes(categoryLabel.toLowerCase()) ||
                categoryLabel.toLowerCase().includes(subtopics[key].label.toLowerCase())) {
              category = subtopics[key];
              break;
            }
          }
        }
      }

      if (!category || !category.subtopics) {
        // Get the category label if possible
        return (
          <div className="w-full animate-fadeIn">
            <h2 className="text-xl font-bold uppercase mb-6">{categoryLabel}</h2>
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Content for this category is being prepared.
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleBackToMainCategories}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Categories
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Get list items under this category
      const listItems = Object.entries(category.subtopics);

      return (
        <div className="w-full animate-fadeIn">
          <h2 className="text-xl font-bold uppercase mb-6">{categoryLabel}</h2>

          {/* Render subtopics in the new format */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {listItems.map(([listId, listItem], listIndex) => {
              const typedListItem = listItem as TopicItem;
              const itemNumber = listIndex + 1;
              const formattedNumber = String(itemNumber).padStart(2, '0');

              return (
                <div key={listId} className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center py-4">
                    <div className="w-16 text-gray-400 text-2xl font-light">{formattedNumber}</div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{typedListItem.label}</h3>
                    </div>
                    <div className="w-8 text-center text-gray-400">+</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full animate-fadeIn">
        <h2 className="text-xl font-bold uppercase mb-6">{categoryLabel}</h2>
        <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Could not load content for this category.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleBackToMainCategories}
              className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Categories
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen">
      <div className="w-full px-0">
        <div className="transition-opacity duration-300">
          <div className="p-0">
            {/* Navigation tabs */}
            <div className="flex justify-between items-center">
              <div className="flex flex-1">
                {mainTopics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className={`px-4 py-3 font-small text-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-800 transition ${selectedTopic === topic.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Categories section - removed border-bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                {['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript', 'Node.js', 'Next.js', 'API Design', 'System Design', 'Algorithms'].map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Frontend', 'Backend', 'Full Stack', 'Database', 'Cloud', 'DevOps', 'Testing', 'Security', 'Performance', 'UI/UX', 'Mobile', 'Accessibility'].map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content area - directly adjacent to Popular Categories without gap */}
            <div className="pt-0 pb-6">
              {selectedTopic ? (
                // Show improved topic tree when a topic is selected
                <div className="mb-12">
                  {/* SimpleTopicTree component removed */}

                  <div className="flex items-center gap-4 mb-6">
                    {selectedCategory && (
                      <button
                        onClick={handleBackToMainCategories}
                        className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Categories
                      </button>
                    )}


                  </div>

                  {/* Main topic categories */}
                  <div className="flex flex-wrap">
                    {loadingCategories ? (
                      <div className="w-full text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading categories...</p>
                      </div>
                    ) : selectedCategory === null ? (
                      // Show all main categories when no specific category is selected
                      <TopicCategoryGrid
                        categories={topicCategories}
                        onSelectCategory={handleCategorySelect}
                        topicId={selectedTopic} // Pass the selected topic ID
                      />
                    ) : (
                      // Show detailed view for the selected category
                      <div className="w-full animate-fadeIn">
                        {/* Content based on selected category */}
                        {renderCategoryContent(selectedCategory)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Show metadata grid with cards that match theme colors and appear as one row divided into 3 columns
                <div className="grid grid-cols-3 mb-8">
                  {/* Target Questions by Role Card */}
                  <div className="relative bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-5 cursor-pointer">
                    <div className="mb-4">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white uppercase mb-3">TARGET QUESTIONS BY ROLE</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-6">
                      Personalized question sets tailored to specific job roles and positions. Prepare for interviews with role-specific content.
                    </p>
                    <div className="absolute bottom-3 right-3">
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Quizzes Card */}
                  <div className="relative bg-white dark:bg-black border-t border-b border-gray-300 dark:border-gray-700 p-5 cursor-pointer">
                    <div className="mb-4">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
                          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white uppercase mb-3">QUIZZES</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-6">
                      Test your knowledge with interactive quizzes across various technical domains. Track your progress and identify areas for improvement.
                    </p>
                    <div className="absolute bottom-3 right-3">
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Activity Track Management Card */}
                  <div className="relative bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-5 cursor-pointer">
                    <div className="mb-4">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 8h10M7 12h10M7 16h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white uppercase mb-3">ACTIVITY TRACK MANAGEMENT</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-6">
                      Organize and manage your learning journey with customizable activity tracks. Set goals, monitor progress, and stay on schedule.
                    </p>
                    <div className="absolute bottom-3 right-3">
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Q&A Content Section */}
              <div className="space-y-3 mt-8 pt-8">
                <h1 className="text-4xl font-normal tracking-tight mb-8">
                  {selectedTopic
                    ? mainTopics.find(topic => topic.id === selectedTopic)?.label || 'Selected Topic'
                    : 'Status'}
                </h1>

                {/* Display Q&A content based on selected topic/category */}
                {selectedCategory && categoryDetails ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold mb-4">{categoryDetails.label}</h2>

                    {/* Display Q&A items */}
                    {categoryDetails.subtopics && Object.entries(categoryDetails.subtopics).map(([itemId, item]: [string, any], index) => (
                      <div key={itemId} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-medium mb-4">{item.label}</h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Q{index + 1}</span>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-700 dark:text-gray-300">
                            {item.content || "This question doesn't have content yet. Check back later for updates."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedTopic ? (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      Please select a category from the navigation tree to view Q&A content.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Activity Progress and Chart in the same row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <ActivityProgress
                          questionsCompleted={24}
                          totalQuestions={120}
                          timeSpent={8.5}
                          domainsSolved={3}
                          totalDomains={5}
                        />
                      </div>
                      <div>
                        <ProgressChart />
                      </div>
                    </div>

                    {/* No topics displayed here as requested */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}