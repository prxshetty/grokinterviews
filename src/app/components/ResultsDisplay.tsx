import React from 'react';

interface SearchResult {
  title: string;
  url: string;
  description: string;
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
        <p className="text-center text-gray-500">
          No results found for &quot;{searchTerm}&quot;. Try another topic or keyword.
        </p>
      </div>
    );
  }

  if (!searchTerm) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold">
          Results for &quot;{searchTerm}&quot;
        </h2>
      </div>
      <ul className="divide-y">
        {results.map((result, index) => (
          <li key={index} className="p-4 hover:bg-gray-50 transition-colors">
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
                <p className="mt-1 text-gray-600">{result.description}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">{result.url}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultsDisplay; 