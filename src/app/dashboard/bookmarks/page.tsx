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

// Function to build the proper URL structure for question navigation with enhanced scrolling
function buildQuestionUrl(bookmark: Bookmark): string {
  if (!bookmark.domain) {
    // Fallback to simple URL if domain is missing
    return `/topics?q=${bookmark.questionId}`;
  }

  // Build the complete URL structure for proper navigation and scrolling
  // Since we don't have the exact section ID from bookmarks, we'll use a name-based approach
  // The TopicPageClient has been updated to handle section name fallbacks
  
  let categoryParam = '';
  if (bookmark.sectionName) {
    // Create a header-style ID from section name
    // Convert "Foundations of Artificial Intelligence" -> "header-foundations-of-artificial-intelligence"
    const sectionSlug = bookmark.sectionName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
    categoryParam = `header-${sectionSlug}`;
  } else {
    // Fallback: use a category-based parameter that won't match header format
    // This will trigger the else branch in TopicPageClient for direct topic loading
    categoryParam = `bookmark-topic-${bookmark.topicId}`;
  }

  const url = new URL(`/topics/${bookmark.domain}`, 'http://localhost:3000'); // Base URL doesn't matter for relative links
  
  // Add all necessary parameters for proper navigation
  url.searchParams.set('category', categoryParam);
  url.searchParams.set('subtopic', `topic-${bookmark.topicId}`);
  url.searchParams.set('q', bookmark.questionId.toString());
  url.searchParams.set('categoryId', bookmark.categoryId.toString());

  // Return just the pathname + search params (relative URL)
  return url.pathname + url.search;
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
    <div className="min-h-screen bg-transparent text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pt-20 sm:pt-24 md:pt-32">
        <div className="flex flex-col">
          <div className="w-full flex-shrink-0 mb-8">
            <h2 className="text-xl sm:text-2xl font-light text-foreground mb-4 sm:mb-6">
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
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-lg text-card-foreground p-4 sm:p-6 rounded-lg border border-border text-center shadow-lg">
              <p className="text-destructive text-sm sm:text-base">{error}</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-lg text-card-foreground p-4 sm:p-6 rounded-lg border border-border text-center shadow-lg">
              <p className="text-muted-foreground text-sm sm:text-base">
                You don't have any bookmarked questions yet. Click the bookmark icon on questions to save them for later.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedBookmarks).map(([domainName, domainBookmarks]) => (
                <div key={domainName} className="bg-white/80 dark:bg-black/80 backdrop-blur-lg text-card-foreground rounded-lg border border-border overflow-hidden shadow-lg">
                  <div className="bg-white/60 dark:bg-black/60 backdrop-blur-sm px-4 sm:px-6 py-3 border-b border-border">
                    <h2 className="text-sm font-medium text-foreground">{domainName}</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {domainBookmarks.map(bookmark => (
                      <div key={bookmark.id} className="p-4 sm:p-6">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <p className="text-sm sm:text-base font-medium text-foreground pr-2 break-words">
                                {bookmark.questionText}
                              </p>
                              <span className="text-xs text-muted-foreground flex-shrink-0 self-start">{bookmark.timeAgo}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center text-xs text-muted-foreground gap-1 sm:gap-2">
                              {bookmark.domain && <span className="bg-muted/50 px-2 py-1 rounded text-xs">[{bookmark.domain.toUpperCase()}]</span>}
                              {bookmark.sectionName && <span className="hidden sm:inline">{bookmark.sectionName}</span>}
                              <span className="hidden sm:inline">&gt;</span>
                              <span>{bookmark.categoryName}</span>
                            </div>
                            <div className="mt-3">
                              <Link
                                href={buildQuestionUrl(bookmark)}
                                className="inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                              >
                                View Question
                                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
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
