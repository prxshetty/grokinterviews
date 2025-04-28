'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  SidebarFilters,
  ContentDisplay,
} from '@/app/components/topic';
import ProgressSaver from '@/app/components/utils/ProgressSaver';
import TopicDataService from '@/services/TopicDataService';
import { useTopicData } from '@/app/hooks';
import { getDomainKeywords } from '@/app/utils';

// Import types
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

export default function Page() {
  // Get domain from data attribute set by layout component
  const [domain, setDomain] = useState<string>('');
  
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
  const keywordParam = searchParams.get('q');
  const difficultyParam = searchParams.get('difficulty');
  const questionIdParam = searchParams.get('questionId');
  
  const [selectedTopic, setSelectedTopic] = useState<string | null>(domain || null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [topicCategories, setTopicCategories] = useState<CategoryItem[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<TopicItem | null>(null);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [loadingSections, setLoadingSections] = useState<boolean>(false);
  
  // Update selectedTopic when domain changes
  useEffect(() => {
    if (domain) {
      setSelectedTopic(domain);
      loadTopicCategories(domain);
    }
  }, [domain]);
  
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
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(keywordParam);
  const [keywordQuestions, setKeywordQuestions] = useState<QuestionType[]>([]);
  const [loadingKeywordQuestions, setLoadingKeywordQuestions] = useState<boolean>(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(pageParam ? parseInt(pageParam) : 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  
  // Difficulty filtering states
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(difficultyParam);
  const [difficultyQuestions, setDifficultyQuestions] = useState<QuestionType[]>([]);
  const [loadingDifficultyQuestions, setLoadingDifficultyQuestions] = useState(false);
  
  // State for highlighted question (from URL)
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<number | undefined>(
    questionIdParam ? parseInt(questionIdParam) : undefined
  );
  
  const { topicData } = useTopicData();
  
  const router = useRouter();
  const pathname = usePathname();
  
  // Handle topic selection
  const handleTopicClick = async (topicId: string) => {
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
  };
  
  // Load topic categories (sections)
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
  
  // Handle category selection
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
  
  // Load details for a selected category
  const loadCategoryDetails = async (categoryId: string) => {
    console.log('topics/page - loadCategoryDetails called with:', categoryId);
    console.log('topics/page - Current selectedTopic:', selectedTopic);

    if (!selectedTopic) {
      console.log('topics/page - No topic selected, setting to ml');
      setSelectedTopic('ml');
    }

    setLoadingSections(true); // Set loading state for sections
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
  };
  
  // Handle back button click
  const handleBackToMainCategories = () => {
    setSelectedCategory(null);
    setCategoryDetails(null);
  };
  
  // Preload subtopic progress data for a domain
  const preloadSubtopicProgressForDomain = async (domain: string) => {
    // Implementation left as is from original page.tsx
    // This would be the fetchSectionProgress and related functions
  };
  
  // Handle keyword selection
  const handleKeywordSelect = async (keyword: string, page: number = 1) => {
    // Update URL instead of directly fetching data
    const params = new URLSearchParams(searchParams);
    
    // Toggle keyword selection if already selected
    if (selectedKeyword === keyword) {
      params.delete('q');
    } else {
      params.set('q', keyword);
      params.set('page', page.toString());
    }
    
    // Build the new URL and navigate
    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
    
    // The useEffect with the keywordParam dependency will handle the actual data fetching
    return;
  };
  
  // Handle difficulty selection
  const handleDifficultySelect = async (difficulty: string, page: number = 1) => {
    console.log(`handleDifficultySelect called with difficulty: ${difficulty}, current domain: ${domain}, page: ${page}`);
    
    // If difficulty is empty string, treat it as null (clearing the filter)
    if (!difficulty) {
      setSelectedDifficulty(null);
      setDifficultyQuestions([]);
      
      // Remove difficulty from URL
      const params = new URLSearchParams(searchParams);
      params.delete('difficulty');
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
      return;
    }
    
    // Update URL with difficulty and page
    const params = new URLSearchParams(searchParams);
    params.set('difficulty', difficulty);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
    
    // Set loading state
    setSelectedDifficulty(difficulty);
    setLoadingDifficultyQuestions(true);
    
    try {
      // If a category is selected, filter its questions by difficulty
      if (selectedCategory && categoryDetails?.questions) {
        console.log(`Filtering category questions by difficulty: ${difficulty}`);
        // Filter locally from already loaded questions
        const filteredQuestions = categoryDetails.questions.filter(q => 
          q.difficulty === difficulty
        );
        console.log(`Found ${filteredQuestions.length} matching questions in category`);
        setDifficultyQuestions(filteredQuestions);
        setTotalResults(filteredQuestions.length);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        // Otherwise fetch from API ensuring domain is always included
        const currentDomain = selectedTopic || domain;
        if (!currentDomain) {
          console.error("No domain selected for difficulty filter");
          setDifficultyQuestions([]);
          return;
        }
        
        const url = `/api/questions/difficulty?difficulty=${difficulty}&domain=${currentDomain}&page=${page}`;
        console.log(`Fetching questions with URL: ${url}`);
        
        const response = await fetch(url);
        console.log(`API response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`API returned ${data.questions?.length || 0} questions for difficulty "${difficulty}" in domain "${currentDomain}"`);
          
          if (data.questions && data.questions.length > 0) {
            // Log the first question to verify domain matching
            const firstQuestion = data.questions[0];
            console.log(`First question: ID=${firstQuestion.id}, difficulty=${firstQuestion.difficulty}, domain=${firstQuestion.categories?.topics?.domain}`);
          }
          
          setDifficultyQuestions(data.questions || []);
          
          // Set pagination data
          if (data.pagination) {
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
            setTotalResults(data.pagination.totalCount);
          }
        } else {
          console.error(`API error: ${response.statusText}`);
          const errorData = await response.json();
          console.error('Error details:', errorData);
          setDifficultyQuestions([]);
        }
      }
    } catch (error) {
      console.error(`Error fetching questions for difficulty ${difficulty}:`, error);
      setDifficultyQuestions([]);
    } finally {
      setLoadingDifficultyQuestions(false);
    }
  };
  
  // Handle page change for pagination
  const handlePageChange = (newPage: number) => {
    // Don't do anything if we're already on this page
    if (newPage === currentPage) return;
    
    if (selectedKeyword && newPage >= 1 && newPage <= totalPages) {
      // Update URL with new page number for keyword search
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      
      // Build the new URL and navigate
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    } else if (selectedDifficulty && newPage >= 1 && newPage <= totalPages) {
      // Update URL with new page number for difficulty filter
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      
      // Build the new URL and navigate
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
      
      // Fetch new page of difficulty filtered questions
      handleDifficultySelect(selectedDifficulty, newPage);
    }
  };
  
  // Initialize and handle URL parameters
  useEffect(() => {
    // If domain is provided and loaded, set it as selected topic
    if (domain) {
      setSelectedTopic(domain);
      loadTopicCategories(domain);
    
      // If keyword is provided in URL, fetch related questions
      if (keywordParam) {
        setSelectedKeyword(keywordParam);
        setCurrentPage(parseInt(pageParam || '1'));
        setLoadingKeywordQuestions(true);
        
        fetchKeywordQuestions(keywordParam, parseInt(pageParam || '1'))
          .then(data => {
            if (data) {
              setKeywordQuestions(data.questions || []);
              setTotalPages(data.pagination?.totalPages || 1);
              setTotalResults(data.pagination?.totalCount || 0);
            }
          })
          .finally(() => {
            setLoadingKeywordQuestions(false);
          });
      } else {
        // Clear keyword-related state if no keyword in URL
        setSelectedKeyword(null);
        setKeywordQuestions([]);
      }
      
      // If difficulty is provided in URL, apply filter
      if (difficultyParam) {
        const pageToFetch = parseInt(pageParam || '1');
        handleDifficultySelect(difficultyParam, pageToFetch);
      } else {
        // Clear difficulty filter state if not in URL
        setSelectedDifficulty(null);
        setDifficultyQuestions([]);
      }
    }
  }, [domain]); // Only re-run when domain changes
  
  // Helper function to fetch keyword questions
  const fetchKeywordQuestions = async (keyword: string, page: number = 1) => {
    try {
      let url = `/api/questions/keywords?keyword=${encodeURIComponent(keyword)}&page=${page}`;
      if (selectedTopic) {
        url += `&domain=${selectedTopic}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error fetching questions for keyword ${keyword}:`, error);
    }
    return null;
  };
  
  // Clear filters when topic changes
  useEffect(() => {
    // Reset keyword state if topic changes
    if (selectedKeyword) {
      setSelectedKeyword(null);
      setKeywordQuestions([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalResults(0);
    }
    
    // Reset difficulty state if topic changes
    if (selectedDifficulty) {
      console.log(`Topic changed to ${selectedTopic}, clearing difficulty filter.`);
      setSelectedDifficulty(null);
      setDifficultyQuestions([]);
      setLoadingDifficultyQuestions(false);
    }
  }, [selectedTopic]);
  
  // Effect to load difficulty questions when URL parameters change
  useEffect(() => {
    if (difficultyParam && pageParam) {
      const page = parseInt(pageParam);
      if (page !== currentPage || !difficultyQuestions.length) {
        console.log(`Loading page ${page} of questions with difficulty ${difficultyParam}`);
        handleDifficultySelect(difficultyParam, page);
      }
    }
  }, [difficultyParam, pageParam]);
  
  return (
    <div className="bg-white dark:bg-black min-h-screen pt-4">
      {/* Component to save progress when navigating away */}
      <ProgressSaver />
      
      <div className="w-full px-0">
        <div className="transition-opacity duration-300">
          <div className="p-0">
            {/* Navigation tabs removed - now only using TopicNavWrapper from MainNavigation */}
            
            {/* Filters section - shown when a topic is selected */}
            {(selectedTopic || selectedCategory) && (
              <SidebarFilters
                selectedTopic={selectedTopic}
                selectedCategory={selectedCategory}
                selectedKeyword={selectedKeyword}
                selectedDifficulty={selectedDifficulty}
                onSelectKeyword={handleKeywordSelect}
                onSelectDifficulty={handleDifficultySelect}
                isLoadingKeyword={loadingKeywordQuestions}
                isLoadingDifficulty={loadingDifficultyQuestions}
              />
            )}
            
            {/* Main content area */}
            <ContentDisplay
              selectedTopic={selectedTopic}
              selectedCategory={selectedCategory}
              selectedKeyword={selectedKeyword}
              selectedDifficulty={selectedDifficulty}
              categoryDetails={categoryDetails}
              topicCategories={topicCategories}
              keywordQuestions={keywordQuestions}
              difficultyQuestions={difficultyQuestions}
              loadingCategories={loadingCategories}
              loadingSections={loadingSections}
              onSelectCategory={handleCategorySelect}
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              onPageChange={handlePageChange}
              domain={domain}
              highlightedQuestionId={highlightedQuestionId}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 