'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardNav from '../DashboardNav';
import LoadingSpinner from '../../components/ui/LoadingSpinner';


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

  // Group bookmarks by topic
  const groupedBookmarks: Record<string, Bookmark[]> = {};
  bookmarks.forEach(bookmark => {
    const topicName = bookmark.topicName || 'Other';

    if (!groupedBookmarks[topicName]) {
      groupedBookmarks[topicName] = [];
    }

    groupedBookmarks[topicName].push(bookmark);
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-800 dark:text-gray-200 p-8 pt-0">
      {/* Top Bar - Below Main Navigation */}
      <div className="sticky top-16 bg-white dark:bg-black py-4 z-40 border-b border-gray-200 dark:border-gray-800 mb-8">
        <DashboardNav />
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-medium text-gray-900 dark:text-white">
          Bookmarks
        </h1>
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
        <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            You don't have any bookmarked questions yet. Click the bookmark icon on questions to save them for later.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBookmarks).map(([topicName, topicBookmarks]) => (
            <div key={topicName} className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{topicName}</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {topicBookmarks.map(bookmark => (
                  <div key={bookmark.id} className="p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {bookmark.questionText}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{bookmark.timeAgo}</span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                          {bookmark.domain && <span>[{bookmark.domain.toUpperCase()}]</span>}
                          {bookmark.sectionName && <span>{bookmark.sectionName}</span>}
                          <span>&gt;</span>
                          <span>{bookmark.categoryName}</span>
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/topics?questionId=${bookmark.questionId}`}
                            className="text-xs font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
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
  );
}
