'use client';

import { useState, useEffect } from 'react';
import TopicSelector from './components/TopicSelector';
import JobRoleSelector from './components/JobRoleSelector';
import SearchBar from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';

// ... existing code ...

  return (
    <main className="min-h-screen bg-gray-50 py-12 text-black">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-black">Grok Interviews</h1>
          <p className="text-xl text-black">
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