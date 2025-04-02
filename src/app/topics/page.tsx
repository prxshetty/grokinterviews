"use client";

import { useState, useEffect } from 'react';
import { useTopicData } from '../components/TopicDataProvider';

// Main topics with their corresponding colors
const mainTopics = [
  { id: 'ml', label: 'Machine Learning', color: 'bg-blue-500' },
  { id: 'ai', label: 'Artificial Intelligence', color: 'bg-red-500' },
  { id: 'webdev', label: 'Web Development', color: 'bg-gray-300' },
  { id: 'system-design', label: 'System Design', color: 'bg-yellow-300' },
  { id: 'dsa', label: 'Data Structures & Algorithms', color: 'bg-green-500' }
];

type TopicData = {
  [key: string]: {
    label: string;
    subtopics: {
      [key: string]: {
        label: string;
        subtopics?: any;
      }
    }
  }
};

export default function TopicsPage() {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { topicData } = useTopicData();

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
  };

  const handleCloseTopicTree = () => {
    setSelectedTopic(null);
  };

  const handleSearchIconClick = () => {
    setShowSearchModal(true);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
  };

  // Expand some initial topics when the selected topic changes
  useEffect(() => {
    if (selectedTopic && topicData && topicData[selectedTopic]?.subtopics) {
      const initialExpanded = new Set(Object.keys(topicData[selectedTopic].subtopics).slice(0, 3));
      setExpandedTopics(initialExpanded);
    }
  }, [selectedTopic, topicData]);

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

  // Renders a topic and its children recursively for the inline tree view
  const renderTopicNode = (topic: any, topicId: string, depth: number = 0) => {
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
              renderTopicNode(childTopic, childId, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Organize subtopics into columns
  const organizeIntoColumns = () => {
    if (!selectedTopic || !topicData || !topicData[selectedTopic]?.subtopics) return [];
    
    const subtopics = Object.entries(topicData[selectedTopic].subtopics);
    const columnCount = 4;
    const itemsPerColumn = Math.ceil(subtopics.length / columnCount);
    
    const columns = [];
    for (let i = 0; i < subtopics.length; i += itemsPerColumn) {
      columns.push(subtopics.slice(i, i + itemsPerColumn));
    }
    
    return columns;
  };

  const columns = organizeIntoColumns();

  return (
    <div className="bg-white min-h-screen">
      <div className="w-full">
        {/* Main content area */}
        <div className={`transition-opacity duration-300 ${showSearchModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="p-0">
            {/* Navigation tabs */}
            <div className="flex justify-between items-center border-b border-gray-200">
              <div className="flex flex-1">
                {mainTopics.map(topic => (
                  <button 
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className={`px-4 py-3 font-small text-bold uppercase hover:bg-gray-100 transition ${selectedTopic === topic.id ? 'bg-gray-100' : ''}`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={handleSearchIconClick}
                className="px-4 py-3 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Content area */}
            <div className="p-6">
              {/* Topic metadata grid or selected topic tree */}
              {!selectedTopic ? (
                // Show metadata grid when no topic is selected
                <div className="grid grid-cols-4 gap-10 mb-12 pb-8 border-b border-gray-200">
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 mb-2">TYPE</h3>
                    <div className="space-y-1">
                      <p>Technical</p>
                      <p>Behavioral</p>
                      <p>System Design</p>
                      <p>Coding</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 mb-2">DIFFICULTY</h3>
                    <div className="space-y-1">
                      <p>Easy</p>
                      <p>Medium</p>
                      <p>Hard</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 mb-2">FORMAT</h3>
                    <div className="space-y-1">
                      <p>Written</p>
                      <p>Live Coding</p>
                      <p>Whiteboard</p>
                      <p>Take-Home</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 mb-2">COMPANIES</h3>
                    <div className="space-y-1">
                      <p>FAANG</p>
                      <p>Startups</p>
                      <p>Finance</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Show topic tree when a topic is selected
                <div className="mb-12 pb-8 border-b border-gray-200">
                  <div className="text-xs uppercase text-gray-500 mb-4">TOPIC TREE</div>
                  <div className="grid grid-cols-4 gap-6">
                    {columns.map((column, colIndex) => (
                      <div key={colIndex} className="topic-column">
                        {column.map(([subtopicId, subtopic]: [string, any]) => 
                          renderTopicNode(subtopic, subtopicId)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Topic list */}
              <div className="space-y-3">
              <h1 className="text-4xl font-bold mb-8">
                {selectedTopic 
                  ? mainTopics.find(topic => topic.id === selectedTopic)?.label || 'Selected Topic'
                  : 'All Topics'}
              </h1>
                {mainTopics.map((topic, index) => (
                  <div 
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className="flex items-center py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="w-12 text-xl font-medium">{String(index + 1).padStart(2, '0')}</div>
                    <div className={`w-4 h-4 ${topic.color} mr-6`}></div>
                    <div className="flex-grow font-medium">{topic.label}</div>
                    <div className="flex space-x-2">
                      {topic.id === 'ml' && (
                        <>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Algorithms</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Deep Learning</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Statistics</span>
                        </>
                      )}
                      {topic.id === 'ai' && (
                        <>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">NLP</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Computer Vision</span>
                        </>
                      )}
                      {topic.id === 'webdev' && (
                        <>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Frontend</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Backend</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">React</span>
                        </>
                      )}
                      {topic.id === 'system-design' && (
                        <>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Scaling</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Databases</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Microservices</span>
                        </>
                      )}
                      {topic.id === 'dsa' && (
                        <>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Arrays</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Graphs</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full uppercase">Dynamic Programming</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Search modal - now only covers the navigation area */}
        {showSearchModal && (
          <div className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-200">
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
                placeholder={selectedTopic 
                  ? `search in ${mainTopics.find(topic => topic.id === selectedTopic)?.label || 'selected topic'}...` 
                  : "search topics..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
              />
              <button 
                onClick={closeSearchModal}
                className="p-4 flex items-center text-gray-700 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Recent searches */}
            <div className="grid grid-cols-5 gap-2 p-4 bg-gray-100">
              {[
                { term: 'sparkling water', time: '27min ago', location: 'London' },
                { term: 'meat golden', time: '28min ago', location: 'London' },
                { term: 'tapenade', time: '41min ago', location: 'London' },
                { term: 'simply sauces', time: '31min ago', location: 'London' },
                { term: 'steamed buns', time: '11min ago', location: 'London' }
              ].map((search, index) => (
                <div key={index} className="p-2">
                  <div className="text-xs text-gray-500">{search.time}</div>
                  <div className="text-xs text-gray-500">in {search.location}</div>
                  <div className="mt-2 text-sm font-medium">{search.term}</div>
                </div>
              ))}
            </div>

            {/* Categories section */}
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-2">categories</div>
              
              {/* Popular categories */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">popular</div>
                <div className="flex flex-wrap gap-2">
                  {['turkish', 'meat', 'european', 'asian', 'chinese', 'mediterranean', 'thai', 'german', 'south american', 'argentinian', 'filipino', 'italian'].map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-full cursor-pointer hover:bg-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Other categories */}
              <div className="flex flex-wrap gap-2">
                {['coffee and tea', 'alcohol', 'dairy', 'baked goods', 'general', 'specialty', 'seafood', 'produce', 'beverages', 'meat', 'supplies', 'french'].map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full cursor-pointer hover:bg-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 