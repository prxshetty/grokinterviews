'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  TopicCategoryGrid,
  CategoryDetailView,
  TopicDataProvider,
  ContentDisplay
} from '@/components/topics-ui';
import ProgressSaver from '@/components/utils/ProgressSaver';
import TopicDataService from '@/services/TopicDataService';
import { useTopicData } from '@/hooks';

import { useFilterLogic } from '@/hooks/use-filter-logic.hook';
import { fetchDomainProgress, fetchCategoryProgress } from '@/app/utils/progress';
import { LoadingSpinner } from '@/components/ui';
import ErrorBoundary from '@/components/utils/ErrorBoundary';
import withAuth from '@/components/auth/withAuth';

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

// Props for the client component, including the domain passed from the server component
interface TopicPageClientProps {
  initialDomain: string;
}

function TopicPageClient({ initialDomain }: TopicPageClientProps) {
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
  const [currentPage, setCurrentPage] = useState<number>(pageParam ? parseInt(pageParam) : 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Difficulty filtering states
  const [difficultyQuestions, setDifficultyQuestions] = useState<QuestionType[]>([]);

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
      // Use the current selectedTopic without defaulting to 'ml'
      const topicId = selectedTopic;

      // If no topic is selected, we cannot proceed
      if (!topicId) {
        console.error('No topic selected, cannot load category details');
        setIsLoading(prev => ({ ...prev, sections: false }));
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
        setDataCache(prevCache => ({ ...prevCache, [cacheKey]: sectionData }));
        setCategoryDetails(sectionData);
        // Sections do not have their own direct progress bar in this view
        setCategoryProgress(null);
      } else {
        // This is a regular topic/category
        const topicToFetch = categoryId.includes('topic-') ?
          parseInt(categoryId.replace('topic-', ''), 10) :
          topicId;
        
        if (!topicToFetch) {
          console.error('Could not determine a topic ID to fetch for category:', categoryId);
          setIsLoading(prev => ({ ...prev, sections: false }));
          return;
        }
        
        const response = await fetch(`/api/topics/categories?topicId=${topicToFetch}`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);
        
        const categories = await response.json();
        const category = categories.find((cat: any) => `topic-${cat.id}` === categoryId);
        
        // If we found the category, we can get details - though this seems inefficient
        // This part of logic may need review if it's causing issues.
        // For now, let's assume `categoryDetails` are fetched/set correctly.
        
        // Let's create a simplified details object to proceed
        const simplifiedDetails: TopicItem = {
          id: categoryId,
          label: category?.name || 'Category',
          isGenerated: false, 
        };
        setCategoryDetails(simplifiedDetails); 
        
        // Fetch progress for the category
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
  }, [selectedTopic, dataCache]);

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



  const fetchDifficultyQuestions = useCallback(async (difficulty: string, page: number = 1) => {
    if (!domain) return; // Ensure domain is available
    setIsLoading(prev => ({ ...prev, difficultyQuestions: true }));
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
      setIsLoading(prev => ({ ...prev, difficultyQuestions: false }));
    }
  }, [domain, handlePageChange]);

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
      // For the first level, we want to show section headers
      const sectionHeaders = await TopicDataService.getSectionHeaders(topicId);
      setTopicCategories(sectionHeaders);
      setDataCache(prevCache => ({ ...prevCache, [cacheKey]: sectionHeaders }));
    } catch (error) {
      console.error(`Error loading section headers for ${topicId}:`, error);
      setTopicCategories([]);
    } finally {
      setIsLoading(prev => ({ ...prev, categories: false }));
    }
  }, [dataCache]);

  // Preload subtopic progress data for a domain
  const preloadSubtopicProgressForDomain = useCallback(async (topicId: string) => {
    try {
      console.log(`Preloading subtopic progress for domain ${domain} with topic ${topicId}`);
      
      // Fetch domain-wide progress data
      const domainProgressData = await fetchDomainProgress(domain, topicId, true);
      
      if (domainProgressData && domainProgressData.subtopics) {
        // Update subtopic progress state with the fetched data
        const formattedSubtopicProgress: Record<string, SubtopicProgress> = {};

        Object.entries(domainProgressData.subtopics).forEach(([subtopicId, data]) => {
          formattedSubtopicProgress[`topic-${subtopicId}`] = {
            completionPercentage: data.completionPercentage,
            questionsCompleted: data.questionsCompleted,
            totalQuestions: data.totalQuestions,
            categoriesCompleted: data.categoriesCompleted,
            totalCategories: data.totalCategories
          };
        });

        setSubtopicProgress(formattedSubtopicProgress);
        console.log(`Updated subtopic progress cache for ${Object.keys(formattedSubtopicProgress).length} subtopics`);

        // Fetch section-level progress for each section header
        try {
          const sectionHeaders = await TopicDataService.getSectionHeaders(domain);
          const sectionProgressUpdates: Record<string, any> = {};
          
          // Fetch progress for each section
          await Promise.all(sectionHeaders.map(async (header) => {
            try {
              const cacheKey = `section-progress-${domain}-${header.label}`;
              console.log(`Fetching section progress for ${header.label}`);
              
              const response = await fetch(`/api/user/progress/summary?domain=${domain}&section=${encodeURIComponent(header.label)}&entityType=section`);
              if (response.ok) {
                const sectionData = await response.json();
                sectionProgressUpdates[cacheKey] = {
                  questionsCompleted: sectionData.completed_children || 0,
                  totalQuestions: sectionData.total_children || 0,
                  completionPercentage: sectionData.completion_percentage || 0
                };
                console.log(`Cached section progress for ${header.label}:`, sectionProgressUpdates[cacheKey]);
              }
            } catch (error) {
              console.error(`Error fetching section progress for ${header.label}:`, error);
            }
          }));
          
          // Update the data cache with section progress
          setDataCache(prevCache => ({ ...prevCache, ...sectionProgressUpdates }));
          console.log(`Updated section progress cache for ${Object.keys(sectionProgressUpdates).length} sections`);
        } catch (error) {
          console.error('Error fetching section progress:', error);
        }

        // Also update domain-level section progress if available
        if (domainProgressData.sectionProgress) {
          const sectionData = domainProgressData.sectionProgress;
          const sectionProgressUpdate: Record<string, ProgressData> = {};
          
          // Use the domain as the section key for now, or derive from topic data
          const sectionKey = domain;
          sectionProgressUpdate[sectionKey] = {
            progress: sectionData.completionPercentage,
            completed: sectionData.questionsCompleted,
            total: sectionData.totalQuestions,
            subtopicsCompleted: sectionData.subtopicsCompleted,
            partiallyCompletedSubtopics: sectionData.partiallyCompletedSubtopics,
            totalSubtopics: sectionData.totalSubtopics
          };
          setDataCache(prevCache => ({ ...prevCache, ...sectionProgressUpdate }));
          console.log('Updated domain section progress cache');
        }

        // Emit a custom event to notify other components that progress has been preloaded
        const event = new CustomEvent('domainProgressPreloaded', {
          detail: { domain, topicId, progressData: domainProgressData }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error(`Error preloading subtopic progress for domain ${domain}:`, error);
    }
  }, [domain, dataCache]);

  // Handle topic selection
  const handleTopicClick = useCallback(async (topicId: string) => {
    console.log('Topic clicked:', topicId);

    // Set loading states
    setIsLoading(prev => ({ ...prev, sections: true }));

    // Reset selected category if clicking on already selected topic
    if (selectedTopic === topicId) {
      setSelectedTopic(null);
      setSelectedCategory(null);
      setCategoryDetails(null);
      setTopicCategories([]);
      setIsLoading(prev => ({ ...prev, sections: false }));
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

    setIsLoading(prev => ({ ...prev, sections: false }));
  }, [selectedTopic, loadTopicCategories, preloadSubtopicProgressForDomain]);

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
        
        await loadTopicCategories(domain);
        await preloadSubtopicProgressForDomain(domain);

        setIsLoading(prev => ({ ...prev, categories: false, sections: false }));
      };

      loadData();

      // If difficulty is provided in URL, apply filter
      if (selectedDifficulty) {
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
  }, [domain]); 

  // Handle reset category selection event from CategoryDetailView
  useEffect(() => {
    const handleResetCategory = (event: Event) => {
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
                    highlightedQuestionId={highlightedQuestionId}
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