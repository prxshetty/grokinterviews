"use client";

import { useState, useEffect } from 'react';
import { useTopicData } from './TopicDataProvider';

interface TopicTreeViewProps {
  topicId: string;
  onClose: () => void;
}

export default function TopicTreeView({ topicId, onClose }: TopicTreeViewProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { topicData } = useTopicData();
  const [searchValue, setSearchValue] = useState('');

  // Get the selected topic data
  const selectedTopic = topicData[topicId] || null;

  // Expand some initial topics when component mounts
  useEffect(() => {
    if (selectedTopic?.subtopics) {
      const initialExpanded = new Set(Object.keys(selectedTopic.subtopics).slice(0, 3));
      setExpandedTopics(initialExpanded);
    }
  }, [topicId, selectedTopic]);

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

  const toggleTopic = (subtopicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subtopicId)) {
        newSet.delete(subtopicId);
      } else {
        newSet.add(subtopicId);
      }
      return newSet;
    });
  };

  // Renders a topic and its children recursively
  const renderTopic = (topic: any, topicId: string, depth: number = 0) => {
    const hasChildren = topic.subtopics && Object.keys(topic.subtopics).length > 0;
    const isExpanded = expandedTopics.has(topicId);
    
    return (
      <div key={topicId} className="mb-2">
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1"
          onClick={() => hasChildren ? toggleTopic(topicId) : null}
        >
          {hasChildren && (
            <span className="mr-2 text-gray-500 w-4 inline-block">
              {isExpanded ? '[-]' : '[+]'}
            </span>
          )}
          {!hasChildren && <span className="mr-2 w-4 inline-block">[·]</span>}
          <span className="font-mono">{topic.label}</span>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="pl-6 border-l border-gray-200 ml-2 mt-1">
            {Object.entries(topic.subtopics).map(([childId, childTopic]: [string, any]) => 
              renderTopic(childTopic, childId, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Organize subtopics into columns
  const organizeIntoColumns = () => {
    if (!selectedTopic.subtopics) return [];
    
    const subtopics = Object.entries(selectedTopic.subtopics);
    const columnCount = 5;
    const itemsPerColumn = Math.ceil(subtopics.length / columnCount);
    
    const columns = [];
    for (let i = 0; i < subtopics.length; i += itemsPerColumn) {
      columns.push(subtopics.slice(i, i + itemsPerColumn));
    }
    
    return columns;
  };

  const columns = organizeIntoColumns();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-start justify-center pt-12">
      <div className="w-full max-w-6xl bg-white text-black rounded-lg overflow-hidden">
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
            className="p-4 flex items-center text-gray-700 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title and info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold">{selectedTopic.label}</h2>
          <p className="text-gray-500 text-sm mt-1">SEARCH BY TAGS</p>
        </div>

        {/* Topic tree */}
        <div className="p-6">
          <div className="grid grid-cols-5 gap-4">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="topic-column">
                {column.map(([subtopicId, subtopic]: [string, any]) => 
                  renderTopic(subtopic, subtopicId)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 