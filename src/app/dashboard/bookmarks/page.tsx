'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Tag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabNav } from '@/components/ui/tab-nav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- SVG Illustrations defined as proper functions ---
function AIIllustration(props: { className?: string }) {
  return <svg viewBox="0 0 200 160" {...props}><defs><linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#A855F7" /></linearGradient></defs><circle cx="100" cy="80" r="60" fill="url(#aiGrad)" opacity="0.1" /><circle cx="100" cy="80" r="40" fill="url(#aiGrad)" opacity="0.2" /><circle cx="100" cy="80" r="20" fill="url(#aiGrad)" opacity="0.4" /><path d="M80 70 Q100 50 120 70 Q100 90 80 70" fill="url(#aiGrad)" opacity="0.6" /><circle cx="90" cy="75" r="3" fill="#8B5CF6" /><circle cx="110" cy="75" r="3" fill="#8B5CF6" /><path d="M95 85 Q100 90 105 85" stroke="#8B5CF6" strokeWidth="2" fill="none" /></svg>;
}
function MLIllustration(props: { className?: string }) {
  return <svg viewBox="0 0 200 160" {...props}><defs><linearGradient id="mlGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient></defs><rect x="40" y="100" width="8" height="40" fill="url(#mlGrad)" opacity="0.6" /><rect x="60" y="80" width="8" height="60" fill="url(#mlGrad)" opacity="0.7" /><rect x="80" y="60" width="8" height="80" fill="url(#mlGrad)" opacity="0.8" /><rect x="100" y="40" width="8" height="100" fill="url(#mlGrad)" opacity="0.9" /><rect x="120" y="70" width="8" height="70" fill="url(#mlGrad)" opacity="0.8" /><rect x="140" y="90" width="8" height="50" fill="url(#mlGrad)" opacity="0.7" /><path d="M45 105 Q75 45 105 45 Q135 75 145 95" stroke="#3B82F6" strokeWidth="3" fill="none" opacity="0.8" /></svg>;
}
function SystemDesignIllustration(props: { className?: string }) {
  return <svg viewBox="0 0 200 160" {...props}><defs><linearGradient id="sysGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs><circle cx="60" cy="60" r="15" fill="url(#sysGrad)" opacity="0.8" /><circle cx="140" cy="60" r="15" fill="url(#sysGrad)" opacity="0.8" /><circle cx="100" cy="100" r="15" fill="url(#sysGrad)" opacity="0.8" /><circle cx="60" cy="130" r="15" fill="url(#sysGrad)" opacity="0.8" /><circle cx="140" cy="130" r="15" fill="url(#sysGrad)" opacity="0.8" /><line x1="75" y1="60" x2="125" y2="60" stroke="#10B981" strokeWidth="3" opacity="0.6" /><line x1="70" y1="70" x2="90" y2="90" stroke="#10B981" strokeWidth="3" opacity="0.6" /><line x1="130" y1="70" x2="110" y2="90" stroke="#10B981" strokeWidth="3" opacity="0.6" /><line x1="90" y1="110" x2="70" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.6" /><line x1="110" y1="110" x2="130" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.6" /></svg>;
}
function DSAIllustration(props: { className?: string }) {
  return <svg viewBox="0 0 200 160" {...props}><defs><linearGradient id="dsaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#D97706" /></linearGradient></defs><rect x="50" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" /><rect x="80" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" /><rect x="110" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" /><rect x="50" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" /><rect x="80" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.9" /><rect x="110" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" /><rect x="50" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" /><rect x="80" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" /><rect x="110" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" /><path d="M140 70 L160 50 L180 70 L160 90 Z" fill="url(#dsaGrad)" opacity="0.7" /></svg>;
}
function WebDevIllustration(props: { className?: string }) {
  return <svg viewBox="0 0 200 160" {...props}><defs><linearGradient id="webGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6366F1" /><stop offset="100%" stopColor="#4F46E5" /></linearGradient></defs><rect x="50" y="40" width="100" height="80" rx="8" fill="url(#webGrad)" opacity="0.1" /><rect x="50" y="40" width="100" height="15" rx="8" fill="url(#webGrad)" opacity="0.8" /><circle cx="60" cy="47.5" r="2.5" fill="#6366F1" /><circle cx="70" cy="47.5" r="2.5" fill="#6366F1" /><circle cx="80" cy="47.5" r="2.5" fill="#6366F1" /><rect x="60" y="65" width="30" height="8" fill="url(#webGrad)" opacity="0.6" /><rect x="60" y="80" width="50" height="4" fill="url(#webGrad)" opacity="0.4" /><rect x="60" y="90" width="40" height="4" fill="url(#webGrad)" opacity="0.4" /><rect x="120" y="65" width="20" height="25" fill="url(#webGrad)" opacity="0.5" /></svg>;
}
function OtherIllustration(props: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>;
}

const DOMAIN_ILLUSTRATIONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ai: AIIllustration,
  ml: MLIllustration,
  sdesign: SystemDesignIllustration,
  dsa: DSAIllustration,
  webdev: WebDevIllustration,
  other: OtherIllustration
};

const DOMAIN_NAMES: Record<string, string> = {
    ai: 'Artificial Intelligence',
    ml: 'Machine Learning',
    sdesign: 'System Design',
    dsa: 'Data Structures & Algorithms',
    webdev: 'Web Development',
    other: 'Other'
}

const allDomains = ['all', ...Object.keys(DOMAIN_NAMES).filter(d => d !== 'other')];

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
    const Illustration = DOMAIN_ILLUSTRATIONS[bookmark.domain || 'other'] || DOMAIN_ILLUSTRATIONS['other'] as React.ComponentType<{ className?: string }>;
    return (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors duration-300">
                        <Illustration className="w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-800 dark:text-gray-200 leading-snug mb-2 break-words">
                            {bookmark.questionText}
                        </p>
                        <div className="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-x-3 gap-y-1 mb-4">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {DOMAIN_NAMES[bookmark.domain || 'other'] || 'Other'}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {bookmark.timeAgo}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                {bookmark.sectionName} &gt; {bookmark.categoryName}
                            </div>
                            <Link
                                href={buildQuestionUrl(bookmark)}
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                View Question
                                <svg className="ml-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function BookmarksPage() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pt-20 sm:pt-24 md:pt-32">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl font-normal leading-tight text-gray-900 dark:text-gray-100">
            Your Bookmarks
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            All your saved questions, organized and ready for review.
          </p>
        </header>

        <div className="sticky top-16 backdrop-blur-lg z-10 py-4 mb-8 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Filter by Domain</p>
                    <TabNav
                        items={allDomains.map(domain => ({ id: domain, label: DOMAIN_NAMES[domain] || 'All' }))}
                        activeTab={selectedDomain}
                        onTabChange={setSelectedDomain}
                        variant="button"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sort by</p>
                    <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="desc">Newest First</SelectItem>
                            <SelectItem value="asc">Oldest First</SelectItem>
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
