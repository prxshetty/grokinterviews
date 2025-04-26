"use client";

import { useState, useEffect } from 'react';
import { useTopicData, TopicCategoryGrid, QuestionWithAnswer } from '../components';
import ProgressBar from '../components/ui/ProgressBar';
import ProgressSaver from '../components/progress/ProgressSaver';
import { motion } from 'framer-motion';
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
  subtopicId?: number;
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
    // Removed setExpandedQuestions({});

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
                content: '',
                subtopicId: topic.id // Add the subtopicId for progress tracking
              };
              return acc;
            }, {})
          });

          // We'll fetch progress data in a batch later to avoid multiple API calls
          // This will be handled by the useEffect that runs when categoryDetails changes
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

        // We'll fetch progress data later in a batch to avoid multiple API calls

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
                  const processedQuestions = (category.questions || []).map((q: any): QuestionType => ({
                    id: q.id,
                    question_text: q.question_text || 'Question text not available',
                    answer_text: q.answer_text || '', // Keep original answer if exists
                    difficulty: q.difficulty || 'beginner',
                    keywords: q.keywords || [],
                    category_id: q.category_id
                  }));

                  formattedDetails.subtopics[subtopicId] = {
                    id: subtopicId,
                    label: category.name,
                    content: category.description || '',
                    categoryId: category.id,
                    questions: processedQuestions, // Pass the processed questions
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
  };

  // Load categories when selected topic changes
  useEffect(() => {
    if (selectedTopic) {
      loadTopicCategories(selectedTopic);

      // Preload subtopic progress data for this domain
      preloadSubtopicProgressForDomain(selectedTopic);
    }
  }, [selectedTopic]);

  // Function to preload subtopic progress data for a domain
  const preloadSubtopicProgressForDomain = async (domain: string) => {
    console.log(`Preloading subtopic progress data for domain: ${domain}`);

    try {
      // Determine what kind of request to make based on the current state
      let requestParams = '';

      if (selectedCategory) {
        // If a category is selected, try to get its section name
        if (categoryDetails && categoryDetails.label) {
          console.log(`Using section name from selected category: ${categoryDetails.label}`);
          requestParams = `&section=${encodeURIComponent(categoryDetails.label)}`;
        }
      } else if (selectedTopic) {
        // If only a topic is selected (domain like 'ml', 'ai'), get only main topics
        console.log(`Using domain-level request for ${domain}`);
        requestParams = `&mainTopicsOnly=true`;
      }

      // Use the optimized endpoint to fetch progress for subtopics
      const response = await fetch(`/api/user/progress/domain-subtopics?domain=${domain}${requestParams}&_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch domain subtopics progress: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Received progress data for ${Object.keys(data.subtopics).length} subtopics in domain ${domain}`);

      // Update the subtopic progress state with the data from the API
      const newSubtopicProgress = {};

      // Check if data.subtopics exists and is an object
      if (data.subtopics && typeof data.subtopics === 'object') {
        Object.entries(data.subtopics).forEach(([subtopicId, progressData]: [string, any]) => {
          newSubtopicProgress[subtopicId] = {
            progress: progressData.completionPercentage || 0,
            completed: progressData.questionsCompleted || 0,
            total: progressData.totalQuestions || 0,
            categoriesCompleted: progressData.categoriesCompleted || 0,
            totalCategories: progressData.totalCategories || 0
          };
        });
      } else {
        console.log('No subtopics progress data found in API response');
      }

      // Update the state with all subtopic progress data at once
      setSubtopicProgress(prev => ({
        ...prev,
        ...newSubtopicProgress
      }));

      console.log('Updated subtopic progress state with domain data');
    } catch (error) {
      console.error(`Error preloading subtopic progress for domain ${domain}:`, error);
    }
  };

  // Load progress data for all categories and subtopics when category details change
  useEffect(() => {
    const loadProgressData = async (forceRefresh: boolean = false) => {
      if (!categoryDetails || !categoryDetails.subtopics) return;

      // Get all category IDs from the subtopics
      const categoryIds: number[] = [];
      const subtopicIds: number[] = [];

      Object.values(categoryDetails.subtopics).forEach((item: any) => {
        if (item.categoryId) {
          categoryIds.push(item.categoryId);
        }
        if (item.subtopicId) {
          subtopicIds.push(item.subtopicId);
        }
      });

      // If we have a section name, fetch progress for all subtopics in this section at once
      if (categoryDetails.label) {
        const sectionName = categoryDetails.label;
        console.log(`Fetching progress for all subtopics in section ${sectionName} (batch request)`);

        try {
          const response = await fetch(`/api/user/progress/domain-subtopics?domain=${selectedTopic}&section=${encodeURIComponent(sectionName)}&_t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache' }
          });

          if (response.ok) {
            const data = await response.json();

            if (data.subtopics && typeof data.subtopics === 'object') {
              // Update progress for all subtopics in this section
              const newSubtopicProgress = {};

              Object.entries(data.subtopics).forEach(([id, progressData]: [string, any]) => {
                newSubtopicProgress[id] = {
                  progress: progressData.completionPercentage || 0,
                  completed: progressData.questionsCompleted || 0,
                  total: progressData.totalQuestions || 0,
                  categoriesCompleted: progressData.categoriesCompleted || 0,
                  totalCategories: progressData.totalCategories || 0
                };
              });

              // Update the subtopic progress state with all subtopics at once
              setSubtopicProgress(prev => ({
                ...prev,
                ...newSubtopicProgress
              }));

              console.log(`Updated progress for ${Object.keys(newSubtopicProgress).length} subtopics in section ${sectionName}`);

              // We've already fetched all subtopic progress, so we can skip individual fetches
              return;
            }
          }
        } catch (error) {
          console.error(`Error fetching batch progress for section ${sectionName}:`, error);
        }
      }

      // Fallback: Fetch progress for each category individually
      for (const categoryId of categoryIds) {
        await fetchCategoryProgress(categoryId, forceRefresh);
      }

      // Fallback: Fetch progress for each subtopic individually
      for (const subtopicId of subtopicIds) {
        await fetchSubtopicProgressData(subtopicId, forceRefresh);
      }
    };

    // Initial load of progress data
    loadProgressData();

    // Set up a refresh interval to periodically update progress
    const refreshInterval = setInterval(() => {
      loadProgressData(true); // Force refresh every interval
    }, 60000); // Refresh every 60 seconds (reduced frequency to minimize API calls)

    return () => {
      clearInterval(refreshInterval);
    };
  }, [categoryDetails]);

  // Initialize cursor position when component mounts or selectedTopic changes
  useEffect(() => {
    if (selectedTopic) {
      // Initialize cursor position
      setTimeout(() => {
        const activeTopicElement = document.querySelector(`[data-topic="${selectedTopic}"]`) as HTMLElement;
        if (activeTopicElement) {
          const cursor = document.querySelector('.nav-cursor') as HTMLElement;
          if (cursor) {
            cursor.style.width = `${activeTopicElement.getBoundingClientRect().width}px`;
            cursor.style.left = `${activeTopicElement.offsetLeft}px`;
            cursor.style.opacity = '1';
          }
        }
      }, 100);
    }
  }, [selectedTopic]);



  // State to track progress for each category and subtopic
  const [categoryProgress, setCategoryProgress] = useState<Record<string, { progress: number, completed: number, total: number }>>({});
  const [subtopicProgress, setSubtopicProgress] = useState<Record<string, { progress: number, completed: number, total: number, categoriesCompleted: number, totalCategories: number }>>({});

  // Function to fetch progress for a category
  const fetchCategoryProgress = async (categoryId: number, forceRefresh: boolean = false) => {
    try {
      // Add cache-busting parameter if forceRefresh is true
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
      const response = await fetch(`/api/user/progress/category?categoryId=${categoryId}${cacheBuster}`, {
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch category progress data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Fetched progress for category ${categoryId}:`, data);

      const progressData = {
        progress: data.completionPercentage || 0,
        completed: data.questionsCompleted || 0,
        total: data.totalQuestions || 0
      };

      // Update the category progress state
      setCategoryProgress(prev => ({
        ...prev,
        [categoryId]: progressData
      }));

      return progressData;
    } catch (error) {
      console.error(`Failed to fetch progress for category ${categoryId}:`, error);
      return { progress: 0, completed: 0, total: 0 };
    }
  };

  // Function to fetch progress for a subtopic
  const fetchSubtopicProgressData = async (subtopicId: number | string, forceRefresh: boolean = false) => {
    // Handle string IDs (like 'topic-123')
    let querySubtopicId = subtopicId;
    if (typeof subtopicId === 'string' && subtopicId.startsWith('topic-')) {
      querySubtopicId = subtopicId.replace('topic-', '');
      console.log(`Extracted numeric ID ${querySubtopicId} from ${subtopicId} for progress query`);
    }
    try {
      // Add cache-busting parameter if forceRefresh is true
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';

      // First, try to get the section name for this subtopic
      let sectionName = null;

      // Try to get the section name for this subtopic from the database
      try {
        const sectionResponse = await fetch(`/api/topics/topic-details?topicId=${querySubtopicId}`);
        if (sectionResponse.ok) {
          const sectionData = await sectionResponse.json();
          if (sectionData.topic && sectionData.topic.section_name) {
            sectionName = sectionData.topic.section_name;
            console.log(`Found section name for subtopic ${querySubtopicId}: ${sectionName}`);
          }
        }
      } catch (err) {
        console.error(`Error getting section name for subtopic ${querySubtopicId}:`, err);
      }

      // If we couldn't get the section name from the database, try from category details
      if (!sectionName && categoryDetails && categoryDetails.label) {
        sectionName = categoryDetails.label;
        console.log(`Using section name from category details: ${sectionName}`);
      }

      // If we have a section name, fetch progress for all subtopics in this section
      // But only if we're forcing a refresh or if this is a specific request for a single subtopic
      if (sectionName && (forceRefresh || typeof subtopicId === 'number')) {
        console.log(`Fetching progress for all subtopics in section ${sectionName}`);
        const sectionResponse = await fetch(`/api/user/progress/domain-subtopics?domain=${selectedTopic}&section=${encodeURIComponent(sectionName)}${cacheBuster}`, {
          headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
        });

        if (sectionResponse.ok) {
          const sectionData = await sectionResponse.json();
          console.log(`Fetched progress for all subtopics in section ${sectionName}`);

          if (sectionData.subtopics && typeof sectionData.subtopics === 'object') {
            // Update progress for all subtopics in this section
            const newSubtopicProgress = {};

            Object.entries(sectionData.subtopics).forEach(([id, progressData]: [string, any]) => {
              newSubtopicProgress[id] = {
                progress: progressData.completionPercentage || 0,
                completed: progressData.questionsCompleted || 0,
                total: progressData.totalQuestions || 0,
                categoriesCompleted: progressData.categoriesCompleted || 0,
                totalCategories: progressData.totalCategories || 0
              };
            });

            // Update the subtopic progress state with all subtopics at once
            setSubtopicProgress(prev => ({
              ...prev,
              ...newSubtopicProgress
            }));

            // Return the progress data for the requested subtopic
            if (sectionData.subtopics[subtopicId]) {
              return {
                progress: sectionData.subtopics[subtopicId].completionPercentage || 0,
                completed: sectionData.subtopics[subtopicId].questionsCompleted || 0,
                total: sectionData.subtopics[subtopicId].totalQuestions || 0,
                categoriesCompleted: sectionData.subtopics[subtopicId].categoriesCompleted || 0,
                totalCategories: sectionData.subtopics[subtopicId].totalCategories || 0
              };
            }
          }
        }
      }

      // Fallback to the individual subtopic endpoint if section approach fails
      const response = await fetch(`/api/user/progress/subtopic-progress?subtopicId=${querySubtopicId}${cacheBuster}`, {
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch subtopic progress data: ${response.status}`, errorText);
        throw new Error(`Failed to fetch subtopic progress data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Fetched progress for subtopic ${subtopicId}:`, data);

      const progressData = {
        progress: data.completionPercentage || 0,
        completed: data.questionsCompleted || 0,
        total: data.totalQuestions || 0,
        categoriesCompleted: data.categoriesCompleted || 0,
        totalCategories: data.totalCategories || 0
      };

      // Update the subtopic progress state
      setSubtopicProgress(prev => ({
        ...prev,
        [subtopicId]: progressData
      }));

      return progressData;
    } catch (error) {
      console.error(`Failed to fetch progress for subtopic ${subtopicId}:`, error);
      return { progress: 0, completed: 0, total: 0, categoriesCompleted: 0, totalCategories: 0 };
    }
  };

  // Function to update progress for a specific category and its parent subtopic
  const updateCategoryProgress = async (categoryId: number) => {
    console.log(`Updating progress for category ${categoryId}`);

    // Update category progress with force refresh
    await fetchCategoryProgress(categoryId, true);

    // Find the subtopic that contains this category
    if (categoryDetails && categoryDetails.subtopics) {
      // First, find which subtopic this category belongs to
      let parentSubtopicId: number | null = null;

      // Look through all subtopics to find the one containing this category
      Object.values(categoryDetails.subtopics).forEach((item: any) => {
        if (item.categoryId === categoryId) {
          console.log(`Found category ${categoryId} in subtopics`);
          if (item.subtopicId) {
            parentSubtopicId = item.subtopicId;
          }
        }
      });

      // If we found a parent subtopic, update its progress
      if (parentSubtopicId) {
        console.log(`Updating progress for parent subtopic ${parentSubtopicId}`);
        await fetchSubtopicProgressData(parentSubtopicId, true); // Force refresh
      } else {
        console.log(`No parent subtopic found for category ${categoryId}`);

        // If we couldn't find a specific parent, update all subtopics
        const subtopicIds = new Set<number>();
        Object.values(categoryDetails.subtopics).forEach((item: any) => {
          if (item.subtopicId) {
            subtopicIds.add(item.subtopicId);
          }
        });

        // Update progress for each subtopic with force refresh
        for (const subtopicId of subtopicIds) {
          await fetchSubtopicProgressData(subtopicId, true);
        }
      }
    }
  };

  // Listen for question completion events and subtopic progress updates
  useEffect(() => {
    const handleQuestionCompleted = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Question completed event detected:', customEvent.detail);

      // If we have a category ID, update its progress
      if (customEvent.detail?.categoryId) {
        const categoryId = customEvent.detail.categoryId;

        // Add a small delay to ensure the database has been updated
        setTimeout(async () => {
          console.log(`Updating progress for category ${categoryId} after delay`);
          await updateCategoryProgress(categoryId);

          // After updating the specific category, refresh all progress data
          setTimeout(async () => {
            if (categoryDetails && categoryDetails.subtopics) {
              console.log('Refreshing all progress data');
              // Get all category IDs from the subtopics
              const categoryIds: number[] = [];
              const subtopicIds: number[] = [];

              Object.values(categoryDetails.subtopics).forEach((item: any) => {
                if (item.categoryId) {
                  categoryIds.push(item.categoryId);
                }
                if (item.subtopicId) {
                  subtopicIds.push(item.subtopicId);
                }
              });

              // Fetch progress for each category
              for (const catId of categoryIds) {
                await fetchCategoryProgress(catId, true);
              }

              // Fetch progress for each subtopic
              for (const subtopicId of subtopicIds) {
                await fetchSubtopicProgressData(subtopicId, true);
              }
            }
          }, 1000);
        }, 500);
      }
    };

    // Handle subtopic progress updates directly
    const handleSubtopicProgressUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Subtopic progress updated event detected:', customEvent.detail);

      if (customEvent.detail?.subtopicId && customEvent.detail?.progress) {
        const { subtopicId, progress } = customEvent.detail;

        // Update the subtopic progress state directly with the data from the event
        setSubtopicProgress(prev => ({
          ...prev,
          [subtopicId]: {
            progress: progress.completionPercentage || 0,
            completed: progress.questionsCompleted || 0,
            total: progress.totalQuestions || 0,
            categoriesCompleted: progress.categoriesCompleted || 0,
            totalCategories: progress.totalCategories || 0
          }
        }));

        console.log(`Updated subtopic ${subtopicId} progress directly from event`);
      }
    };

    // Handle domain subtopics progress updates
    const handleDomainSubtopicsProgressUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Domain subtopics progress updated event detected:', customEvent.detail);

      if (customEvent.detail?.domain && customEvent.detail?.subtopics) {
        const { domain, subtopics, section } = customEvent.detail;

        // Update the subtopic progress state with all subtopics at once
        const newSubtopicProgress = {};

        // Check if subtopics exists and is an object
        if (subtopics && typeof subtopics === 'object') {
          console.log(`Processing progress data for ${Object.keys(subtopics).length} subtopics${section ? ` in section ${section}` : ''}`);

          // Log the first few subtopics for debugging
          const subtopicEntries = Object.entries(subtopics);
          if (subtopicEntries.length > 0) {
            console.log('Sample subtopic progress data:', subtopicEntries.slice(0, 3).map(([id, data]) => {
              return {
                id,
                name: (data as any).name,
                section: (data as any).section_name,
                progress: (data as any).completionPercentage
              };
            }));
          }

          Object.entries(subtopics).forEach(([subtopicId, progressData]: [string, any]) => {
            newSubtopicProgress[subtopicId] = {
              progress: progressData.completionPercentage || 0,
              completed: progressData.questionsCompleted || 0,
              total: progressData.totalQuestions || 0,
              categoriesCompleted: progressData.categoriesCompleted || 0,
              totalCategories: progressData.totalCategories || 0
            };
          });
        } else {
          console.log('No subtopics progress data found in event');
        }

        // Update the state with all subtopic progress data at once
        setSubtopicProgress(prev => ({
          ...prev,
          ...newSubtopicProgress
        }));

        console.log(`Updated progress for ${Object.keys(newSubtopicProgress).length} subtopics in domain ${domain}`);
      }
    };

    // Add event listeners
    window.addEventListener('questionCompleted', handleQuestionCompleted);
    window.addEventListener('subtopicProgressUpdated', handleSubtopicProgressUpdated);
    window.addEventListener('domainSubtopicsProgressUpdated', handleDomainSubtopicsProgressUpdated);

    return () => {
      // Remove event listeners when component unmounts
      window.removeEventListener('questionCompleted', handleQuestionCompleted);
      window.removeEventListener('subtopicProgressUpdated', handleSubtopicProgressUpdated);
      window.removeEventListener('domainSubtopicsProgressUpdated', handleDomainSubtopicsProgressUpdated);
    };
  }, [categoryDetails]);

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
                          <div className={`flex flex-col py-4 ${isTopic ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} transition-colors`}>
                            <div className="flex items-center">
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
                            {/* Progress bar */}
                            <div className="ml-12 mr-8 mt-2">
                              <ProgressBar
                                progress={(() => {
                                  // For debugging
                                  const itemId = typedListItem.id || 'no-id';
                                  const itemLabel = typedListItem.label || 'no-label';
                                  const categoryId = typedListItem.categoryId;
                                  const subtopicId = typedListItem.subtopicId;
                                  const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                                  console.log(`Progress calculation for item: ${itemLabel} (${itemId})`, {
                                    categoryId,
                                    subtopicId,
                                    topicId,
                                    hasProgress: topicId ? !!subtopicProgress[topicId] : false
                                  });

                                  // Category progress takes precedence
                                  if (categoryId && categoryProgress[categoryId]) {
                                    return categoryProgress[categoryId].progress;
                                  }

                                  // Then check for topic ID (from topic-XXX format)
                                  if (topicId && subtopicProgress[topicId]) {
                                    return subtopicProgress[topicId].progress;
                                  }

                                  // Then check for subtopic ID
                                  if (subtopicId && subtopicProgress[subtopicId]) {
                                    return subtopicProgress[subtopicId].progress;
                                  }

                                  // Default to 0
                                  return 0;
                                })()}
                                completed={(() => {
                                  const categoryId = typedListItem.categoryId;
                                  const subtopicId = typedListItem.subtopicId;
                                  const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                                  // Category progress takes precedence
                                  if (categoryId && categoryProgress[categoryId]) {
                                    return categoryProgress[categoryId].completed;
                                  }

                                  // Then check for topic ID (from topic-XXX format)
                                  if (topicId && subtopicProgress[topicId]) {
                                    return subtopicProgress[topicId].completed;
                                  }

                                  // Then check for subtopic ID
                                  if (subtopicId && subtopicProgress[subtopicId]) {
                                    return subtopicProgress[subtopicId].completed;
                                  }

                                  // Default to 0
                                  return 0;
                                })()}
                                total={(() => {
                                  const categoryId = typedListItem.categoryId;
                                  const subtopicId = typedListItem.subtopicId;
                                  const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                                  // Category progress takes precedence
                                  if (categoryId && categoryProgress[categoryId]) {
                                    return categoryProgress[categoryId].total;
                                  }

                                  // Then check for topic ID (from topic-XXX format)
                                  if (topicId && subtopicProgress[topicId]) {
                                    return subtopicProgress[topicId].total;
                                  }

                                  // Then check for subtopic ID
                                  if (subtopicId && subtopicProgress[subtopicId]) {
                                    return subtopicProgress[subtopicId].total;
                                  }

                                  // Default to 0
                                  return 0;
                                })()}
                                height="md"
                                showText={false}
                              />
                            </div>
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
                          <div className={`flex flex-col py-4 ${isTopic ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} transition-colors`}>
                            <div className="flex items-center">
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
                            {/* Progress bar */}
                            <div className="ml-12 mr-8 mt-2">
                              <ProgressBar
                                progress={(() => {
                                  // For debugging
                                  const itemId = typedListItem.id || 'no-id';
                                  const itemLabel = typedListItem.label || 'no-label';
                                  const categoryId = typedListItem.categoryId;
                                  const subtopicId = typedListItem.subtopicId;
                                  const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                                  // Category progress takes precedence
                                  if (categoryId && categoryProgress[categoryId]) {
                                    return categoryProgress[categoryId].progress;
                                  }

                                  // Then check for topic ID (from topic-XXX format)
                                  if (topicId && subtopicProgress[topicId]) {
                                    return subtopicProgress[topicId].progress;
                                  }

                                  // Then check for subtopic ID
                                  if (subtopicId && subtopicProgress[subtopicId]) {
                                    return subtopicProgress[subtopicId].progress;
                                  }

                                  // Default to 0
                                  return 0;
                                })()}
                                completed={(() => {
                                  const categoryId = typedListItem.categoryId;
                                  const subtopicId = typedListItem.subtopicId;
                                  const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                                  // Category progress takes precedence
                                  if (categoryId && categoryProgress[categoryId]) {
                                    return categoryProgress[categoryId].completed;
                                  }

                                  // Then check for topic ID (from topic-XXX format)
                                  if (topicId && subtopicProgress[topicId]) {
                                    return subtopicProgress[topicId].completed;
                                  }

                                  // Then check for subtopic ID
                                  if (subtopicId && subtopicProgress[subtopicId]) {
                                    return subtopicProgress[subtopicId].completed;
                                  }

                                  // Default to 0
                                  return 0;
                                })()}
                                total={(() => {
                                  const categoryId = typedListItem.categoryId;
                                  const subtopicId = typedListItem.subtopicId;
                                  const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                                  // Category progress takes precedence
                                  if (categoryId && categoryProgress[categoryId]) {
                                    return categoryProgress[categoryId].total;
                                  }

                                  // Then check for topic ID (from topic-XXX format)
                                  if (topicId && subtopicProgress[topicId]) {
                                    return subtopicProgress[topicId].total;
                                  }

                                  // Then check for subtopic ID
                                  if (subtopicId && subtopicProgress[subtopicId]) {
                                    return subtopicProgress[subtopicId].total;
                                  }

                                  // Default to 0
                                  return 0;
                                })()}
                                height="md"
                                showText={false}
                              />
                            </div>
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

                  return (
                    <div key={listId} className="mb-8">
                      <div className="flex flex-col py-4 bg-gray-50 dark:bg-gray-800 mb-4 rounded-t-lg">
                        <div className="flex items-center">
                          <div className="w-16 text-gray-400 text-2xl font-light pl-4">{formattedNumber}</div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{typedListItem.label}</h3>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="ml-16 mr-8 mt-2">
                          <ProgressBar
                            progress={(() => {
                              // For debugging
                              const itemId = typedListItem.id || 'no-id';
                              const itemLabel = typedListItem.label || 'no-label';
                              const categoryId = typedListItem.categoryId;
                              const subtopicId = typedListItem.subtopicId;
                              const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                              // Category progress takes precedence
                              if (categoryId && categoryProgress[categoryId]) {
                                return categoryProgress[categoryId].progress;
                              }

                              // Then check for topic ID (from topic-XXX format)
                              if (topicId && subtopicProgress[topicId]) {
                                return subtopicProgress[topicId].progress;
                              }

                              // Then check for subtopic ID
                              if (subtopicId && subtopicProgress[subtopicId]) {
                                return subtopicProgress[subtopicId].progress;
                              }

                              // Default to 0
                              return 0;
                            })()}
                            completed={(() => {
                              const categoryId = typedListItem.categoryId;
                              const subtopicId = typedListItem.subtopicId;
                              const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                              // Category progress takes precedence
                              if (categoryId && categoryProgress[categoryId]) {
                                return categoryProgress[categoryId].completed;
                              }

                              // Then check for topic ID (from topic-XXX format)
                              if (topicId && subtopicProgress[topicId]) {
                                return subtopicProgress[topicId].completed;
                              }

                              // Then check for subtopic ID
                              if (subtopicId && subtopicProgress[subtopicId]) {
                                return subtopicProgress[subtopicId].completed;
                              }

                              // Default to 0
                              return 0;
                            })()}
                            total={(() => {
                              const categoryId = typedListItem.categoryId;
                              const subtopicId = typedListItem.subtopicId;
                              const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                              // Category progress takes precedence
                              if (categoryId && categoryProgress[categoryId]) {
                                return categoryProgress[categoryId].total;
                              }

                              // Then check for topic ID (from topic-XXX format)
                              if (topicId && subtopicProgress[topicId]) {
                                return subtopicProgress[topicId].total;
                              }

                              // Then check for subtopic ID
                              if (subtopicId && subtopicProgress[subtopicId]) {
                                return subtopicProgress[subtopicId].total;
                              }

                              // Default to 0
                              return 0;
                            })()}
                            height="md"
                            showText={false}
                          />
                        </div>
                      </div>

                      {/* Render QuestionWithAnswer for each question */}
                      <div className="pl-8 pr-8 pb-4 space-y-4">
                        {typedListItem.questions && typedListItem.questions.length > 0 ? (
                          [...typedListItem.questions]
                            .sort((a, b) => {
                              const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                              const aDifficulty = a.difficulty?.toLowerCase() || 'unspecified';
                              const bDifficulty = b.difficulty?.toLowerCase() || 'unspecified';
                              return (difficultyOrder[aDifficulty as keyof typeof difficultyOrder] || 4) -
                                     (difficultyOrder[bDifficulty as keyof typeof difficultyOrder] || 4);
                            })
                            .map((question: QuestionType, qIndex: number) => (
                              <QuestionWithAnswer
                                key={question.id || qIndex}
                                question={question}
                                questionIndex={qIndex}
                              />
                            ))
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
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
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Content for this category is being prepared.
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleBackToMainCategories}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
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
          {/* Render subtopics in the new format */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {listItems.map(([listId, listItem], listIndex) => {
              const typedListItem = listItem as TopicItem;
              const itemNumber = listIndex + 1;
              const formattedNumber = String(itemNumber).padStart(2, '0');

              return (
                <div key={listId} className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col py-4">
                    <div className="flex items-center">
                      <div className="w-16 text-gray-400 text-2xl font-light">{formattedNumber}</div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{typedListItem.label}</h3>
                      </div>
                      <div className="w-8 text-center text-gray-400">+</div>
                    </div>
                    {/* Progress bar */}
                    <div className="ml-16 mr-8 mt-2">
                      <ProgressBar
                        progress={(() => {
                          // For debugging
                          const itemId = typedListItem.id || 'no-id';
                          const itemLabel = typedListItem.label || 'no-label';
                          const categoryId = typedListItem.categoryId;
                          const subtopicId = typedListItem.subtopicId;
                          const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                          // Category progress takes precedence
                          if (categoryId && categoryProgress[categoryId]) {
                            return categoryProgress[categoryId].progress;
                          }

                          // Then check for topic ID (from topic-XXX format)
                          if (topicId && subtopicProgress[topicId]) {
                            return subtopicProgress[topicId].progress;
                          }

                          // Then check for subtopic ID
                          if (subtopicId && subtopicProgress[subtopicId]) {
                            return subtopicProgress[subtopicId].progress;
                          }

                          // Default to 0
                          return 0;
                        })()}
                        completed={(() => {
                          const categoryId = typedListItem.categoryId;
                          const subtopicId = typedListItem.subtopicId;
                          const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                          // Category progress takes precedence
                          if (categoryId && categoryProgress[categoryId]) {
                            return categoryProgress[categoryId].completed;
                          }

                          // Then check for topic ID (from topic-XXX format)
                          if (topicId && subtopicProgress[topicId]) {
                            return subtopicProgress[topicId].completed;
                          }

                          // Then check for subtopic ID
                          if (subtopicId && subtopicProgress[subtopicId]) {
                            return subtopicProgress[subtopicId].completed;
                          }

                          // Default to 0
                          return 0;
                        })()}
                        total={(() => {
                          const categoryId = typedListItem.categoryId;
                          const subtopicId = typedListItem.subtopicId;
                          const topicId = typedListItem.id?.startsWith('topic-') ? typedListItem.id.replace('topic-', '') : null;

                          // Category progress takes precedence
                          if (categoryId && categoryProgress[categoryId]) {
                            return categoryProgress[categoryId].total;
                          }

                          // Then check for topic ID (from topic-XXX format)
                          if (topicId && subtopicProgress[topicId]) {
                            return subtopicProgress[topicId].total;
                          }

                          // Then check for subtopic ID
                          if (subtopicId && subtopicProgress[subtopicId]) {
                            return subtopicProgress[subtopicId].total;
                          }

                          // Default to 0
                          return 0;
                        })()}
                        height="md"
                        showText={false}
                      />
                    </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Categories
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen pt-4">
      {/* Component to save progress when navigating away */}
      <ProgressSaver />
      <div className="w-full px-0">
        <div className="transition-opacity duration-300">
          <div className="p-0">
            {/* Navigation tabs */}
            <div className="flex justify-between items-center px-4 py-2">
              <div className="flex flex-1">
                <ul className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-0.5 overflow-x-auto"
                  onMouseLeave={() => {
                    // Reset cursor to active tab position when mouse leaves
                    const activeTabElement = document.querySelector(`[data-topic="${selectedTopic}"]`) as HTMLElement;
                    if (activeTabElement) {
                      const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                      if (cursor) {
                        cursor.style.width = `${activeTabElement.getBoundingClientRect().width}px`;
                        cursor.style.left = `${activeTabElement.offsetLeft}px`;
                        cursor.style.opacity = '1';
                      }
                    }
                  }}
                >
                  {/* Animated Background Cursor */}
                  <motion.div
                    className="nav-cursor absolute z-0 h-11 rounded-full bg-gray-100 dark:bg-gray-800"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                  {mainTopics.map((topic, index) => (
                    <li
                      key={topic.id}
                      data-topic={topic.id}
                      className="relative z-10 block cursor-pointer"
                      onMouseEnter={(e) => {
                        // Only apply hover effect if this isn't the active topic
                        if (selectedTopic !== topic.id) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                          if (cursor) {
                            cursor.style.width = `${rect.width}px`;
                            cursor.style.left = `${e.currentTarget.offsetLeft}px`;
                            cursor.style.opacity = '1';
                          }
                        }
                      }}
                    >
                      {index > 0 && (
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 absolute -left-0.5 top-1/2 transform -translate-y-1/2"></div>
                      )}
                      <motion.button
                        onClick={(e) => {
                          handleTopicClick(topic.id);
                          // Update cursor position immediately for smoother transition
                          const parentElement = e.currentTarget.parentElement as HTMLElement;
                          if (parentElement) {
                            const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                            if (cursor) {
                              cursor.style.width = `${parentElement.getBoundingClientRect().width}px`;
                              cursor.style.left = `${parentElement.offsetLeft}px`;
                              cursor.style.opacity = '1';
                            }
                          }
                        }}
                        className={`px-4 py-3 text-sm font-small uppercase block whitespace-nowrap ${
                          selectedTopic === topic.id
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {topic.label}
                      </motion.button>
                    </li>
                  ))}
                </ul>
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Back
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
                {!selectedCategory && selectedTopic && (
                  <h1 className="text-4xl font-normal tracking-tight mb-8">
                    {mainTopics.find(topic => topic.id === selectedTopic)?.label || 'Selected Topic'}
                  </h1>
                )}
                {/* Debug info */}
                <div className="hidden">
                  <p>Selected Category: {selectedCategory}</p>
                  <p>Category Details Label: {categoryDetails?.label}</p>
                  <p>Topic Categories: {JSON.stringify(topicCategories.map(cat => ({ id: cat.id, label: cat.label })))}</p>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}