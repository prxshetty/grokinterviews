"use client";

import { useState, useEffect } from 'react';

interface Content {
  content_id: number | string;
  content_type: string;
  content: string | null;
  media_url: string | null;
  caption: string | null;
  subtype: string | null;
  youtube_video_id?: string;
}

interface ContentDisplayProps {
  questionId: number | null;
}

export default function ContentDisplay({ questionId }: ContentDisplayProps) {
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!questionId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/content?questionId=${questionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data);
      } catch (err) {
        setError('Error loading content. Please try again.');
        console.error('Error fetching content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [questionId]);

  if (!questionId) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Answer</h2>
        <div className="p-6 text-gray-500 italic">
          Please select a question to view the answer.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Answer</h2>
        <div className="p-6">Loading content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Answer</h2>
        <div className="p-6 text-red-500">{error}</div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Answer</h2>
        <div className="p-6 text-gray-500">No content available for this question.</div>
      </div>
    );
  }

  return (
    <div className="card shadow-card overflow-hidden">
      <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Answer</h2>
      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto hide-scrollbar">
        {content.map((item) => (
          <div key={item.content_id} className="mb-4">
            {item.content_type === 'text' && item.content && (
              <div className="prose max-w-none">
                {item.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-3 text-gray-800">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {item.content_type === 'image' && item.media_url && (
              <div className="mt-4">
                <img
                  src={item.media_url}
                  alt={item.caption || 'Image'}
                  className="max-w-full rounded-md shadow-sm"
                />
                {item.caption && (
                  <p className="mt-2 text-sm text-gray-600 italic">{item.caption}</p>
                )}
              </div>
            )}

            {item.content_type === 'video' && item.youtube_video_id && (
              <div className="mt-6 mb-6">
                <div className="relative pb-[56.25%] h-0">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                    src={`https://www.youtube.com/embed/${item.youtube_video_id}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                {item.caption && (
                  <p className="mt-3 text-sm text-gray-600 italic">{item.caption}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}