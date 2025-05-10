'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  SidebarFilters,
  TopicDataProvider,
  ContentDisplay
} from '@/app/components/topics-ui';
import TopicDataService from '@/services/TopicDataService';
import type { TopicItem as ServiceTopicItem } from '@/services/TopicDataService';
import type { Question as DBQuestion } from '@/types/database';
import { useTopicData } from '@/app/hooks';

// Extended types for client-side usage
interface QuestionType extends DBQuestion {
  // Client-specific Question extensions, if any. Example:
  // isFavorite?: boolean;
  // Ensure any existing fields like 'categories' are compatible with DBQuestion structure
}

interface TopicItemClient extends ServiceTopicItem {
  // Client-specific TopicItem extensions
  breadcrumbs?: Array<{ id: string; label: string; href?: string }>;
  // Ensure 'questions' prop is compatible if ServiceTopicItem defines it (it does)
}

// Local CategoryItem structure for props, matching expected shape
interface ClientCategoryItem {
    id: string;
    label: string;
}

interface TopicPageClientProps {
  domainSlug: string;
  sectionSlug: string;
  topicSlug: string;
}

export default function TopicPageClient({ domainSlug, sectionSlug, topicSlug }: TopicPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const pageParam = searchParams.get('page');
  const keywordParam = searchParams.get('q');
  const difficultyParam = searchParams.get('difficulty');
  const questionIdParam = searchParams.get('questionId');

  const [currentTopicDetails, setCurrentTopicDetails] = useState<TopicItemClient | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(true);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; label: string; href?: string }>>([]);

  const [selectedKeywordState, setSelectedKeywordState] = useState<string | null>(keywordParam);
  const [keywordQuestions, setKeywordQuestions] = useState<QuestionType[]>([]);
  const [loadingKeywordQuestions, setLoadingKeywordQuestions] = useState<boolean>(false);

  const [selectedDifficultyState, setSelectedDifficultyState] = useState<string | null>(difficultyParam);
  const [difficultyQuestions, setDifficultyQuestions] = useState<QuestionType[]>([]);
  const [loadingDifficultyQuestions, setLoadingDifficultyQuestions] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(pageParam ? parseInt(pageParam) : 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | undefined>(
    questionIdParam || undefined
  );

  const { topicData: rawTopicDataFromHook } = useTopicData();

  const loadDataForCurrentRoute = useCallback(async (currentDomain: string, currentSection: string, currentTopic: string) => {
    setIsLoadingDetails(true);
    setCurrentTopicDetails(null);
    setBreadcrumbs([]);
    try {
      const details = await TopicDataService.getSpecificTopicContent(currentDomain, currentSection, currentTopic);
      setCurrentTopicDetails(details as TopicItemClient | null);
      const constructedBreadcrumbs = [
        { id: 'home', label: 'Topics', href: '/topics' },
        { id: currentDomain, label: currentDomain, href: `/topics/${currentDomain}` }, 
        { id: currentSection, label: currentSection, href: `/topics/${currentDomain}/${currentSection}` }, 
        { id: currentTopic, label: details?.label || currentTopic, href: pathname }
      ];
      setBreadcrumbs(constructedBreadcrumbs);
    } catch (error) {
      console.error(`TopicPageClient: Error loading details:`, error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (domainSlug && sectionSlug && topicSlug) {
      loadDataForCurrentRoute(domainSlug, sectionSlug, topicSlug);
    } else {
      setIsLoadingDetails(false);
    }
  }, [domainSlug, sectionSlug, topicSlug, loadDataForCurrentRoute]);

  const updateUrlParams = (paramsToUpdate: Record<string, string | null>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value === null) currentParams.delete(key);
      else currentParams.set(key, value);
    });
    router.push(`${pathname}?${currentParams.toString()}`, { scroll: false });
  };

  const handleFilterChange = useCallback(async (type: 'keyword' | 'difficulty', value: string | null, page: number = 1) => {
    setKeywordQuestions([]);
    setDifficultyQuestions([]);
    
    let apiPath = '';
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '10', 
      domain: domainSlug,
      section: sectionSlug,
      topic: topicSlug,
    });

    if (type === 'keyword' && value) {
      setSelectedKeywordState(value);
      setSelectedDifficultyState(null);
      apiPath = '/api/questions/keywords'; 
      queryParams.set('q', value);
      updateUrlParams({ q: value, difficulty: null, page: page.toString() });
    } else if (type === 'difficulty' && value) {
      setSelectedDifficultyState(value);
      setSelectedKeywordState(null);
      apiPath = '/api/questions/difficulty'; 
      queryParams.set('difficulty', value);
      updateUrlParams({ difficulty: value, q: null, page: page.toString() });
    } else {
      setSelectedKeywordState(null);
      setSelectedDifficultyState(null);
      updateUrlParams({ q: null, difficulty: null, page: '1' });
      loadDataForCurrentRoute(domainSlug, sectionSlug, topicSlug);
      return;
    }

    setLoadingKeywordQuestions(type === 'keyword');
    setLoadingDifficultyQuestions(type === 'difficulty');
    setIsLoadingDetails(true);

    try {
      const response = await fetch(`${apiPath}?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (type === 'keyword') setKeywordQuestions(data.questions || []);
      if (type === 'difficulty') setDifficultyQuestions(data.questions || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.totalResults || 0);
    } catch (error) {
      console.error(`Error fetching ${type} questions:`, error);
    } finally {
      setLoadingKeywordQuestions(false);
      setLoadingDifficultyQuestions(false);
      setIsLoadingDetails(false);
    }
  }, [domainSlug, sectionSlug, topicSlug, pathname, searchParams, router, loadDataForCurrentRoute]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (selectedKeywordState) handleFilterChange('keyword', selectedKeywordState, newPage);
    else if (selectedDifficultyState) handleFilterChange('difficulty', selectedDifficultyState, newPage);
    else updateUrlParams({ page: newPage.toString() });
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (domainSlug && sectionSlug && topicSlug) { // Only clear if main route context exists
        if (params.has('q')) { params.delete('q'); setSelectedKeywordState(null); changed = true; }
        if (params.has('difficulty')) { params.delete('difficulty'); setSelectedDifficultyState(null); changed = true; }
        if (params.has('page')) { params.delete('page'); setCurrentPage(1); changed = true; }
        if (changed) router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainSlug, sectionSlug, topicSlug]); // Deps ensure this runs when slugs change

 useEffect(() => {
    const q = searchParams.get('q');
    const diff = searchParams.get('difficulty');
    const p = searchParams.get('page');
    const pageNum = p ? parseInt(p) : 1;

    if (q && q !== selectedKeywordState) {
      handleFilterChange('keyword', q, pageNum);
    } else if (diff && diff !== selectedDifficultyState) {
      handleFilterChange('difficulty', diff, pageNum);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Removed slugs from here to prevent re-triggering filter load from main data load effect

  const sidebarFiltersProps = {
    selectedTopic: sectionSlug, // Represents the current section/main topic context
    selectedCategory: topicSlug, // Represents the specific category/sub-topic context
    selectedKeyword: selectedKeywordState,
    selectedDifficulty: selectedDifficultyState,
    onSelectKeyword: (keyword: string) => handleFilterChange('keyword', keyword, 1),
    onSelectDifficulty: (difficulty: string) => handleFilterChange('difficulty', difficulty, 1),
    isLoadingKeyword: loadingKeywordQuestions,
    isLoadingDifficulty: loadingDifficultyQuestions,
    // domain: domainSlug, // If SidebarFilters is updated to take domain for keywords
  };

  const displayedQuestions = selectedKeywordState ? keywordQuestions : (selectedDifficultyState ? difficultyQuestions : currentTopicDetails?.questions || []);
  const topicCategoriesForDisplay: ClientCategoryItem[] = currentTopicDetails?.subtopics 
    ? Object.values(currentTopicDetails.subtopics).map(st => ({ id: st.id || st.label, label: st.label })) 
    : [];

  const contentDisplayProps = {
    selectedTopic: sectionSlug,
    selectedCategory: topicSlug,
    selectedKeyword: selectedKeywordState,
    selectedDifficulty: selectedDifficultyState,
    categoryDetails: currentTopicDetails,
    topicCategories: topicCategoriesForDisplay, // No cast needed if structurally compatible
    keywordQuestions: selectedKeywordState ? displayedQuestions : [],
    difficultyQuestions: selectedDifficultyState ? displayedQuestions : [],
    loadingCategories: isLoadingDetails,
    loadingSections: isLoadingDetails,
    onSelectCategory: (categoryId: string) => {
      // This navigation depends on what categoryId represents.
      // If topicSlug is a section, and categoryId is a topic in it:
      router.push(`/topics/${domainSlug}/${topicSlug}/${categoryId}`); 
      // If topicSlug is already the final topic, this might select a sub-section within its content, 
      // or this handler might not be used by ContentDisplay in that mode.
    },
    currentPage,
    totalPages,
    totalResults: displayedQuestions.length > 0 ? totalResults : (currentTopicDetails?.questions?.length || 0),
    onPageChange: handlePageChange,
    domain: domainSlug,
    highlightedQuestionId: highlightedQuestionId ? parseInt(highlightedQuestionId) : undefined, // Try parsing, ensure QuestionList handles string/number ID
  };
  
  if (isLoadingDetails && !currentTopicDetails && displayedQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <TopicDataProvider initialTopicData={rawTopicDataFromHook as any}>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <aside className="w-full lg:w-1/4 xl:w-1/5">
          <SidebarFilters {...sidebarFiltersProps} />
        </aside>
        <main className="flex-1 lg:w-3/4 xl:w-4/5">
          <ContentDisplay {...contentDisplayProps} />
        </main>
      </div>
    </TopicDataProvider>
  );
} 