'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui';


interface Bookmark {
  id: string;
  questionId: number;
  questionText: string;
  topicId: number;
  topicName: string;
  categoryId: number;
  categoryName: string;
  domain: string | null;
  sectionName: string | null;
  createdAt: string;
  updatedAt: string;
  timeAgo: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/bookmarks');
        if (!response.ok) {
          throw new Error('Failed to fetch bookmarks');
        }
        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setError('Failed to load your bookmarks');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  // Group bookmarks by domain
  const groupedBookmarks: Record<string, Bookmark[]> = {};
  bookmarks.forEach(bookmark => {
    const domainName = bookmark.domain?.toUpperCase() || 'Other';

    if (!groupedBookmarks[domainName]) {
      groupedBookmarks[domainName] = [];
    }

    groupedBookmarks[domainName].push(bookmark);
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col">
          <div className="w-full flex-shrink-0 mb-8">
            <h2 className="text-2xl font-light text-foreground mb-6">
              Bookmarks
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner 
                size="lg" 
                color="primary" 
                text="Loading your bookmarks..."
                centered={true}
              />
            </div>
          ) : error ? (
            <div className="bg-card text-card-foreground p-6 rounded-lg border border-border text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="bg-card text-card-foreground p-6 rounded-lg border border-border text-center">
              <p className="text-muted-foreground">
                You don't have any bookmarked questions yet. Click the bookmark icon on questions to save them for later.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedBookmarks).map(([domainName, domainBookmarks]) => (
                <div key={domainName} className="bg-card text-card-foreground rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted px-6 py-3 border-b border-border">
                    <h2 className="text-sm font-medium text-foreground">{domainName}</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {domainBookmarks.map(bookmark => (
                      <div key={bookmark.id} className="p-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {bookmark.questionText}
                              </p>
                              <span className="text-xs text-muted-foreground">{bookmark.timeAgo}</span>
                            </div>
                            <div className="mt-1 flex items-center text-xs text-muted-foreground space-x-2">
                              {bookmark.domain && <span>[{bookmark.domain.toUpperCase()}]</span>}
                              {bookmark.sectionName && <span>{bookmark.sectionName}</span>}
                              <span>&gt;</span>
                              <span>{bookmark.categoryName}</span>
                            </div>
                            <div className="mt-2">
                              <Link
                                href={`/topics?questionId=${bookmark.questionId}`}
                                className="text-xs font-medium text-primary hover:text-primary/90"
                              >
                                View Question
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
