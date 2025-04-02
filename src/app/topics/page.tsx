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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { topicData } = useTopicData();

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedCategory(null); // Reset category selection when topic changes
  };

  const handleCloseTopicTree = () => {
    setSelectedTopic(null);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleBackToMainCategories = () => {
    setSelectedCategory(null);
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
      <div key={topicId} className="mb-1.5">
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
          onClick={() => hasChildren ? toggleTopic(topicId) : null}
        >
          {hasChildren && (
            <span className="mr-2 text-gray-500 w-4 inline-block font-mono text-sm">
              {isExpanded ? '[-]' : '[+]'}
            </span>
          )}
          {!hasChildren && <span className="mr-2 w-4 inline-block font-mono text-sm">[·]</span>}
          <span className="font-mono text-sm">{topic.label}</span>
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

  // Get all main categories for the current topic
  const getMainCategories = () => {
    if (!selectedTopic || !topicData || !topicData[selectedTopic]?.subtopics) return [];
    return Object.entries(topicData[selectedTopic].subtopics);
  };

  // Get all subtopics for a specific category
  const getCategorySubtopics = (categoryId: string) => {
    if (!selectedTopic || !topicData || !topicData[selectedTopic]?.subtopics || 
        !topicData[selectedTopic].subtopics[categoryId]?.subtopics) return [];
    
    return Object.entries(topicData[selectedTopic].subtopics[categoryId].subtopics);
  };

  const mainCategories = getMainCategories();

  // Main ML categories
  const mlCategories = [
    { id: 'foundations', label: 'Foundations of Machine Learning' },
    { id: 'supervised', label: 'Supervised Learning' },
    { id: 'unsupervised', label: 'Unsupervised Learning' },
    { id: 'neural-networks', label: 'Neural Networks' },
    { id: 'model-evaluation', label: 'Model Evaluation' },
    { id: 'math-foundations', label: 'Mathematical Foundations' },
    { id: 'data-preprocessing', label: 'Data Preprocessing and Exploration' }
  ];

  // Mid column topics
  const midColumnTopics = [
    { id: 'advanced-regression', label: 'Advanced Regression Techniques' },
    { id: 'classification', label: 'Classification Techniques' },
    { id: 'decision-trees', label: 'Decision Trees and Random Forests' },
    { id: 'naive-bayes', label: 'Naive Bayes' },
    { id: 'ensemble-methods', label: 'Ensemble Methods' },
    { id: 'validation', label: 'Validation Techniques' },
    { id: 'clustering-algorithms', label: 'Clustering Algorithms', 
      subtopics: [
        { id: 'kmeans', label: 'K-Means' },
        { id: 'hierarchical', label: 'Hierarchical Clustering' },
        { id: 'dbscan', label: 'DBSCAN' },
        { id: 'gmm', label: 'Gaussian Mixture Models (GMM)' }
      ] 
    }
  ];

  // Right column topics
  const rightColumnTopics = [
    { id: 'dimensionality-reduction', label: 'Dimensionality Reduction Techniques' },
    { id: 'autoencoders', label: 'Autoencoders' },
    { id: 'nn-architectures', label: 'Neural Network Architectures' },
    { id: 'deep-learning', label: 'Advanced Deep Learning' },
    { id: 'bayesian-methods', label: 'Bayesian Methods' },
    { id: 'markov-models', label: 'Markov Models' },
    { id: 'sampling-methods', label: 'Sampling Methods' },
    { id: 'optimization', label: 'Optimization and Model Tuning' },
    { id: 'feature-engineering', label: 'Feature Engineering' },
    { id: 'time-series', label: 'Time Series Analysis' },
    { id: 'practical-ml', label: 'Practical ML and Deployment' },
    { id: 'emerging-trends', label: 'Emerging Trends' }
  ];

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
              {selectedTopic ? (
                // Show improved topic tree when a topic is selected
                <div className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold">
                        {mainTopics.find(topic => topic.id === selectedTopic)?.label || 'Selected Topic'} Topic Tree
                      </h2>
                      {selectedCategory && (
                        <button
                          onClick={handleBackToMainCategories}
                          className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back to Categories
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleCloseTopicTree}
                      className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  
                  {/* Main topic categories */}
                  <div className="flex flex-wrap">
                    {selectedCategory === null ? (
                      // Show all main categories when no specific category is selected
                      <div className="w-full grid grid-cols-3 gap-4 animate-fadeIn">
                        {mlCategories.map((category, index) => (
                          <div 
                            key={category.id}
                            className="transform transition-all duration-300 ease-in-out animate-slideRight"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div 
                              className="bg-gray-100 px-3 py-2 uppercase text-sm tracking-wider cursor-pointer hover:bg-gray-200 transition-colors rounded"
                              onClick={() => handleCategorySelect(category.id)}
                            >
                              {category.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Show detailed view for the selected category
                      <div className="w-full animate-fadeIn">
                        {/* Left column - Selected main category and its direct subtopics */}
                        <div className="flex flex-wrap">
                          <div className="w-3/12 pr-4 space-y-3 animate-slideRight">
                            <div className="bg-gray-100 px-3 py-2 uppercase text-sm tracking-wider rounded">
                              {mlCategories.find(cat => cat.id === selectedCategory)?.label || 'Selected Category'}
                            </div>
                            <div className="ml-2 pl-4 border-l border-gray-200">
                              {selectedCategory === 'supervised' && (
                                <>
                                  <div className="mb-1.5 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                      <span className="mr-2 text-gray-500 w-4 inline-block font-mono text-sm">[+]</span>
                                      <span className="font-mono text-sm">Regression Methods</span>
                                    </div>
                                  </div>
                                  <div className="mb-1.5 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                                    <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                      <span className="mr-2 text-gray-500 w-4 inline-block font-mono text-sm">[+]</span>
                                      <span className="font-mono text-sm">Classification Techniques</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              {selectedCategory === 'unsupervised' && (
                                <>
                                  <div className="mb-1.5 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                      <span className="mr-2 text-gray-500 w-4 inline-block font-mono text-sm">[+]</span>
                                      <span className="font-mono text-sm">Clustering</span>
                                    </div>
                                  </div>
                                  <div className="mb-1.5 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                                    <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                      <span className="mr-2 text-gray-500 w-4 inline-block font-mono text-sm">[+]</span>
                                      <span className="font-mono text-sm">Dimensionality Reduction</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              {selectedCategory === 'foundations' && (
                                <div className="mb-1.5 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                                  <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                    <span className="mr-2 text-gray-500 w-4 inline-block font-mono text-sm">[+]</span>
                                    <span className="font-mono text-sm">Core Concepts</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Middle column - Related topics */}
                          <div className="w-5/12 px-4 space-y-3 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                            {midColumnTopics.map((topic, index) => (
                              <div key={topic.id} className="animate-fadeIn" style={{ animationDelay: `${0.2 + index * 0.05}s` }}>
                                <div className="bg-gray-100 px-3 py-2 uppercase text-sm tracking-wider rounded">
                                  {topic.label}
                                </div>
                                {topic.subtopics && (
                                  <div className="ml-2 pl-4 border-l border-gray-200">
                                    {topic.subtopics.map((subtopic, subIndex) => (
                                      <div 
                                        key={subtopic.id} 
                                        className="mb-1.5 animate-fadeIn" 
                                        style={{ animationDelay: `${0.3 + subIndex * 0.05}s` }}
                                      >
                                        <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                          <span className="mr-2 text-gray-500 w-4 inline-block font-mono text-sm">[+]</span>
                                          <span className="font-mono text-sm">{subtopic.label}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Right column */}
                          <div className="w-4/12 pl-4 space-y-3 animate-slideLeft">
                            {rightColumnTopics.map((topic, index) => (
                              <div 
                                key={topic.id} 
                                className="bg-gray-100 px-3 py-2 uppercase text-sm tracking-wider rounded animate-fadeIn" 
                                style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                              >
                                {topic.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
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
              )}
              
              {/* Topic list */}
              <div className="space-y-3 mt-8 border-t border-gray-200 pt-8">
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