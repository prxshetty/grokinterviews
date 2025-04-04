"use client";

import { useState } from 'react';
import { useTopicData } from './TopicDataProvider';

interface TopicTreeViewProps {
  topicId: string;
  onClose: () => void;
}

export default function TopicTreeView({ topicId, onClose }: TopicTreeViewProps) {
  const { topicData } = useTopicData();
  const [searchValue, setSearchValue] = useState('');

  // Get the selected topic data
  const selectedTopic = topicData[topicId] || null;

  // Function to handle clicking on a topic header
  const handleTopicClick = (subtopicId: string) => {
    // Close the tree view
    onClose();

    // Scroll to the selected topic's questions section
    setTimeout(() => {
      const element = document.getElementById(`topic-${subtopicId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  if (!selectedTopic) {
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
            <h2 className="text-2xl font-bold">{selectedTopic.label}</h2>
            <p className="text-gray-500 text-sm mt-1">SEARCH BY TAGS</p>
          </div>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full uppercase cursor-pointer hover:bg-gray-400 transition-colors">Beginner</span>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full uppercase cursor-pointer hover:bg-gray-400 transition-colors">Expert</span>
            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full uppercase cursor-pointer hover:bg-gray-400 transition-colors">Technical</span>
          </div>
        </div>

        {/* Topic tree - grid layout matching the first image */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(selectedTopic.subtopics || {}).map(([subtopicId, subtopic]: [string, any]) => {
              return (
                <div
                  key={subtopicId}
                  className="bg-gray-100 dark:bg-gray-800 px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded"
                  onClick={() => handleTopicClick(subtopicId)}
                >
                  <div className="font-medium text-sm uppercase tracking-wider">
                    {subtopic.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}