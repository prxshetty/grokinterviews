"use client";

import { useState, useEffect } from 'react';
import { useTopicData } from './TopicDataProvider';
import { ProgressBar } from '../ui/ProgressBar';
import { fetchCategoryProgress } from '@/app/utils/progress';

interface TopicTreeViewProps {
  topicId: string;
  onClose: () => void;
}

interface SectionHeader {
  id: number;
  name: string;
  progress?: {
    questionsCompleted: number;
    totalQuestions: number;
    completionPercentage: number;
  };
}

export default function TopicTreeView({ topicId, onClose }: TopicTreeViewProps) {
  const { topicData } = useTopicData();
  const [searchValue, setSearchValue] = useState('');
  const [sectionHeaders, setSectionHeaders] = useState<SectionHeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the selected topic data
  const selectedTopic = topicData[topicId] || null;

  // Fetch section headers from the database
  useEffect(() => {
    const fetchSectionHeaders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch section headers for the domain (e.g., 'ml')
        const response = await fetch(`/api/section-headers?domain=${topicId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch section headers: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('TopicTreeView - Received section headers:', data);

        // Fetch progress data for each section header
        const headersWithProgress = await Promise.all(
          (data || []).map(async (header: SectionHeader) => {
            try {
              if (header.id) {
                const progress = await fetchCategoryProgress(header.id);
                console.log(`Progress for section ${header.name} (ID: ${header.id}):`, progress);
                return { ...header, progress };
              }
              return header;
            } catch (error) {
              console.error(`Failed to fetch progress for section ${header.id}:`, error);
              return header;
            }
          })
        );

        setSectionHeaders(headersWithProgress || []);
      } catch (err) {
        console.error('Error fetching section headers:', err);
        setError('Failed to load section headers');
      } finally {
        setIsLoading(false);
      }
    };

    if (topicId) {
      fetchSectionHeaders();
    }

    // Set up an event listener for question completion
    const handleQuestionCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Question completed event detected:', customEvent.detail);
      console.log('Refreshing progress data for section headers');
      if (topicId) {
        fetchSectionHeaders();
      }
    };

    window.addEventListener('questionCompleted', handleQuestionCompleted);

    return () => {
      window.removeEventListener('questionCompleted', handleQuestionCompleted);
    };
  }, [topicId]);

  // Function to handle clicking on a topic header
  const handleTopicClick = (headerId: string) => {
    // Close the tree view
    onClose();

    // Scroll to the selected topic's questions section
    setTimeout(() => {
      const element = document.getElementById(`topic-${headerId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Filter section headers based on search value
  const filteredHeaders = searchValue.trim() === ''
    ? sectionHeaders
    : sectionHeaders.filter(header =>
        header.name.toLowerCase().includes(searchValue.toLowerCase())
      );

  if (!selectedTopic && !topicId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-start justify-center pt-12">
        <div className="w-full max-w-4xl bg-white text-black rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Topic not found</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-start justify-center pt-12">
      <div className="w-full max-w-6xl bg-white text-black rounded-lg overflow-hidden shadow-2xl">
        {/* Search header */}
        <div className="flex border-b border-gray-200">
          <div className="p-4 flex items-center text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="flex-1 py-4 px-2 text-lg text-gray-700 placeholder-gray-400 focus:outline-none"
            placeholder="search topics..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-4 flex items-center text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title and info */}
        <div className="px-6 py-5 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{selectedTopic?.label || topicId.toUpperCase()}</h2>
            <p className="text-gray-500 text-sm mt-1">SECTION HEADERS</p>
          </div>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full uppercase cursor-pointer hover:bg-gray-400 transition-colors">Beginner</span>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full uppercase cursor-pointer hover:bg-gray-400 transition-colors">Expert</span>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full uppercase cursor-pointer hover:bg-gray-400 transition-colors">Technical</span>
          </div>
        </div>

        {/* Topic tree - grid layout with section headers */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading section headers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredHeaders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchValue.trim() !== ''
                  ? 'No matching section headers found.'
                  : 'No section headers available for this topic.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredHeaders.map((header) => (
                <div
                  key={header.id}
                  className="bg-gray-100 dark:bg-gray-800 px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded"
                  onClick={() => handleTopicClick(`header-${header.id}`)}
                >
                  <div className="font-medium text-sm uppercase tracking-wider">
                    {header.name}
                  </div>
                  {header.progress && (
                    <div className="mt-2">
                      <ProgressBar
                        progress={header.progress.completionPercentage}
                        completed={header.progress.questionsCompleted}
                        total={header.progress.totalQuestions}
                        height="sm"
                        showText={false}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Back to Categories and Close buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Categories
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}