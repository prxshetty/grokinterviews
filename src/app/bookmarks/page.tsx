'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabNav } from '@/components/ui/tab-nav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DOMAIN_OPTIONS, getDomainLabel } from '@/config/domain.constants';
import { DOMAIN_ILLUSTRATIONS } from '@/components/topics-ui/DomainIllustrations';

const allDomains = ['all', ...DOMAIN_OPTIONS.map(option => option.id)];

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

function buildQuestionUrl(bookmark: Bookmark): string {
  if (!bookmark.domain) {
    return `/topics?q=${bookmark.questionId}`;
  }
  const sectionSlug = bookmark.sectionName
      ? `header-${bookmark.sectionName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()}`
      : `bookmark-topic-${bookmark.topicId}`;

  const url = new URL(`/topics/${bookmark.domain}`, 'http://localhost:3000');
  url.searchParams.set('category', sectionSlug);
  url.searchParams.set('subtopic', `topic-${bookmark.topicId}`);
  url.searchParams.set('q', bookmark.questionId.toString());
  url.searchParams.set('categoryId', bookmark.categoryId.toString());
  return url.pathname + url.search;
}

const BookmarkCard = ({ bookmark }: { bookmark: Bookmark }) => {
    const Illustration = (bookmark.domain ? DOMAIN_ILLUSTRATIONS[bookmark.domain as keyof typeof DOMAIN_ILLUSTRATIONS] : null) ?? DOMAIN_ILLUSTRATIONS['other'] as React.ComponentType<{ className?: string }>
    return (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                            {bookmark.sectionName} &gt; {bookmark.categoryName}
                        </div>
                        <p className="text-base font-medium text-gray-800 dark:text-gray-200 leading-snug break-words">
                            {bookmark.questionText}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <Illustration className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getDomainLabel(bookmark.domain || 'other')}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 h-full">
                        <Link
                            href={buildQuestionUrl(bookmark)}
                            aria-label="View question"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full text-blue-600 hover:text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            <Clock className="w-3 h-3 inline mr-1" />{bookmark.timeAgo}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/bookmarks');
        if (!response.ok) throw new Error('Failed to fetch bookmarks');
        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setError('Failed to load your bookmarks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const processedBookmarks = useMemo(() => {
    return bookmarks
      .filter(b => selectedDomain === 'all' || b.domain === selectedDomain)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [bookmarks, selectedDomain, sortOrder]);

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl font-editorial font-light font-normal leading-tight text-gray-900 dark:text-gray-100">
            Your Bookmarks
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            All your saved questions, organized and ready for review.
          </p>
        </header>

        <div className="sticky top-16 z-10 py-4 mb-8 border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                    <TabNav
                        items={allDomains.map(domain => ({ id: domain, label: domain === 'all' ? 'All' : getDomainLabel(domain) }))}
                        activeTab={selectedDomain}
                        onTabChange={setSelectedDomain}
                        variant="button"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                        <SelectTrigger className="w-full sm:w-auto h-8 text-xs rounded-full border-gray-300/60 dark:border-gray-600/60 [&_svg]:size-3">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="desc">
                                <span className="font-medium">Newest</span>
                            </SelectItem>
                            <SelectItem value="asc">
                                <span className="font-medium">Oldest</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Loading your bookmarks..." centered={true} />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No bookmarks yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start saving questions to find them here later.</p>
            <div className="mt-6">
                <Button asChild>
                    <Link href="/topics">Explore Topics</Link>
                </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {processedBookmarks.length > 0 ? (
                processedBookmarks.map(bookmark => (
                    <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                ))
            ) : (
                <div className="text-center py-20">
                    <p className="text-lg text-gray-600 dark:text-gray-400">No bookmarks found for the selected domain.</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookmarksPage;