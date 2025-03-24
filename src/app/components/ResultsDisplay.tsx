import React from 'react';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  error?: string;
  markdown?: string; // Optional markdown content from Crawl4AI
  metadata?: {
    author?: string;
    date?: string;
    tags?: string[];
    [key: string]: any;
  }
}

interface ResultsDisplayProps {
  results: SearchResult[];
  isLoading: boolean;
  searchTerm: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  isLoading,
  searchTerm,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 rounded-lg border bg-white">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0 && searchTerm) {
    return (
      <div className="p-8 rounded-lg border bg-white">
        <p className="text-center text-slate-900">
          No results found for &quot;{searchTerm}&quot;. Try another topic or keyword.
        </p>
      </div>
    );
  }

  if (!searchTerm) {
    return null;
  }
  
  // Check if we only have error results
  const hasOnlyErrors = results.length > 0 && results.every(result => result.error);

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold text-slate-900">
          Results for &quot;{searchTerm}&quot;
        </h2>
      </div>
      
      {hasOnlyErrors && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">There was an error processing your search</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>We encountered a problem retrieving results. You can:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Try a different search term</li>
                  <li>Visit <a href={`https://aiml.com/?s=${encodeURIComponent(searchTerm)}`} className="underline" target="_blank" rel="noopener noreferrer">aiml.com</a> directly</li>
                  <li>Try again later</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ul className="divide-y">
        {results.map((result, index) => (
          <li key={index} className="p-6 hover:bg-gray-50 transition-colors">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h3 className="text-lg font-medium text-blue-600 hover:underline">
                {result.title}
              </h3>
              {result.description && (
                <p className="mt-1 text-slate-900">{result.description}</p>
              )}
              
              {/* Display markdown preview if available */}
              {result.markdown && !result.error && (
                <div className="mt-2 p-3 bg-gray-50 text-gray-700 text-sm rounded">
                  <p className="font-bold text-xs uppercase text-gray-500 mb-1">Preview</p>
                  {result.markdown.substring(0, 150)}
                  {result.markdown.length > 150 ? '...' : ''}
                </div>
              )}
              
              {/* Display metadata if available */}
              {result.metadata && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.metadata.tags && result.metadata.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                  
                  {result.metadata.author && (
                    <span className="text-sm text-gray-600 ml-2">
                      By: {result.metadata.author}
                    </span>
                  )}
                  
                  {result.metadata.date && (
                    <span className="text-sm text-gray-600 ml-2">
                      {new Date(result.metadata.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              
              <p className="mt-2 text-sm text-slate-700">{result.url}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultsDisplay; 