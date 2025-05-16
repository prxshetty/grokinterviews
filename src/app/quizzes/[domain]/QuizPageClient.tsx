'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopicDataService from '@/services/TopicDataService';
import { QuizTopicNav } from '@/app/components/quiz-ui';
import QuizInterface from '@/app/components/quiz-ui/QuizInterface';

// Define types
type CategoryItem = {
  id: string;
  label: string;
};

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

// Props for the client component
interface QuizPageClientProps {
  initialDomain: string;
}

export default function QuizPageClient({ initialDomain }: QuizPageClientProps) {
  const [domain, setDomain] = useState<string>(initialDomain);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(domain || null);
  const [topicCategories, setTopicCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuestionType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);

  const router = useRouter();

  // Update selectedTopic when domain changes
  useEffect(() => {
    if (domain && domain !== 'quizzes') {
      setSelectedTopic(domain);
      loadTopicCategories(domain);
    } else {
      // Reset to default state if we're at the quizzes landing page
      setSelectedTopic(null);
      setTopicCategories([]);
      setSelectedCategory(null);
      setQuizQuestions([]);
    }
  }, [domain]);

  // Handle topic selection
  const handleTopicSelect = async (topicId: string) => {
    console.log('Topic selected:', topicId);

    // If clicking the same topic that is already selected, force a complete refresh
    if (selectedTopic === topicId) {
      router.replace(`/quizzes/${topicId}`);
      return;
    }

    // Set the selected topic
    setSelectedTopic(topicId);

    // Reset other states
    setSelectedCategory(null);
    setQuizQuestions([]);

    // Load topic categories
    await loadTopicCategories(topicId);

    // Navigate to the correct /quizzes/[domain] page
    router.push(`/quizzes/${topicId}`);
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
    console.log('Category selected:', categoryId);
    setSelectedCategory(categoryId);

    // Load questions for this category
    await loadQuestionsForQuiz(categoryId);
  };

  // Load questions for the quiz
  const loadQuestionsForQuiz = async (categoryId: string) => {
    setLoadingQuestions(true);
    console.log(`Loading questions for quiz with categoryId: ${categoryId}`);
    try {
      // Check if this is a section header ID (format: header-123)
      if (categoryId.startsWith('header-')) {
        console.log(`This is a section header: ${categoryId}`);

        // Extract the header number and get the section name
        const headerNumber = parseInt(categoryId.replace('header-', ''), 10);
        const response = await fetch(`/api/section-headers?domain=${domain}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch section headers: ${response.statusText}`);
        }

        const sectionHeaders = await response.json();
        const sectionHeader = sectionHeaders.find((header: any) => header.id === headerNumber);

        if (!sectionHeader) {
          throw new Error(`Could not find section header with ID ${headerNumber}`);
        }

        // Fetch topics in this section
        const sectionResponse = await fetch(`/api/topics/by-section?domain=${domain}&sectionName=${encodeURIComponent(sectionHeader.name)}`);
        if (!sectionResponse.ok) {
          throw new Error(`Failed to fetch section: ${sectionResponse.statusText}`);
        }
        const topicsInSection = await sectionResponse.json();

        // Get questions for all topics in this section
        const allQuestions: QuestionType[] = [];
        for (const topic of topicsInSection) {
          // Fetch questions directly for this topic using the categories API
          console.log(`Fetching categories for topic ID: ${topic.id}`);
          const categoriesResponse = await fetch(`/api/topics/categories/db-route?topicId=${topic.id}`);
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            console.log(`Categories data for topic ${topic.id}:`, categoriesData);
            const topicKey = Object.keys(categoriesData)[0];

            if (topicKey && categoriesData[topicKey]) {
              // For each category in this topic, fetch its questions
              for (const categoryId of Object.keys(categoriesData[topicKey])) {
                const questionsResponse = await fetch(`/api/questions?categoryId=${categoryId}`);
                if (questionsResponse.ok) {
                  const questionsData = await questionsResponse.json();
                  if (questionsData.questions && questionsData.questions.length > 0) {
                    allQuestions.push(...questionsData.questions);
                  }
                }
              }
            } else {
              // Try fetching questions directly by topic ID as fallback
              console.log(`No categories found for topic ${topic.id}, trying direct questions API`);
              const directQuestionsResponse = await fetch(`/api/questions?topicId=${topic.id}`);
              if (directQuestionsResponse.ok) {
                const directQuestionsData = await directQuestionsResponse.json();
                if (directQuestionsData.questions && directQuestionsData.questions.length > 0) {
                  console.log(`Found ${directQuestionsData.questions.length} questions directly by topic ID ${topic.id}`);
                  allQuestions.push(...directQuestionsData.questions);
                }
              }
            }
          }
        }

        // Randomize and limit to 10 questions
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        setQuizQuestions(shuffled.slice(0, 10));
      } else {
        // This is a regular topic ID, fetch its categories and questions
        const topicId = categoryId.replace('topic-', '');

        // Fetch categories for this topic
        console.log(`Fetching categories for topic ID: ${topicId}`);
        const categoriesResponse = await fetch(`/api/topics/categories/db-route?topicId=${topicId}`);
        if (!categoriesResponse.ok) {
          console.error(`Failed to fetch categories for topic ${topicId}: ${categoriesResponse.statusText}`);
          throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
        }

        const categoriesData = await categoriesResponse.json();
        console.log(`Categories data for topic ${topicId}:`, categoriesData);
        const topicKey = Object.keys(categoriesData)[0];

        if (!topicKey || !categoriesData[topicKey]) {
          console.log('No categories found for this topic, trying direct questions API');

          // Try fetching questions directly by topic ID
          const directQuestionsResponse = await fetch(`/api/questions?topicId=${topicId}`);
          if (directQuestionsResponse.ok) {
            const directQuestionsData = await directQuestionsResponse.json();
            if (directQuestionsData.questions && directQuestionsData.questions.length > 0) {
              console.log(`Found ${directQuestionsData.questions.length} questions directly by topic ID`);
              const shuffled = directQuestionsData.questions.sort(() => 0.5 - Math.random());
              setQuizQuestions(shuffled.slice(0, 10));
            } else {
              console.log('No questions found directly by topic ID');
              setQuizQuestions([]);
            }
          } else {
            console.log('Failed to fetch questions directly by topic ID');
            setQuizQuestions([]);
          }
          return;
        }

        // Fetch questions for each category
        const allQuestions: QuestionType[] = [];
        for (const categoryId of Object.keys(categoriesData[topicKey])) {
          const questionsResponse = await fetch(`/api/questions?categoryId=${categoryId}`);
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            if (questionsData.questions && questionsData.questions.length > 0) {
              allQuestions.push(...questionsData.questions);
            }
          }
        }

        // Randomize and limit to 10 questions
        if (allQuestions.length > 0) {
          const shuffled = allQuestions.sort(() => 0.5 - Math.random());
          setQuizQuestions(shuffled.slice(0, 10));
        } else {
          setQuizQuestions([]);
        }
      }
    } catch (error) {
      console.error(`Error loading questions for quiz:`, error);
      setQuizQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handle back button click
  const handleBackToTopics = () => {
    setSelectedCategory(null);
    setQuizQuestions([]);
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen">
      <div className="w-full px-0">
        <div className="transition-opacity duration-300">
          <div className="p-0">
            {/* Topic Navigation - always show for domain selection */}
            <div className="topic-navigation w-full sticky top-12 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-0 mt-0 border-b border-gray-200 dark:border-gray-800">
              <div className="w-full">
                <QuizTopicNav
                  onTopicSelect={handleTopicSelect}
                  selectedTopic={selectedTopic}
                />
              </div>
            </div>

            {/* Main content area */}
            <div className="container mx-auto px-4 md:px-6 py-8">
              {selectedTopic && !selectedCategory && !loadingCategories && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 text-center">Select a Topic for Your Quiz</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topicCategories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="text-lg font-medium">{category.label}</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Test your knowledge with a quiz on this topic
                        </p>
                        <div className="mt-4 text-right">
                          <span className="inline-block px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-xs rounded-full">
                            Start Quiz
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTopic && selectedCategory && (
                <QuizInterface
                  questions={quizQuestions}
                  isLoading={loadingQuestions}
                  onBackClick={handleBackToTopics}
                  topicName={topicCategories.find(cat => cat.id === selectedCategory)?.label || 'Quiz'}
                />
              )}

              {loadingCategories && (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-purple-400"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
