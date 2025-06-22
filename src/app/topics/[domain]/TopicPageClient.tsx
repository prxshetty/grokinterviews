'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  TopicCategoryGrid,
  TopicDataProvider,
  ContentDisplay,
  useTopicData,
} from '@/components/topics-ui';
import ProgressSaver from '@/components/utils/ProgressSaver';
import TopicDataService from '@/services/TopicDataService';
import { useFilterLogic } from '@/hooks/use-filter-logic.hook';
import { fetchDomainProgress, fetchCategoryProgress } from '@/app/utils/progress';
import { LoadingSpinner } from '@/components/ui';
import ErrorBoundary from '@/components/utils/ErrorBoundary';
import withAuth from '@/components/auth/withAuth';

// Import types from global definitions
import {
  QuestionType,
  CategoryItem,
  TopicItem,
  SubtopicProgress,
  CategoryProgress
} from '@/types/topic-page.types';

// Props for the client component, including the domain passed from the server component
interface TopicPageClientProps {
  initialDomain: string;
}

function TopicPageClient({ initialDomain }: TopicPageClientProps) {
  const [domain, setDomain] = useState<string>(initialDomain);
  const { refetchData } = useTopicData();

  // Sync internal domain state with initialDomain prop
  useEffect(() => {
    if (initialDomain !== domain) {
      setDomain(initialDomain);
    }
  }, [initialDomain, domain]);

  // URL parameters
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const questionIdParam = searchParams.get('questionId');

  // Use the new hook for filter logic
  const {
    selectedDifficulty,
    handleDifficultyChange,
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
  const [isLoading, setIsLoading] = useState({
    categories: false,
    sections: false,
    difficultyQuestions: false,
  });

  // Cache for topic/category and progress data
  const [dataCache, setDataCache] = useState<Record<string, any>>({});

  // Progress tracking states
  const [subtopicProgress, setSubtopicProgress] = useState<Record<string, SubtopicProgress>>({});
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Difficulty filtering states
  const [difficultyQuestions, setDifficultyQuestions] = useState<QuestionType[]>([]);

  // State for highlighted question (from URL)
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<number | undefined>(() => {
    const qIdParam = searchParams.get('questionId');
    if (qIdParam) {
      const num = parseInt(qIdParam, 10);
      return !isNaN(num) ? num : undefined;
    }
    return undefined;
  });

  const router = useRouter();
  const pathname = usePathname();

  // Fetch questions by difficulty
  const fetchDifficultyQuestions = useCallback(async (difficulty: string, page: number = 1) => {
    if (!domain) return; // Ensure domain is available
    console.log(`Fetching ${difficulty} questions for domain ${domain}, page ${page}`);
    setIsLoading(prev => ({ ...prev, difficultyQuestions: true }));
    try {
      const response = await fetch(`/api/questions/difficulty?difficulty=${difficulty}&domain=${domain}&page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Difficulty questions data:', data);

      if (data && data.questions) {
        setDifficultyQuestions(data.questions);
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.totalResults || 0);
        setCurrentPage(data.currentPage || 1); // Ensure currentPage is updated from response
      } else {
        setDifficultyQuestions([]);
        setTotalPages(1);
        setTotalResults(0);
      }
    } catch (error) {
      console.error(`Error fetching ${difficulty} questions:`, error);
      setDifficultyQuestions([]); // Clear on error
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setIsLoading(prev => ({ ...prev, difficultyQuestions: false }));
    }
  }, [domain]); // Added domain as a dependency for useCallback

  // Update currentPage when pageParam changes (e.g., from hook resetting page on filter change)
  useEffect(() => {
    const pageParam = searchParams.get('page');
    setCurrentPage(pageParam ? parseInt(pageParam, 10) : 1);
  }, [searchParams]);

  // Fetch difficulty questions when selectedDifficulty or currentPage changes
  useEffect(() => {
    if (selectedDifficulty && domain) {
      fetchDifficultyQuestions(selectedDifficulty, currentPage);
    } else {
      setDifficultyQuestions([]);
    }
  }, [selectedDifficulty, currentPage, domain, fetchDifficultyQuestions]); // Ensures fetchDifficultyQuestions is a dependency

  // Handle page change for pagination
  const handlePageChange = useCallback((newPage: number) => {
    // Don't do anything if we're already on this page
    if (newPage === currentPage) return;

    if (selectedDifficulty && newPage >= 1 && newPage <= totalPages) {
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
  }, [currentPage, selectedDifficulty, totalPages, searchParams, pathname, router, handleDifficultyChange]);

  // Load details for a selected category
  const loadCategoryDetails = useCallback(async (categoryId: string) => {
    console.log('topics/page - loadCategoryDetails called with:', categoryId);
    const cacheKey = `category-details-${categoryId}`;
    if (dataCache[cacheKey]) {
      console.log('Serving from cache:', cacheKey);
      setCategoryDetails(dataCache[cacheKey]);
       // Also fetch progress for the cached category
       if (!categoryId.startsWith('header-')) {
        const numericId = parseInt(categoryId.replace('topic-', ''));
        if (!isNaN(numericId)) {
          const progress = await fetchCategoryProgress(numericId, true);
          setCategoryProgress(progress);
        }
      }
      return;
    }

    setIsLoading(prev => ({ ...prev, sections: true }));
    try {
      const topicId = selectedTopic;
      if (!topicId) {
        console.error('No topic selected, cannot load category details');
        setIsLoading(prev => ({ ...prev, sections: false }));
        return;
      }
      if (categoryId.startsWith('header-')) {
        const headerNumber = parseInt(categoryId.replace('header-', ''), 10);
        const response = await fetch(`/api/section-headers?domain=${topicId}`);
        if (!response.ok) throw new Error(`Failed to fetch section headers: ${response.statusText}`);
        const sectionHeaders = await response.json();
        const sectionHeader = sectionHeaders.find((header: any) => header.id === headerNumber);
        if (!sectionHeader) throw new Error(`Could not find section header with ID ${headerNumber}`);
        const sectionResponse = await fetch(`/api/topics/by-section?domain=${topicId}&sectionName=${encodeURIComponent(sectionHeader.name)}`);
        if (!sectionResponse.ok) throw new Error(`Failed to fetch section: ${sectionResponse.statusText}`);
        const topicsInSection = await sectionResponse.json();
        const sectionData: TopicItem = {
          label: sectionHeader.name,
          subtopics: topicsInSection.reduce((acc: Record<string, any>, topic: any) => {
            acc[`topic-${topic.id}`] = { id: `topic-${topic.id}`, label: topic.name, content: topic.description || '' };
            return acc;
          }, {})
        };
        setCategoryDetails(sectionData);
        setDataCache(prevCache => ({ ...prevCache, [cacheKey]: sectionData }));
        setCategoryProgress(null);
      } else {
        const topicToFetch = categoryId.includes('topic-') ? parseInt(categoryId.replace('topic-', ''), 10) : topicId;
        if (!topicToFetch) {
          console.error('Could not determine a topic ID to fetch for category:', categoryId);
          setIsLoading(prev => ({ ...prev, sections: false }));
          return;
        }
        const apiTopicParam = (typeof topicToFetch === 'number' || !isNaN(Number(topicToFetch))) ? topicToFetch : topicId;
        const response = await fetch(`/api/topics/categories?topicId=${apiTopicParam}`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);
        const categories = await response.json();
        const category = categories.find((cat: any) => `topic-${cat.id}` === categoryId);
        const simplifiedDetails: TopicItem = {
          id: categoryId,
          label: category?.name || 'Category',
          isGenerated: false,
        };
        setCategoryDetails(simplifiedDetails);
        const numericId = parseInt(categoryId.replace('topic-', ''));
        if (!isNaN(numericId)) {
          const progress = await fetchCategoryProgress(numericId, true);
          setCategoryProgress(progress);
        }
      }
    } catch (error) {
      console.error('Error loading category details:', error);
      setCategoryDetails(null);
    } finally {
      setIsLoading(prev => ({ ...prev, sections: false }));
    }
  }, [selectedTopic, dataCache, setIsLoading, setCategoryDetails, setDataCache, setCategoryProgress]);

  // Handle category selection from TopicCategoryGrid
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    console.log('Category selected:', categoryId);
    setSelectedCategory(categoryId);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', categoryId);
    params.delete('q'); // Clear question ID when a new category is selected
    router.push(`${pathname}?${params.toString()}`);
    // Load details for the selected category
    await loadCategoryDetails(categoryId);
  }, [searchParams, router, pathname, loadCategoryDetails]);

  // Load topic categories (sections)
  const loadTopicCategories = useCallback(async (topicId: string) => {
    const cacheKey = `topic-categories-${topicId}`;
    if (dataCache[cacheKey]) {
      console.log('Serving from cache:', cacheKey);
      setTopicCategories(dataCache[cacheKey]);
      return;
    }
    setIsLoading(prev => ({ ...prev, categories: true }));
    try {
      const sectionHeaders = await TopicDataService.getSectionHeaders(topicId);
      setTopicCategories(sectionHeaders);
      setDataCache(prevCache => ({ ...prevCache, [cacheKey]: sectionHeaders }));
    } catch (error) {
      console.error(`Error loading section headers for ${topicId}:`, error);
      setTopicCategories([]); // Reset on error
    } finally {
      setIsLoading(prev => ({ ...prev, categories: false }));
    }
  }, [dataCache, setIsLoading, setTopicCategories, setDataCache]);

  // Preload subtopic progress data for a domain
  const preloadSubtopicProgressForDomain = useCallback(async (topicId: string) => {
    try {
      console.log(`Preloading subtopic progress for domain ${domain} with topic ${topicId}`);
      
      const domainProgressData = await fetchDomainProgress(domain, topicId, true);
      
      const accumulatedNewCacheEntries: Record<string, any> = {};
      const accumulatedSubtopicProgress: Record<string, SubtopicProgress> = {};

      if (domainProgressData && domainProgressData.subtopics) {
        Object.entries(domainProgressData.subtopics).forEach(([subtopicId, data]: [string, any]) => {
          accumulatedSubtopicProgress[`topic-${subtopicId}`] = {
            completionPercentage: data.completionPercentage,
            questionsCompleted: data.questionsCompleted,
            totalQuestions: data.totalQuestions,
            categoriesCompleted: data.categoriesCompleted,
            totalCategories: data.totalCategories
          };
        });
        console.log(`Collected subtopic progress for ${Object.keys(accumulatedSubtopicProgress).length} subtopics`);
      }

      try {
        const sectionHeaders = await TopicDataService.getSectionHeaders(domain);
        const sectionProgressUpdatesBatch: Record<string, any> = {};
        
        await Promise.all(sectionHeaders.map(async (header: CategoryItem) => {
          try {
            const cacheKey = `section-progress-${domain}-${header.label}`;
            // Check existing cache before fetching, though fetchDomainProgress has forceRefresh
            if (dataCache && dataCache[cacheKey] && !topicId) { // topicId presence implies forceRefresh context
                 sectionProgressUpdatesBatch[cacheKey] = dataCache[cacheKey];
                 return;
            }
            console.log(`Fetching section progress for ${header.label}`);
            
            const response = await fetch(`/api/user/progress/summary?domain=${domain}&section=${encodeURIComponent(header.label)}&entityType=section`);
            if (response.ok) {
              const sectionData = await response.json();
              sectionProgressUpdatesBatch[cacheKey] = {
                questionsCompleted: sectionData.completed_children || 0,
                totalQuestions: sectionData.total_children || 0,
                completionPercentage: sectionData.completion_percentage || 0
              };
            }
          } catch (error) {
            console.error(`Error fetching section progress for ${header.label}:`, error);
          }
        }));
        
        if (Object.keys(sectionProgressUpdatesBatch).length > 0) {
            Object.assign(accumulatedNewCacheEntries, sectionProgressUpdatesBatch);
        }
        console.log(`Collected section progress cache for ${Object.keys(sectionProgressUpdatesBatch).length} sections`);
      } catch (error) {
        console.error('Error fetching section headers or their progress:', error);
      }

      if (domainProgressData && domainProgressData.sectionProgress) {
        const sectionData = domainProgressData.sectionProgress;
        const sectionKey = domain; // Or a more specific key if needed
        accumulatedNewCacheEntries[`domain-section-progress-${sectionKey}`] = { // Made key more specific
          progress: sectionData.completionPercentage,
          completed: sectionData.questionsCompleted,
          total: sectionData.totalQuestions,
          subtopicsCompleted: sectionData.subtopicsCompleted,
          partiallyCompletedSubtopics: sectionData.partiallyCompletedSubtopics,
          totalSubtopics: sectionData.totalSubtopics
        };
        console.log('Collected domain section progress cache');
      }

      // Batch update states
      if (Object.keys(accumulatedSubtopicProgress).length > 0) {
        setSubtopicProgress(prev => ({ ...prev, ...accumulatedSubtopicProgress }));
      }
      if (Object.keys(accumulatedNewCacheEntries).length > 0) {
        setDataCache(prevCache => ({ ...prevCache, ...accumulatedNewCacheEntries }));
      }

      const event = new CustomEvent('domainProgressPreloaded', {
        detail: { domain, topicId, progressData: domainProgressData }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error(`Error preloading subtopic progress for domain ${domain}:`, error);
    }
  }, [domain, dataCache, setDataCache, setSubtopicProgress]);

  // Handle back button click
  const handleBackToMainCategories = useCallback(() => {
    setSelectedCategory(null);
    setCategoryDetails(null);
    const params = new URLSearchParams(searchParams);
    params.delete('questionId');
    router.push(`${pathname}?${params.toString()}`);
    setCategoryProgress(null); // Reset progress when going back
  }, [searchParams, router, pathname]);

  // Initialize and handle URL parameters
  useEffect(() => {
    // Only load topics if domain parameter is explicitly provided in URL
    // and is not the special 'topics' value (which should just show the landing page)
    if (domain && domain !== 'topics') {
      console.log(`Loading topic data for domain: ${domain}`);
      
      const loadData = async () => {
        setIsLoading(prev => ({ ...prev, categories: true, sections: true }));
        
        // Refetch global topic data to ensure it's up-to-date
        // This will clear caches in TopicDataProvider and TopicDataService
        await refetchData(); 

        await loadTopicCategories(domain);
        await preloadSubtopicProgressForDomain(domain);

        setIsLoading(prev => ({ ...prev, categories: false, sections: false }));
      };

      loadData();

    } else if (domain === 'topics') {
      // Special case for /topics - ensure no data is loaded
      console.log('On main topics page, not loading any specific topic data');
      setSelectedTopic(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, setSelectedTopic, setIsLoading]); 

  // Handle reset category selection event from CategoryDetailView
  useEffect(() => {
    const handleResetCategory = (_event: Event) => {
      console.log('handleResetCategory triggered');
      setSelectedCategory(null);
      setCategoryDetails(null);
      // Also clear any filters that were active
      clearDifficultyFilter();
      setCategoryProgress(null); // Reset progress on full reset
    };

    window.addEventListener('resetCategory', handleResetCategory);
    
    return () => {
      window.removeEventListener('resetCategory', handleResetCategory);
    };
  }, [domain, clearDifficultyFilter]); // Added clearDifficultyFilter dependency

  // Handle highlighted question ID from URL
  useEffect(() => {
    const qIdParam = searchParams.get('questionId');
    if (qIdParam) {
      const num = parseInt(qIdParam, 10);
      setHighlightedQuestionId(!isNaN(num) ? num : undefined);
    } else {
      setHighlightedQuestionId(undefined);
    }
    // If a questionId is in the URL, we might need to ensure the relevant category is selected.
    // This logic can be complex: find which category the question belongs to, then select it.
    // For now, just setting the highlight.
  }, [searchParams]);

  // Logic for when no specific view (category, difficulty) is active
  const showTopicGrid = !selectedCategory && !selectedDifficulty;

  return (
    <TopicDataProvider>
      <div className="flex flex-col min-h-screen">
          <div className="flex-grow bg-white dark:bg-black transition-colors duration-300 ease-in-out">
            <ErrorBoundary>
              {isLoading.sections && (
                <LoadingSpinner 
                  size="lg" 
                  color="primary" 
                  text="Loading sections..." 
                  centered={true}
                />
              )}

              {!isLoading.sections && showTopicGrid && (
                <TopicCategoryGrid
                  categories={topicCategories}
                  onSelectCategory={handleCategorySelect}
                  isLoading={isLoading.categories}
                  domain={domain} // Pass domain
                  level="section" // Add the missing level prop - showing sections when domain is selected
                  subtopicProgress={subtopicProgress}
                  dataCache={dataCache}
                  showDomainTitle={true}
                />
              )}

              {!isLoading.sections && (selectedCategory || selectedDifficulty) && (
                                  <ContentDisplay
                    domain={domain} // Pass domain
                    selectedTopic={selectedTopic}
                    selectedCategory={selectedCategory}
                    selectedDifficulty={selectedDifficulty}
                    categoryDetails={categoryDetails}
                    topicCategories={topicCategories}
                    difficultyQuestions={difficultyQuestions}
                    isLoading={isLoading}
                    onSelectCategory={handleCategorySelect}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalResults={totalResults}
                    onPageChange={handlePageChange}
                    {...(highlightedQuestionId !== undefined && { highlightedQuestionId: highlightedQuestionId })}
                    clearDifficultyFilter={clearDifficultyFilter}
                    onDifficultyChange={handleDifficultyChange}
                    onBackToMainCategories={handleBackToMainCategories}
                    subtopicProgressData={subtopicProgress}
                    categoryProgressData={categoryProgress}
                  />
              )}
            </ErrorBoundary>
          </div>
      </div>
      <ProgressSaver />
    </TopicDataProvider>
  );
}

export default withAuth(TopicPageClient); 