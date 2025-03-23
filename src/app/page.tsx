'use client';

import { useState, useEffect } from 'react';
import TopicSelector from './components/TopicSelector';
import JobRoleSelector from './components/JobRoleSelector';
import SearchBar from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export default function Home() {
  const [predefinedTopics, setPredefinedTopics] = useState<string[]>([]);
  const [jobRoles, setJobRoles] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch topics and job roles on component mount
  useEffect(() => {
    const fetchTopicsAndRoles = async () => {
      try {
        const response = await fetch('/api/job-topics');
        const data = await response.json();
        setPredefinedTopics(data.predefinedTopics);
        setJobRoles(data.jobRoles);
      } catch (error) {
        console.error('Error fetching topics and roles:', error);
      }
    };

    fetchTopicsAndRoles();
  }, []);

  // Handle topic selection
  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    setSelectedRole(null);
    setIsLoading(true);
    
    try {
      await fetchResults(topic);
      setSearchTerm(topic);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job role selection
  const handleRoleSelect = async (role: string) => {
    setSelectedRole(role);
    setSelectedTopic(null);
    setIsLoading(true);
    
    try {
      // First get topics for this role
      const response = await fetch(`/api/job-topics?role=${encodeURIComponent(role)}`);
      const data = await response.json();
      
      // If topics exist for this role, search for the first one
      if (data.topics && data.topics.length > 0) {
        await fetchResults(data.topics[0]);
        setSearchTerm(`${role} (${data.topics[0]})`);
      } else {
        // Fallback to searching for the role itself
        await fetchResults(role);
        setSearchTerm(role);
      }
    } catch (error) {
      console.error('Error fetching results for role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom search
  const handleSearch = async (query: string) => {
    setSelectedTopic(null);
    setSelectedRole(null);
    setIsLoading(true);
    
    try {
      await fetchResults(query);
      setSearchTerm(query);
    } catch (error) {
      console.error('Error with custom search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch search results
  const fetchResults = async (query: string) => {
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    setResults(data.results || []);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-blue-800">Grok Interviews</h1>
          <p className="text-xl text-gray-600">
            Your one-stop resource for Data Science interview preparation
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <TopicSelector
              topics={predefinedTopics}
              selectedTopic={selectedTopic}
              onSelectTopic={handleTopicSelect}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <JobRoleSelector
              jobRoles={jobRoles}
              selectedRole={selectedRole}
              onSelectRole={handleRoleSelect}
            />
          </div>
        </div>

        <ResultsDisplay
          results={results}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      </div>
    </main>
  );
}
