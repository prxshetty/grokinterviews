'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  TopicCategoryGrid,
  CategoryDetailView,
  SidebarFilters,
  TopicDataProvider,
  ContentDisplay
} from '@/app/components/topics-ui';
import ProgressSaver from '@/app/components/utils/ProgressSaver';
import TopicDataService from '@/services/TopicDataService';
import { useTopicData } from '@/app/hooks';
import { getDomainKeywords } from '@/app/utils';
import { useFilterLogic } from '@/app/hooks/use-filter-logic.hook';

// Import types (assuming these are defined elsewhere or can be moved here)
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

interface ProgressData {
  progress: number;
  completed: number;
  total: number;
  subtopicsCompleted?: number;
  partiallyCompletedSubtopics?: number;
  totalSubtopics?: number;
}

// Props for the client component, including the domain passed from the server component
interface TopicPageClientProps {
  initialDomain: string;
}

export default function TopicPageClient({ initialDomain }: TopicPageClientProps) {
  const [domain, setDomain] = useState<string>(initialDomain);

  // Get domain from data attribute set by layout component
  // This useEffect might need adjustment depending on how domain is passed now
  useEffect(() => {
    // Get the domain from the data attribute set in the layout
    const domainElement = document.querySelector('[data-domain]');
    if (domainElement) {
      const domainValue = domainElement.getAttribute('data-domain');
      if (domainValue) {
        setDomain(domainValue);
      }
    }
  }, []);

  // URL parameters
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const questionIdParam = searchParams.get('questionId');

  // Use the new hook for filter logic
  const {
    selectedKeyword,
    selectedDifficulty,
    handleKeywordChange,
    handleDifficultyChange,
    clearKeywordFilter,
    clearDifficultyFilter
  } = useFilterLogic();

  // Initialize selectedTopic properly based on domain availability
  const [selectedTopic, setSelectedTopic] = useState<string | null>(() => {
    // Only set initial topic if domain is available and not 'topics'
    return (initialDomain && initialDomain !== 'topics') ? initialDomain : null;
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [topicCategories, setTopicCategories] = useState<CategoryItem[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<TopicItem | null>(null);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [loadingSections, setLoadingSections] = useState<boolean>(false);

  // Progress tracking states
  const [sectionProgressCache, setSectionProgressCache] = useState<Record<string, ProgressData>>({});
  const [sectionProgress, setSectionProgress] = useState<Record<string, ProgressData>>({});
  const [categoryProgress, setCategoryProgress] = useState<Record<string, ProgressData>>({});
  const [categoryProgressCache, setCategoryProgressCache] = useState<Record<string, ProgressData>>({});
  const [subtopicProgress, setSubtopicProgress] = useState<Record<string, {
    progress: number,
    completed: number,
    total: number,
    categoriesCompleted: number,
    totalCategories: number
  }>>({});

  // Keyword filtering states
  const [keywordQuestions, setKeywordQuestions] = useState<QuestionType[]>([]);
  const [loadingKeywordQuestions, setLoadingKeywordQuestions] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(pageParam ? parseInt(pageParam) : 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Difficulty filtering states
  const [difficultyQuestions, setDifficultyQuestions] = useState<QuestionType[]>([]);
  const [loadingDifficultyQuestions, setLoadingDifficultyQuestions] = useState(false);

  // State for highlighted question (from URL)
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<number | undefined>(
    questionIdParam ? parseInt(questionIdParam) : undefined
  );

  const { topicData } = useTopicData(); // This hook might need context setup

  const router = useRouter();
  const pathname = usePathname();

  // Update currentPage when pageParam changes (e.g., from hook resetting page on filter change)
  useEffect(() => {
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
  }, [pageParam]);

  // Fetch keyword questions when selectedKeyword or currentPage changes
  useEffect(() => {
    if (selectedKeyword && domain) {
      fetchKeywordQuestions(selectedKeyword, currentPage);
    } else {
      setKeywordQuestions([]); // Clear questions if no keyword
      // Optionally reset pagination if needed, though hook handles page reset in URL
    }
  }, [selectedKeyword, currentPage, domain]); // domain added as dependency

  // Fetch difficulty questions when selectedDifficulty or currentPage changes
  useEffect(() => {
    if (selectedDifficulty && domain) {
      fetchDifficultyQuestions(selectedDifficulty, currentPage);
    } else {
      setDifficultyQuestions([]); // Clear questions if no difficulty
    }
  }, [selectedDifficulty, currentPage, domain]); // domain added as dependency

  // Handle page change for pagination
  const handlePageChange = useCallback((newPage: number) => {
    // Don't do anything if we're already on this page
    if (newPage === currentPage) return;

    if (selectedKeyword && newPage >= 1 && newPage <= totalPages) {
      console.log(`Changing to page ${newPage} for keyword ${selectedKeyword}`);
      // Update URL with new page number for keyword search
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());

      // Build the new URL and navigate
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    } else if (selectedDifficulty && newPage >= 1 && newPage <= totalPages) {
      console.log(`Changing to page ${newPage} for difficulty ${selectedDifficulty}`);
      // Update URL with new page number for difficulty filter
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());

      // Build the new URL and navigate
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);

      // Fetch new page of difficulty filtered questions
      handleDifficultyChange(selectedDifficulty);
    }
  }, [currentPage, selectedKeyword, selectedDifficulty, totalPages, searchParams, pathname, router, handleDifficultyChange]);

  // Load details for a selected category
  const loadCategoryDetails = useCallback(async (categoryId: string) => {
    console.log('topics/page - loadCategoryDetails called with:', categoryId);
    console.log('topics/page - Current selectedTopic:', selectedTopic);

    setLoadingSections(true); // Set loading state for sections
    try {
      // Use the current selectedTopic without defaulting to 'ml'
      const topicId = selectedTopic;

      // If no topic is selected, we cannot proceed
      if (!topicId) {
        console.error('No topic selected, cannot load category details');
        setLoadingSections(false);
        return;
      }

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

        if (!sectionHeader) {
          throw new Error(`Could not find section header with ID ${headerNumber}`);
        }

        // Use the correct API endpoint - /api/topics/by-section instead of /api/section
        const sectionResponse = await fetch(`/api/topics/by-section?domain=${topicId}&sectionName=${encodeURIComponent(sectionHeader.name)}`);
        if (!sectionResponse.ok) {
          throw new Error(`Failed to fetch section: ${sectionResponse.statusText}`);
        }
        const topicsInSection = await sectionResponse.json();
        console.log('Topics in section:', topicsInSection);

        // Format the data to match the expected structure for CategoryDetails
        const sectionData = {
          label: sectionHeader.name,
          subtopics: topicsInSection.reduce((acc: Record<string, any>, topic: any) => {
            acc[`topic-${topic.id}`] = {
              id: `topic-${topic.id}`,
              label: topic.name,
              content: topic.description || ''
            };
            return acc;
          }, {})
        };

        setCategoryDetails(sectionData);
      } else {
        // This is a regular topic ID, fetch it directly
        const response = await fetch(`/api/topic-detail?id=${categoryId.replace('topic-', '')}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch topic details: ${response.statusText}`);
        }

        const topicDetail = await response.json();
        console.log('Topic details:', topicDetail);

        setCategoryDetails(topicDetail);
      }
    } catch (error) {
      console.error(`Error loading details for category ${categoryId}:`, error);
      setCategoryDetails(null);
    } finally {
      setLoadingSections(false);
    }
  }, [selectedTopic]);

  // Handle category selection
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    console.log('topics/page - handleCategorySelect called with:', categoryId);

    if (categoryId === selectedCategory) {
      console.log('topics/page - Same category selected, clearing selection');
      setSelectedCategory(null);
      setCategoryDetails(null);
      return;
    }

    console.log('topics/page - Setting selectedCategory to:', categoryId);
    setSelectedCategory(categoryId);

    await loadCategoryDetails(categoryId);
  }, [selectedCategory, loadCategoryDetails]);

  const fetchKeywordQuestions = useCallback(async (keyword: string, page: number = 1) => {
    if (!domain) return; // Ensure domain is available
    setLoadingKeywordQuestions(true);
    try {
      const response = await fetch(
        `/api/search?domain=${domain}&query=${encodeURIComponent(keyword)}&page=${page}`
      );
      if (!response.ok) throw new Error('Failed to fetch keyword questions');
      const data = await response.json();
      setKeywordQuestions(data.questions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalResults(data.pagination?.totalCount || 0);
      if (data.questions?.length === 0 && page > 1) {
        handlePageChange(1); // Corrected call
      }
    } catch (error) {
      console.error('Error fetching keyword questions:', error);
      setKeywordQuestions([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoadingKeywordQuestions(false);
    }
  }, [domain, handlePageChange]);

  const fetchDifficultyQuestions = useCallback(async (difficulty: string, page: number = 1) => {
    if (!domain) return; // Ensure domain is available
    setLoadingDifficultyQuestions(true);
    try {
      const response = await fetch(
        `/api/questions/difficulty?domain=${domain}&difficulty=${difficulty}&page=${page}`
      );
      if (!response.ok) throw new Error('Failed to fetch difficulty questions');
      const data = await response.json();
      setDifficultyQuestions(data.questions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalResults(data.pagination?.totalCount || 0);
      if (data.questions?.length === 0 && page > 1) {
         handlePageChange(1); // Corrected call
      }
    } catch (error) {
      console.error('Error fetching difficulty questions:', error);
      setDifficultyQuestions([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoadingDifficultyQuestions(false);
    }
  }, [domain, handlePageChange]);

  // Load topic categories (sections)
  const loadTopicCategories = useCallback(async (topicId: string) => {
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
  }, []);

  // Preload subtopic progress data for a domain
  const preloadSubtopicProgressForDomain = useCallback(async (_domain: string) => {
    // Implementation left as is from original page.tsx
    // This would be the fetchSectionProgress and related functions
  }, []);

  // Handle topic selection
  const handleTopicClick = useCallback(async (topicId: string) => {
    console.log('Topic clicked:', topicId);

    // Set loading states
    setLoadingSections(true);

    // Reset selected category if clicking on already selected topic
    if (selectedTopic === topicId) {
      setSelectedTopic(null);
      setSelectedCategory(null);
      setCategoryDetails(null);
      setTopicCategories([]);
      setLoadingSections(false);
      return;
    }

    // Set the selected topic and reset other states
    setSelectedTopic(topicId);
    setSelectedCategory(null);
    setCategoryDetails(null);

    // Load topic categories
    await loadTopicCategories(topicId);

    // Preload progress data for this domain
    await preloadSubtopicProgressForDomain(topicId);

    setLoadingSections(false);
  }, [selectedTopic, loadTopicCategories, preloadSubtopicProgressForDomain]);

  // Handle back button click
  const handleBackToMainCategories = useCallback(() => {
    setSelectedCategory(null);
    setCategoryDetails(null);
    const params = new URLSearchParams(searchParams);
    params.delete('questionId');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // Initialize and handle URL parameters
  useEffect(() => {
    // Only load topics if domain parameter is explicitly provided in URL
    // and is not the special 'topics' value (which should just show the landing page)
    if (domain && domain !== 'topics') {
      console.log(`Loading topic data for domain: ${domain}`);
      
      // Only set selectedTopic if it's not already set to avoid conflicts
      if (!selectedTopic || selectedTopic !== domain) {
        setSelectedTopic(domain);
      }
      
      loadTopicCategories(domain);

      // If difficulty is provided in URL, apply filter
      if (selectedDifficulty) {
        const pageToFetch = parseInt(pageParam || '1');
        // The pageToFetch is used by the useEffect watching selectedDifficulty and currentPage/pageParam
        handleDifficultyChange(selectedDifficulty);
      } else {
        // Clear difficulty filter state if not in URL
        handleDifficultyChange(null);
      }
    } else if (domain === 'topics') {
      // Special case for /topics - ensure no data is loaded
      console.log('On main topics page, not loading any specific topic data');
      setSelectedTopic(null);
    }
  }, [domain, selectedDifficulty, pageParam, selectedTopic, loadTopicCategories, handleDifficultyChange]); // Updated dependencies

  // Handle reset category selection event from CategoryDetailView
  useEffect(() => {
    const handleResetCategory = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { domain: eventDomain } = customEvent.detail;
      
      console.log('Received resetCategorySelection event for domain:', eventDomain);
      
      // Reset the category selection
      setSelectedCategory(null);
      setCategoryDetails(null);
      
      // Reload the topic categories to refresh the UI
      if (eventDomain === domain) {
        loadTopicCategories(domain);
      }
    };
    
    window.addEventListener('resetCategorySelection', handleResetCategory);
    
    return () => {
      window.removeEventListener('resetCategorySelection', handleResetCategory);
    };
  }, [domain]); // Only re-add the listener if domain changes

  // Handle highlighted question ID from URL
  useEffect(() => {
    const qId = searchParams.get('questionId');
    setHighlightedQuestionId(qId ? parseInt(qId) : undefined);
    if (qId) {
      // If a questionId is in the URL, we might need to ensure the relevant category is selected.
      // This logic can be complex: find which category the question belongs to, then select it.
      // For now, just setting the highlight.
      // Also, clear keyword/difficulty filters if a direct question link is followed?
      // handleKeywordChange(null);
      // handleDifficultyChange(null);
    }
  }, [searchParams/*, handleKeywordChange, handleDifficultyChange*/]);

  // Logic for when no specific view (category, keyword, difficulty) is active
  const showTopicGrid = !selectedCategory && !selectedKeyword && !selectedDifficulty;

  return (
    <TopicDataProvider>
      <div className="flex flex-col lg:flex-row gap-0 min-h-screen">
        <SidebarFilters
          selectedTopic={selectedTopic}
          selectedCategory={selectedCategory}
          selectedKeyword={selectedKeyword}
          selectedDifficulty={selectedDifficulty}
          onSelectKeyword={handleKeywordChange}
          onSelectDifficulty={handleDifficultyChange}
        />

        <main className="flex-grow p-0 md:p-0 lg:p-0 bg-white dark:bg-gray-900 transition-colors duration-300 ease-in-out">
          {loadingSections && (
            <div className="p-8 text-center">Loading sections...</div>
          )}

          {!loadingSections && showTopicGrid && (
            <TopicCategoryGrid
              categories={topicCategories}
              onSelectCategory={handleCategorySelect}
              isLoading={loadingCategories}
              domain={domain} // Pass domain
            />
          )}

          {!loadingSections && (selectedCategory || selectedKeyword || selectedDifficulty) && (
            <ContentDisplay
              domain={domain} // Pass domain
              selectedTopic={selectedTopic}
              selectedCategory={selectedCategory}
              selectedKeyword={selectedKeyword}
              selectedDifficulty={selectedDifficulty}
              categoryDetails={categoryDetails}
              topicCategories={topicCategories}
              keywordQuestions={keywordQuestions}
              difficultyQuestions={difficultyQuestions}
              loadingCategories={loadingCategories}
              loadingSections={loadingSections} // Or more specific loading for content area
              onSelectCategory={handleCategorySelect}
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              onPageChange={handlePageChange}
              highlightedQuestionId={highlightedQuestionId}
              clearKeywordFilter={clearKeywordFilter}
              clearDifficultyFilter={clearDifficultyFilter}
              onDifficultyChange={handleDifficultyChange}
              onBackToMainCategories={handleBackToMainCategories}
            />
          )}
        </main>
      </div>
      <ProgressSaver />
    </TopicDataProvider>
  );
} 