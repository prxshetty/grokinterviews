"use client";

import { useState, useEffect } from 'react';
import { useTopicData, TopicCategoryGrid, ActivityProgress, ProgressChart } from '../components';
import TopicDataService from '@/services/TopicDataService';
// Import types from database

// Define Question interface if not already defined
interface QuestionType {
  id: number;
  category_id: number;
  question_text: string;
  answer_text?: string;
  keywords?: string[];
  difficulty?: string;
  created_at?: string;
}

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
  questions?: QuestionType[];
  categoryId?: number;
  subtopics?: Record<string, TopicItem>;
  isGenerated?: boolean;
};

export default function TopicsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [topicCategories, setTopicCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState<any>(null);
  const [loadingCategoryDetails, setLoadingCategoryDetails] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

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
      // For the first level, we want to show section headers
      const sectionHeaders = await TopicDataService.getSectionHeaders(topicId);
      setTopicCategories(sectionHeaders);
    } catch (error) {
      console.error(`Error loading section headers for ${topicId}:`, error);
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

    // Reset expanded questions state when changing categories
    setExpandedQuestions({});

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
      // Ensure selectedTopic is not null
      const topicId = selectedTopic || 'ml';

      // Check if this is a section header ID (format: header-123)
      if (categoryId.startsWith('header-')) {
        console.log(`This is a section header: ${categoryId}`);

        // Extract the header number and get the section name
        const headerNumber = parseInt(categoryId.replace('header-', ''), 10);
        const response = await fetch(`/api/section-headers?domain=${topicId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch section headers: ${response.statusText}`);
        }

        const sectionHeaders = await response.json();
        const sectionHeader = sectionHeaders.find((header: any) => header.id === headerNumber);

        if (sectionHeader) {
          console.log(`Found section header: ${sectionHeader.name}`);

          // Get topics for this section
          const topics = await TopicDataService.getTopicsBySection(topicId, sectionHeader.name);

          // Create a category details object with the topics as subtopics
          setCategoryDetails({
            id: categoryId,
            label: sectionHeader.name,
            content: `Topics related to ${sectionHeader.name}`,
            subtopics: topics.reduce((acc: Record<string, any>, topic: CategoryItem, index: number) => {
              acc[`topic-${index}`] = {
                id: topic.id,
                label: topic.label,
                content: ''
              };
              return acc;
            }, {})
          });
        } else {
          console.warn(`Section header not found for ID ${headerNumber}`);
          setCategoryDetails({
            label: 'Section Header',
            content: 'Section header not found.'
          });
        }

        setLoadingCategoryDetails(false);
        return;
      }

      // Check if this is a topic ID (format: topic-123)
      if (categoryId.startsWith('topic-')) {
        console.log(`This is a topic: ${categoryId}`);

        // Extract the numeric ID from the topic-{id} format
        const numericId = categoryId.replace('topic-', '');
        console.log(`Extracted numeric ID: ${numericId}`);

        try {
          // Fetch topic details directly from the API
          console.log(`Fetching topic details from API: /api/topics/topic-details?topicId=${numericId}`);
          const response = await fetch(`/api/topics/topic-details?topicId=${numericId}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch topic details: ${response.statusText}`);
          }

          const details = await response.json();
          console.log(`Successfully loaded details for topic ${numericId}:`, details);
          console.log(`Topic has ${details.categories?.length || 0} categories`);

          // Format the result for the UI
          const formattedDetails: TopicItem = {
            id: categoryId,
            label: details.topic.name,
            content: `Details for ${details.topic.name}`,
            subtopics: {} as Record<string, TopicItem>
          };

          // Add each category as a subtopic
          if (formattedDetails.subtopics && details.categories) {
            if (details.categories.length === 0) {
              console.log(`No categories found for topic ${details.topic.name}`);

              // Add a placeholder subtopic for topics with no categories
              formattedDetails.subtopics['no-categories'] = {
                id: 'no-categories',
                label: 'Content Coming Soon',
                content: 'We are working on adding content for this topic. Please check back later.',
                questions: []
              };
            } else {
              details.categories.forEach((category: any) => {
                // Use the actual category ID from the API response
                const subtopicId = `category-${category.id}`;
                if (formattedDetails.subtopics) {
                  // Log the questions for debugging
                  console.log(`Category ${category.name} (ID: ${category.id}) has ${category.questions?.length || 0} questions`);

                  // Log the first question if available
                  if (category.questions && category.questions.length > 0) {
                    console.log(`First question: ${category.questions[0].question_text}`);
                  }

                  // Ensure questions are in the expected format
                  const processedQuestions = (category.questions || []).map((q: any) => ({
                    ...q,
                    question_text: q.question_text || 'Question text not available',
                    answer_text: q.answer_text || '',
                    difficulty: q.difficulty || 'beginner',
                    keywords: q.keywords || []
                  }));

                  formattedDetails.subtopics[subtopicId] = {
                    id: subtopicId,
                    label: category.name,
                    content: category.description || '',
                    categoryId: category.id,
                    questions: processedQuestions,
                    isGenerated: false // Don't mark any categories as generated
                  };

                  console.log(`Added category ${category.name} with ID ${category.id} and ${processedQuestions.length} questions`);
                }
              });
            }
          }

          setCategoryDetails(formattedDetails);
        } catch (error) {
          console.error(`Error fetching topic details for ${numericId}:`, error);
          setCategoryDetails({
            label: 'Topic',
            content: 'Topic details not found.'
          });
        }

        setLoadingCategoryDetails(false);
        return;
      }

      // For other category IDs, use the existing method
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
    setExpandedQuestions({});
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
          <p className="text-sm text-gray-500">Loading questions...</p>
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

      // If the category has subtopics, render them as questions
      if (hasRealSubtopics) {
        // Get the subtopics as an array of entries
        let listItems = Object.entries(categoryDetails.subtopics);

        // Check if this is a section header (format: header-123)
        const isSectionHeader = categoryId.startsWith('header-');

        return (
          <div className="w-full animate-fadeIn">
            {/* Render subtopics in the new format */}
            {isSectionHeader ? (
              // Two-column layout for section headers
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column - even indexed items (0, 2, 4, ...) */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {listItems
                    .filter((_, index) => index % 2 === 0)
                    .map(([listId, listItem], filteredIndex) => {
                      const typedListItem = listItem as TopicItem;
                      const itemNumber = filteredIndex * 2 + 1;
                      const formattedNumber = String(itemNumber).padStart(2, '0');

                      // Check if this is a topic that should be clickable
                      const isTopic = listId.startsWith('topic-');

                      return (
                        <div
                          key={listId}
                          className="border-b border-gray-200 dark:border-gray-700"
                          onClick={() => isTopic && handleCategorySelect(typedListItem.id || '')}
                        >
                          <div className={`flex items-center py-4 ${isTopic ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} transition-colors`}>
                            <div className="w-12 text-gray-400 text-xl font-light">{formattedNumber}</div>
                            <div className="flex-grow">
                              <h3 className="font-medium">{typedListItem.label}</h3>
                            </div>
                            {isTopic && (
                              <div className="w-8 text-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Right column - odd indexed items (1, 3, 5, ...) */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {listItems
                    .filter((_, index) => index % 2 === 1)
                    .map(([listId, listItem], filteredIndex) => {
                      const typedListItem = listItem as TopicItem;
                      const itemNumber = filteredIndex * 2 + 2;
                      const formattedNumber = String(itemNumber).padStart(2, '0');

                      // Check if this is a topic that should be clickable
                      const isTopic = listId.startsWith('topic-');

                      return (
                        <div
                          key={listId}
                          className="border-b border-gray-200 dark:border-gray-700"
                          onClick={() => isTopic && handleCategorySelect(typedListItem.id || '')}
                        >
                          <div className={`flex items-center py-4 ${isTopic ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} transition-colors`}>
                            <div className="w-12 text-gray-400 text-xl font-light">{formattedNumber}</div>
                            <div className="flex-grow">
                              <h3 className="font-medium">{typedListItem.label}</h3>
                            </div>
                            {isTopic && (
                              <div className="w-8 text-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              // Single column layout for regular categories
              <div className="border-t border-gray-200 dark:border-gray-700">
                {listItems.map(([listId, listItem], listIndex) => {
                  const typedListItem = listItem as TopicItem;
                  const itemNumber = listIndex + 1;
                  const formattedNumber = String(itemNumber).padStart(2, '0');

                  // Display questions for this category

                  return (
                    <div key={listId} className="mb-8">
                      <div className="flex items-center py-4 bg-gray-50 dark:bg-gray-800 mb-4 rounded-t-lg">
                        <div className="w-16 text-gray-400 text-2xl font-light pl-4">{formattedNumber}</div>
                        <div className="flex-grow">
                          <h3 className="font-medium">{typedListItem.label}</h3>
                        </div>
                      </div>

                      {/* Display questions sorted by difficulty with dropdown for answers */}
                      <div className="pl-8 pr-8 pb-4">
                        {typedListItem.questions && typedListItem.questions.length > 0 ? (
                          // Sort questions by difficulty: beginner first, then intermediate, then advanced
                          [...typedListItem.questions]
                            .sort((a, b) => {
                              const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                              const aDifficulty = a.difficulty?.toLowerCase() || 'unspecified';
                              const bDifficulty = b.difficulty?.toLowerCase() || 'unspecified';
                              return (difficultyOrder[aDifficulty as keyof typeof difficultyOrder] || 4) -
                                     (difficultyOrder[bDifficulty as keyof typeof difficultyOrder] || 4);
                            })
                            .map((question: QuestionType, qIndex: number) => {
                              // Create a unique ID for the dropdown state
                              const questionId = `question-${question.id || qIndex}`;
                              return (
                                <div key={question.id || qIndex} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {question.question_text || 'Question text not available'}
                                    </h4>
                                    <div className="flex items-center">
                                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Q{qIndex + 1}</span>
                                      <button
                                        onClick={() => {
                                          // Toggle the expanded state for this question
                                          setExpandedQuestions(prev => ({
                                            ...prev,
                                            [questionId]: !prev[questionId]
                                          }));
                                        }}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          {expandedQuestions[questionId] ? (
                                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                          ) : (
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                          )}
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Difficulty and keywords */}
                                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 mr-2">
                                      {question.difficulty || 'unspecified'} difficulty
                                    </span>
                                    {question.keywords && question.keywords.length > 0 && (
                                      <span className="inline-block">
                                        Keywords: {Array.isArray(question.keywords) ? question.keywords.join(', ') : question.keywords}
                                      </span>
                                    )}
                                  </div>

                                  {/* Collapsible answer section */}
                                  {expandedQuestions[questionId] && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer:</h5>
                                      <div className="text-gray-700 dark:text-gray-300 text-sm">
                                        <p>{question.answer_text || 'This answer will be generated by AI when you select a model in your account settings.'}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            <p>No questions available for this category yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      } else {
        // No subtopics but we have a category label - show the empty state
        return (
          <div className="w-full animate-fadeIn">
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-center text-gray-500 dark:text-gray-400">
                {categoryId.startsWith('header-') ? 'Content for this section is being prepared. Please check back later.' : 'No content available for this category yet.'}
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleBackToMainCategories}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
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
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Content for this category is being prepared.
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleBackToMainCategories}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
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

                  {/* Removed duplicate back button */}

                  {/* Main topic categories */}
                  <div className="flex flex-wrap">
                    {loadingCategories ? (
                      <div className="w-full text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading categories...</p>
                      </div>
                    ) : (
                      // Always show the category grid for selection, but collapse it when a category is selected
                      <div className={`w-full ${selectedCategory ? 'mb-8' : ''}`}>
                        {selectedCategory === null ? (
                          // Show full grid when no category is selected
                          <TopicCategoryGrid
                            categories={topicCategories}
                            onSelectCategory={handleCategorySelect}
                            topicId={selectedTopic} // Pass the selected topic ID
                          />
                        ) : (
                          // Show only a minimalistic back button when a category is selected
                          <div className="mb-6">
                            <div className="flex items-center">
                              <button
                                onClick={handleBackToMainCategories}
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center mr-4"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <h1 className="text-xl font-normal tracking-tight">
                                {categoryDetails?.label || topicCategories.find(cat => cat.id === selectedCategory)?.label || 'Category'}
                              </h1>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Display questions below the category grid when a category is selected */}
                  {selectedCategory && !loadingCategories && (
                    <div className="w-full animate-fadeIn mt-4">
                      {/* Content based on selected category */}
                      {renderCategoryContent(selectedCategory)}
                    </div>
                  )}
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
                {!selectedCategory && (
                  <h1 className="text-4xl font-normal tracking-tight mb-8">
                    {selectedTopic
                      ? mainTopics.find(topic => topic.id === selectedTopic)?.label || 'Selected Topic'
                      : 'Status'}
                  </h1>
                )}
                {/* Debug info */}
                <div className="hidden">
                  <p>Selected Category: {selectedCategory}</p>
                  <p>Category Details Label: {categoryDetails?.label}</p>
                  <p>Topic Categories: {JSON.stringify(topicCategories.map(cat => ({ id: cat.id, label: cat.label })))}</p>
                </div>

                {/* Only show the status section when no topic or category is selected */}
                {!selectedTopic && !selectedCategory && (
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