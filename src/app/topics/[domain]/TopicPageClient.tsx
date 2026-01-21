'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  TopicCategoryGrid,
  TopicDataProvider,
  ContentDisplay,
} from '@/components/topics-ui';
// Removed ProgressSaver import as progress tracking is disabled
import TopicDataService from '@/services/TopicDataService';
// Removed useFilterLogic import as it's no longer needed
import ErrorBoundary from '@/components/utils/ErrorBoundary';

// Types
import {
  QuestionType,
  CategoryItem,
  TopicItem
} from '@/types/topics';

// Component props interface
interface TopicPageClientProps {
  initialDomain: string;
}

function TopicPageClient({ initialDomain }: TopicPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL state management
  const [selectedTopic] = useState<string>(initialDomain);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    return searchParams.get('category') || null;
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(() => {
    return searchParams.get('difficulty') || null;
  });

  // Data states
  const [topicCategories, setTopicCategories] = useState<CategoryItem[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<TopicItem | null>(null);
  const [isLoading, setIsLoading] = useState({
    categories: false,
    sections: false,
    difficultyQuestions: false,
  });

  // Cache for topic/category data
  const [dataCache, setDataCache] = useState<Record<string, any>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [totalPages] = useState<number>(1);
  const [totalResults] = useState<number>(0);

  // Difficulty filtering states
  const [difficultyQuestions, setDifficultyQuestions] = useState<QuestionType[]>([]);

  // State for highlighted question (from URL)
  const [highlightedQuestionId] = useState<number | undefined>(() => {
    const qIdParam = searchParams.get('q');
    if (qIdParam) {
      const num = parseInt(qIdParam, 10);
      return !isNaN(num) ? num : undefined;
    }
    return undefined;
  });

  // Removed filter logic hook as it's not needed

  // Derived state for UI control
  const domain = selectedTopic;
  const showTopicGrid = !selectedCategory && !selectedDifficulty && topicCategories.length > 0;

  // Load topics for the selected domain
  const loadTopics = useCallback(async (topicName: string) => {

    const cacheKey = `topics-${topicName}`;
    if (dataCache[cacheKey]) {

      setTopicCategories(dataCache[cacheKey]);
      return;
    }

    setIsLoading(prev => ({ ...prev, categories: true }));
    try {
      const topics = await TopicDataService.getSectionHeaders(topicName);
      setTopicCategories(topics);
      setDataCache(prevCache => ({ ...prevCache, [cacheKey]: topics }));
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopicCategories([]);
    } finally {
      setIsLoading(prev => ({ ...prev, categories: false }));
    }
  }, [dataCache, setTopicCategories, setIsLoading, setDataCache]);

  // Load category details
  const loadCategoryDetails = useCallback(async (categoryId: string) => {

    const cacheKey = `category-details-${categoryId}`;
    if (dataCache[cacheKey]) {

      setCategoryDetails(dataCache[cacheKey]);
      return;
    }

    setIsLoading(prev => ({ ...prev, sections: true }));
    try {
      const domain = selectedTopic;
      if (!domain) {
        console.error('No domain selected, cannot load category details');
        setIsLoading(prev => ({ ...prev, sections: false }));
        return;
      }

      if (categoryId.startsWith('header-') || categoryId.startsWith('bookmark-topic-')) {
        // Find the section name from topicCategories for display purposes.
        let section = topicCategories.find(c => c.id === categoryId);
        let sectionName: string;

        if (!section) {
          if (categoryId.startsWith('bookmark-topic-')) {
            // For bookmark URLs, we don't have a matching section ID, so we skip section loading
            // and go directly to loading the topic details

            setCategoryDetails({
              id: categoryId,
              label: 'Bookmarked Question',
              isGenerated: false
            });
            setIsLoading(prev => ({ ...prev, sections: false }));
            return;
          }

          console.warn('Section not found in topicCategories for categoryId:', categoryId);

          // Fallback: try to find section by name if the categoryId was constructed from section name
          // Extract potential section name from categoryId (e.g., "header-foundations-of-artificial-intelligence" -> "Foundations of Artificial Intelligence")
          const potentialSectionName = categoryId.replace('header-', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          section = topicCategories.find(c =>
            c.label.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') === categoryId.replace('header-', '') ||
            c.label.toLowerCase() === potentialSectionName.toLowerCase()
          );

          if (!section) {
            console.error('No matching section found for categoryId:', categoryId, 'Tried section name:', potentialSectionName);
            setIsLoading(prev => ({ ...prev, sections: false }));
            return;
          }


        }

        sectionName = section.label;

        // Fetch topics using the section name, not the ID
        const topicsInSection = await TopicDataService.getTopicsBySection(domain, sectionName);

        const sectionData: TopicItem = {
          label: sectionName,
          subtopics: topicsInSection.reduce((acc: Record<string, any>, topic: any) => {
            acc[topic.id] = { id: topic.id, label: topic.label };
            return acc;
          }, {})
        };
        setCategoryDetails(sectionData);
        setDataCache(prevCache => ({ ...prevCache, [cacheKey]: sectionData }));
      } else {
        const topicToFetch = categoryId.includes('topic-') ? parseInt(categoryId.replace('topic-', ''), 10) : categoryId;
        if (!topicToFetch) {
          console.error('Could not determine a topic ID to fetch for category:', categoryId);
          setIsLoading(prev => ({ ...prev, sections: false }));
          return;
        }
        const apiTopicParam = (typeof topicToFetch === 'number' || !isNaN(Number(topicToFetch))) ? topicToFetch : domain;
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
      }
    } catch (error) {
      console.error('Error loading category details:', error);
      setCategoryDetails(null);
    } finally {
      setIsLoading(prev => ({ ...prev, sections: false }));
    }
  }, [selectedTopic, dataCache, topicCategories, setCategoryDetails, setIsLoading, setDataCache]);

  // Handle category selection from TopicCategoryGrid
  const handleCategorySelect = useCallback(async (categoryId: string) => {

    setSelectedCategory(categoryId);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', categoryId);
    params.delete('q'); // Clear question ID when a new category is selected
    router.push(`${pathname}?${params.toString()}`);

    // Load category details
    await loadCategoryDetails(categoryId);
  }, [searchParams, pathname, router, loadCategoryDetails, setSelectedCategory]);

  // Handle difficulty selection
  const handleDifficultyChange = useCallback(async (difficulty: string | null) => {
    if (!difficulty) return;

    setSelectedDifficulty(difficulty);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('difficulty', difficulty);
    params.delete('q'); // Clear question ID when difficulty is selected
    router.push(`${pathname}?${params.toString()}`);

    // Load difficulty questions
    setIsLoading(prev => ({ ...prev, difficultyQuestions: true }));
    try {
      const response = await fetch(`/api/questions/difficulty?difficulty=${difficulty}&domain=${domain}`);
      if (!response.ok) throw new Error(`Failed to fetch difficulty questions: ${response.statusText}`);
      const questions = await response.json();
      setDifficultyQuestions(questions);
    } catch (error) {
      console.error('Error loading difficulty questions:', error);
      setDifficultyQuestions([]);
    } finally {
      setIsLoading(prev => ({ ...prev, difficultyQuestions: false }));
    }
  }, [searchParams, pathname, router, domain, setSelectedDifficulty, setIsLoading, setDifficultyQuestions]);

  // Clear difficulty filter
  const clearDifficultyFilter = useCallback(() => {
    setSelectedDifficulty(null);
    setDifficultyQuestions([]);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('difficulty');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router, setSelectedDifficulty, setDifficultyQuestions]);

  // Handle back to main categories
  const handleBackToMainCategories = useCallback(() => {
    setSelectedCategory(null);
    setCategoryDetails(null);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('q'); // Clear question ID when going back
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router, setSelectedCategory, setCategoryDetails]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router, setCurrentPage]);

  // Load topics when domain changes
  useEffect(() => {
    if (selectedTopic) {
      loadTopics(selectedTopic);
    }
  }, [selectedTopic, loadTopics]);

  // Load category details when category is selected from URL and topics are loaded
  useEffect(() => {
    if (selectedCategory && topicCategories.length > 0) {
      loadCategoryDetails(selectedCategory);
    }
  }, [selectedCategory, topicCategories, loadCategoryDetails]);

  // This useEffect was removed as fetching questions by difficulty is now handled by client-side filtering.

  return (
    <TopicDataProvider>
      <div className="min-h-screen bg-transparent">
        <div className="w-full max-w-8xl mx-auto px-4 pt-24 pb-8 sm:pt-32">
          <ErrorBoundary>
            {showTopicGrid && (
              <TopicCategoryGrid
                items={topicCategories}
                onSelectItem={handleCategorySelect}
                isLoading={isLoading.categories}
                domain={domain}
                level="section"
                showDomainTitle={true}
              />
            )}

            {!isLoading.sections && (selectedCategory || selectedDifficulty) && (
              <ContentDisplay
                domain={domain}
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
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
      {/* Removed ProgressSaver component as progress tracking is disabled */}
    </TopicDataProvider>
  );
}

export default TopicPageClient;