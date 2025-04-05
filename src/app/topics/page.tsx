"use client";

import { useState, useEffect } from 'react';
import { useTopicData } from '../components/TopicDataProvider';
import TopicDataService from '@/services/TopicDataService';
import { TopicItem } from '@/utils/markdownParser';
import ActivityProgress from '../components/ActivityProgress';
import ProgressChart from '../components/ProgressChart';
import TopicCategoryGrid from '../components/TopicCategoryGrid';

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

export default function TopicsPage() {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
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

  // Function to close the topic tree and reset selections
  const resetSelections = () => {
    setSelectedTopic(null);
    setSelectedCategory(null);
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (categoryId === selectedCategory) {
      setSelectedCategory(null);
      setCategoryDetails(null);
      return;
    }

    setSelectedCategory(categoryId);
    await loadCategoryDetails(categoryId);
  };

  const loadCategoryDetails = async (categoryId: string) => {
    if (!selectedTopic) return;

    setLoadingCategoryDetails(true);
    try {
      console.log(`Loading details for category ${categoryId} in topic ${selectedTopic}`);
      const data = await TopicDataService.getCategoryDetails(selectedTopic, categoryId);

      if (!data) {
        console.warn(`No details available for category ${categoryId}`);
        // Set a null value but in a controlled way
        setCategoryDetails(null);
      } else {
        console.log(`Successfully loaded details for category ${categoryId}`);
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

  const handleSearchIconClick = () => {
    setShowSearchModal(true);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
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
    const categoryLabel = topicCategories.find(cat => cat.id === categoryId)?.label || 'Selected Category';

    // Use the categoryDetails if available, otherwise fallback to topicData
    if (categoryDetails && categoryDetails.subtopics) {
      // Count the actual subtopics
      const hasRealSubtopics = Object.keys(categoryDetails.subtopics).length > 0;

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
      } else {
        // No subtopics but we have a category label - show the empty state
        return (
          <div className="w-full animate-fadeIn">
            <h2 className="text-xl font-bold uppercase mb-6">{categoryLabel}</h2>
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-center text-gray-500 dark:text-gray-400">
                No content available for this category yet.
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
      <div className="w-full"> {/* Padding is handled by the spacer in MainNavigation */}
        {/* Main content area */}
        <div className={`transition-opacity duration-300 ${showSearchModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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

              <button
                onClick={handleSearchIconClick}
                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Content area */}
            <div className="p-6">
              {selectedTopic ? (
                // Show improved topic tree when a topic is selected
                <div className="mb-12">
                  {selectedCategory && (
                    <div className="flex items-center gap-4 mb-6">
                      <button
                        onClick={handleBackToMainCategories}
                        className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Categories
                      </button>
                    </div>
                  )}

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
                // Show metadata grid when no topic is selected
                <div className="grid grid-cols-4 gap-10 mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">TYPE</h3>
                    <div className="space-y-1">
                      <p>Technical</p>
                      <p>Behavioral</p>
                      <p>System Design</p>
                      <p>Coding</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">DIFFICULTY</h3>
                    <div className="space-y-1">
                      <p>Easy</p>
                      <p>Medium</p>
                      <p>Hard</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">FORMAT</h3>
                    <div className="space-y-1">
                      <p>Written</p>
                      <p>Live Coding</p>
                      <p>Whiteboard</p>
                      <p>Take-Home</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">COMPANIES</h3>
                    <div className="space-y-1">
                      <p>FAANG</p>
                      <p>Startups</p>
                      <p>Finance</p>
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

        {/* Search modal - now only covers the navigation area */}
        {showSearchModal && (
          <div className="fixed top-0 left-0 right-0 bg-white dark:bg-black z-50 border-b border-gray-200 dark:border-gray-800">
            {/* Search header */}
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              <div className="p-4 flex items-center text-gray-700 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="flex-1 py-4 px-2 text-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 bg-white dark:bg-black focus:outline-none"
                placeholder={selectedTopic
                  ? `search in ${mainTopics.find(topic => topic.id === selectedTopic)?.label || 'selected topic'}...`
                  : "search topics..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
              />
              <button
                onClick={closeSearchModal}
                className="p-4 flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Recent searches */}
            <div className="grid grid-cols-5 gap-2 p-4 bg-gray-100 dark:bg-gray-900">
              {[
                { term: 'sparkling water', time: '27min ago', location: 'London' },
                { term: 'meat golden', time: '28min ago', location: 'London' },
                { term: 'tapenade', time: '41min ago', location: 'London' },
                { term: 'simply sauces', time: '31min ago', location: 'London' },
                { term: 'steamed buns', time: '11min ago', location: 'London' }
              ].map((search, index) => (
                <div key={index} className="p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{search.time}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">in {search.location}</div>
                  <div className="mt-2 text-sm font-medium dark:text-gray-300">{search.term}</div>
                </div>
              ))}
            </div>

            {/* Categories section */}
            <div className="p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">categories</div>

              {/* Popular categories */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">popular</div>
                <div className="flex flex-wrap gap-2">
                  {['turkish', 'meat', 'european', 'asian', 'chinese', 'mediterranean', 'thai', 'german', 'south american', 'argentinian', 'filipino', 'italian'].map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Other categories */}
              <div className="flex flex-wrap gap-2">
                {['coffee and tea', 'alcohol', 'dairy', 'baked goods', 'general', 'specialty', 'seafood', 'produce', 'beverages', 'meat', 'supplies', 'french'].map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}