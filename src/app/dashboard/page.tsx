'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ProgressSaver from '../components/progress/ProgressSaver';
import { ActivityGrid } from '../components/progress';
import DashboardNav from './DashboardNav';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

// Placeholder data - Replace with actual data fetching later
const staticData = {
  overviewValue: 23.4,
  overviewChange: 28.1,
  revenue: 93012.02,
  taxes: 12002.00,
  opex: 16.50,
  users: 21230,
  usersChange: 2.8,
  sessions: 30230,
  sessionsChange: -1.2, // Example negative change
  sessionDuration: '11m 02s',
  sessionDurationChange: 3.0,
  pageViews: 120009,
  pageViewsChange: 2.8,
  weeklyTraffic: 3002,
  newOrders: 389,
  highestCampaigns: [
    { provider: 'Arief Muh', avatar: '/placeholder-avatar.png', sales: 880, goal: 880, status: 'Achieved' },
    { provider: 'Pamboo Puls', avatar: '/placeholder-avatar.png', sales: 1550, goal: 1722, status: 'On-Process' },
    { provider: 'Monoku.Inc', avatar: '/placeholder-avatar.png', sales: 2490, goal: 2250, status: 'Achieved' },
    { provider: 'Praz Teguh', avatar: '/placeholder-avatar.png', sales: 3700, goal: 2722, status: 'Achieved' },
    { provider: 'Adsmupro', avatar: '/placeholder-avatar.png', sales: 820, goal: 1020, status: 'On-Process' },
    { provider: 'Intania Raya', avatar: '/placeholder-avatar.png', sales: 5759, goal: 5722, status: 'Achieved' },
  ],
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState({
    questionsCompleted: 0,
    questionsViewed: 0,
    totalQuestions: 0,
    completionPercentage: 0,
    domainsSolved: 0,
    totalDomains: 0
  });
  interface ActivityItem {
    id: string;
    activityType: string;
    topicId: string;
    topicName: string;
    categoryId: string;
    categoryName: string;
    questionId: number;
    questionText: string;
    createdAt: string;
    displayText: string;
    timeAgo: string;
  }

  const [activityData, setActivityData] = useState<{
    activities: ActivityItem[];
    loading: boolean;
    error: string | null;
  }>({
    activities: [],
    loading: true,
    error: null
  });

  // User stats state
  const [userStats, setUserStats] = useState<{
    totalTimeSpent: number;
    apiCallsMade: number;
    bookmarksCount: number;
    lastActive: string | null;
    questionsAnswered: number;
    topicsExplored: number;
    avgTimePerQuestion: number;
    preferredModel: string;
    joinDate: string | null;
    loading: boolean;
    error: string | null;
  }>({
    totalTimeSpent: 0,
    apiCallsMade: 0,
    bookmarksCount: 0,
    lastActive: null,
    questionsAnswered: 0,
    topicsExplored: 0,
    avgTimePerQuestion: 0,
    preferredModel: '',
    joinDate: null,
    loading: true,
    error: null
  });
  // Domain stats state
  interface DomainStat {
    domain: string;
    domainName: string;
    totalQuestions: number;
    completedQuestions: number;
    completionPercentage: number;
    color: string;
  }

  const [domainStats, setDomainStats] = useState<{
    domains: DomainStat[];
    totalDomains: number;
    loading: boolean;
    error: string | null;
  }>({
    domains: [],
    totalDomains: 0,
    loading: true,
    error: null
  });

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin'); // Redirect if not logged in
        return;
      }

      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*') // Fetch all fields to match UserProfile type
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Handle error appropriately, maybe show a default name
      } else if (profileData) {
        setProfile(profileData);
      }

      // Fetch user progress data
      try {
        const response = await fetch('/api/user/progress');
        if (response.ok) {
          const data = await response.json();
          if (data.totalQuestions > 0) {
            data.completionPercentage = (data.questionsCompleted / data.totalQuestions) * 100;
          } else {
            data.completionPercentage = 0;
          }
          setProgressData(data);
        } else {
          console.error('Failed to fetch progress data');
        }
      } catch (err) {
        console.error('Error fetching progress data:', err);
      }

      setLoading(false);
    };

    checkUserAndProfile();
  }, [supabase, router]);

  // Fetch activity data when loading is complete
  useEffect(() => {
    const fetchActivityData = async () => {
      setActivityData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch('/api/user/activity?limit=3');
        if (response.ok) {
          const data = await response.json();
          setActivityData({
            activities: data.activities,
            loading: false,
            error: null
          });
        } else {
          console.error('Failed to fetch activity data:', response.status);
          setActivityData(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch activity data'
          }));
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setActivityData(prev => ({
          ...prev,
          loading: false,
          error: 'Error fetching activity data'
        }));
      }
    };

    const fetchUserStats = async () => {
      setUserStats(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch('/api/user/stats');
        if (response.ok) {
          const data = await response.json();
          setUserStats({
            ...data,
            loading: false,
            error: null
          });
        } else {
          console.error('Failed to fetch user stats:', response.status);
          setUserStats(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch user stats'
          }));
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setUserStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error fetching user stats'
        }));
      }
    };

    const fetchDomainStats = async () => {
      setDomainStats(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch('/api/user/domains');
        if (response.ok) {
          const data = await response.json();
          setDomainStats({
            domains: data.domains,
            totalDomains: data.totalDomains,
            loading: false,
            error: null
          });
        } else {
          console.error('Failed to fetch domain stats:', response.status);
          setDomainStats(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch domain stats'
          }));
        }
      } catch (error) {
        console.error('Error fetching domain stats:', error);
        setDomainStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error fetching domain stats'
        }));
      }
    };

    if (!loading) {
      fetchActivityData();
      fetchUserStats();
      fetchDomainStats();
    }
  }, [loading]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  // Function to fetch user stats
  const fetchUserStats = async () => {
    setUserStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats({
          ...data,
          loading: false,
          error: null
        });
      } else {
        console.error('Failed to fetch user stats:', response.status);
        setUserStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch user stats'
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats(prev => ({
        ...prev,
        loading: false,
        error: 'Error fetching user stats'
      }));
    }
  };

  // Function to fetch domain stats
  const fetchDomainStats = async () => {
    setDomainStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/user/domains');
      if (response.ok) {
        const data = await response.json();
        setDomainStats({
          domains: data.domains,
          totalDomains: data.totalDomains,
          loading: false,
          error: null
        });
      } else {
        console.error('Failed to fetch domain stats:', response.status);
        setDomainStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch domain stats'
        }));
      }
    } catch (error) {
      console.error('Error fetching domain stats:', error);
      setDomainStats(prev => ({
        ...prev,
        loading: false,
        error: 'Error fetching domain stats'
      }));
    }
  };

  // Function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US');
  };

  // Helper function to get status color for campaign status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Achieved':
        return 'text-green-500 dark:text-green-400';
      case 'On-Process':
        return 'text-yellow-500 dark:text-yellow-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="xl" 
        color="primary" 
        text="Loading dashboard..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Component to save progress when navigating away */}
        <ProgressSaver />

        {/* Main Content Container */}
        <div className="flex flex-col">
          {/* Navigation */}
          <div className="w-full flex-shrink-0 mb-8">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-6">Dashboard</h2>
            <Suspense fallback={<div className="text-center p-4">Loading Nav...</div>}>
              <DashboardNav />
            </Suspense>
          </div>

          {/* Greeting */}
          <div className="flex items-center mb-8">
            <h1 className="text-3xl font-medium text-gray-900 dark:text-white">
              {getGreeting()}, {profile?.full_name || profile?.username || 'User'}
            </h1>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column (Overview + Weekly Traffic) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Overview Widget */}
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overview</h2>
                  <button
                    onClick={async () => {
                      try {
                        // Manually save any completed questions
                        const completedQuestions = JSON.parse(sessionStorage.getItem('completedQuestions') || '[]');
                        if (completedQuestions.length > 0) {
                          console.log('Manually saving completed questions:', completedQuestions);

                          // Save questions one by one and collect results
                          const results = [];
                          for (const questionId of completedQuestions) {
                            try {
                              const response = await fetch('/api/user/progress', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  questionId,
                                  status: 'completed',
                                }),
                              });

                              if (!response.ok) {
                                const errorText = await response.text();
                                console.error(`Error saving question ${questionId}:`, response.status, errorText);
                                results.push({ questionId, success: false, error: errorText });
                              } else {
                                const result = await response.json();
                                console.log(`Successfully saved question ${questionId}:`, result);
                                results.push({ questionId, success: true });
                              }
                            } catch (err) {
                              console.error(`Exception saving question ${questionId}:`, err);
                              results.push({ questionId, success: false, error: String(err) });
                            }
                          }

                          // Count successes and failures
                          const successes = results.filter(r => r.success).length;
                          const failures = results.length - successes;

                          if (failures === 0) {
                            sessionStorage.removeItem('completedQuestions');
                            alert(`Successfully saved ${successes} completed questions`);
                          } else {
                            alert(`Saved ${successes} questions, but ${failures} failed. Check console for details.`);
                          }

                          // Refresh progress data
                          const progressResponse = await fetch('/api/user/progress');
                          if (progressResponse.ok) {
                            const data = await progressResponse.json();
                            if (data.totalQuestions > 0) {
                              data.completionPercentage = (data.questionsCompleted / data.totalQuestions) * 100;
                            } else {
                              data.completionPercentage = 0;
                            }
                            setProgressData(data);
                            console.log('Updated progress data:', data);
                          } else {
                            console.error('Failed to refresh progress data:', progressResponse.status);
                          }
                        } else {
                          // Just refresh the data
                          const progressResponse = await fetch('/api/user/progress');
                          if (progressResponse.ok) {
                            const data = await progressResponse.json();
                            if (data.totalQuestions > 0) {
                              data.completionPercentage = (data.questionsCompleted / data.totalQuestions) * 100;
                            } else {
                              data.completionPercentage = 0;
                            }
                            setProgressData(data);
                            console.log('Refreshed progress data:', data);
                            alert('Progress data refreshed');
                          } else {
                            console.error('Failed to refresh progress data:', progressResponse.status);
                            alert('Failed to refresh progress data');
                          }
                        }
                      } catch (err) {
                        console.error('Error in refresh operation:', err);
                        alert(`Error: ${err}`);
                      }
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{progressData.completionPercentage.toFixed(1)}%</span>
                  <span className="text-sm font-medium text-green-500 dark:text-green-400">
                    Questions Completed
                  </span>
                  </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {progressData.questionsCompleted} of {progressData.totalQuestions} questions completed
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${Math.max(0.5, progressData.completionPercentage || 0)}%` }}
                  ></div>
                  </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{progressData.completionPercentage.toFixed(1)}% completed</span>
                  <span>{(100 - (progressData.completionPercentage || 0)).toFixed(1)}% remaining</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Domains Solved</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{progressData.domainsSolved} of {progressData.totalDomains}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Questions Viewed</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{progressData.questionsViewed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Grid Widget */}
              <ActivityGrid />
            </div>

            {/* Center Column (Revenue + Customer by Time) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Domain Completion Widget */}
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                {/* Domain background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5 dark:opacity-10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-purple-600">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Domain Completion</h2>
                  <button onClick={() => fetchDomainStats()} className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>

                {domainStats.loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 dark:border-purple-500 border-t-transparent dark:border-t-transparent"></div>
                  </div>
                ) : domainStats.error ? (
                  <div className="text-center py-4 text-red-500 dark:text-red-400">
                    <p>{domainStats.error}</p>
                    <button
                      onClick={() => fetchDomainStats()}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2"
                    >
                      Try Again
                    </button>
                  </div>
                ) : domainStats.domains.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No domains explored yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Start learning to see your domain progress</p>
                    <Link href="/topics" className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Explore Domains
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Progress across {domainStats.domains.length} of {domainStats.totalDomains} domains
                    </p>
                    <div className="space-y-3 mb-4">
                      {domainStats.domains.slice(0, 5).map((domain) => (
                        <div key={domain.domain} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{domain.domainName}</span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{domain.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.max(0.5, domain.completionPercentage)}%`,
                                backgroundColor: domain.color
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{domain.completedQuestions} completed</span>
                            <span>{domain.totalQuestions} total</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {domainStats.domains.length > 5 && (
                      <div className="text-center">
                        <button className="text-xs text-purple-600 dark:text-purple-400 hover:underline">
                          Show {domainStats.domains.length - 5} more domains
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Recent Activity */}
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                {/* Activity background pattern */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Activity</h2>
                  </div>
                  <Link href="/dashboard/activity" className="flex items-center text-xs text-purple-600 dark:text-purple-400 hover:underline group">
                    View All
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Activity List */}
                <div className="space-y-4">
                  {activityData.loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 dark:border-purple-500 border-t-transparent dark:border-t-transparent mb-3"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your activity...</p>
                    </div>
                  ) : activityData.error ? (
                    <div className="text-center py-8 px-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-400 dark:text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">{activityData.error}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">We couldn't load your recent activity</p>
                      <button
                        onClick={() => {
                          if (!loading) {
                            const fetchActivityData = async () => {
                              setActivityData(prev => ({ ...prev, loading: true, error: null }));
                              try {
                                const response = await fetch('/api/user/activity?limit=3');
                                if (response.ok) {
                                  const data = await response.json();
                                  setActivityData({
                                    activities: data.activities,
                                    loading: false,
                                    error: null
                                  });
                                } else {
                                  setActivityData(prev => ({
                                    ...prev,
                                    loading: false,
                                    error: 'Failed to fetch activity data'
                                  }));
                                }
                              } catch (error) {
                                setActivityData(prev => ({
                                  ...prev,
                                  loading: false,
                                  error: 'Error fetching activity data'
                                }));
                              }
                            };
                            fetchActivityData();
                          }
                        }}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-md transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : activityData.activities.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No activity yet</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Start learning to track your progress</p>
                      <Link href="/topics" className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Start Learning
                      </Link>
                    </div>
                  ) : (
                    activityData.activities.map((activity) => (
                      <div key={activity.id} className="flex items-start p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                            activity.activityType === 'question_completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            activity.activityType === 'question_viewed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          }`}
                        >
                          {activity.activityType === 'question_completed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : activity.activityType === 'question_viewed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white font-medium group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">{activity.displayText}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timeAgo}</p>
                            <Link href={`/topics?questionId=${activity.questionId}`} className="text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (Metrics Summary) */}
            <div className="lg:col-span-1 space-y-6">
              {/* User Stats Widget */}
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                {/* Stats background pattern */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Stats</h2>
                  </div>
                </div>

                {userStats.loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 dark:border-purple-500 border-t-transparent dark:border-t-transparent"></div>
                  </div>
                ) : userStats.error ? (
                  <div className="text-center py-4 text-red-500 dark:text-red-400">
                    <p>{userStats.error}</p>
                    <button
                      onClick={() => fetchUserStats()}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Time Spent */}
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Spent</span>
                      </div>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {userStats.totalTimeSpent} <span className="text-sm font-normal">min</span>
                        </p>
                        {userStats.avgTimePerQuestion > 0 && (
                          <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ~{userStats.avgTimePerQuestion} min/question
                          </p>
                        )}
                      </div>
                    </div>

                    {/* API Calls */}
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">API Calls</span>
                      </div>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {userStats.apiCallsMade}
                        </p>
                        <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          using {userStats.preferredModel}
                        </p>
                      </div>
                    </div>

                    {/* Bookmarks */}
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bookmarks</span>
                        <Link href="/dashboard/bookmarks" className="text-xs text-purple-600 dark:text-purple-400 hover:underline group flex items-center">
                          View All
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {userStats.bookmarksCount}
                      </p>
                    </div>

                    {/* Topics Explored */}
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Topics Explored</span>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {userStats.topicsExplored}
                      </p>
                    </div>

                    {/* Last Active */}
                    {userStats.lastActive && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last active: {formatTimeAgo(new Date(userStats.lastActive))}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highest Campaign Widget */}
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Highest Campaign</h2>
                  <div className="flex space-x-2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                </div>
                              </div>
                <div className="space-y-3">
                   <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 uppercase px-2">
                    <span className="w-2/5">Campaign Provider</span>
                    <span className="w-1/5 text-right">Sales</span>
                    <span className="w-1/5 text-right">Goal</span>
                      </div>
                  {staticData.highestCampaigns.map((campaign, index) => (
                    <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-800/50 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700/50">
                      <div className="w-2/5 flex items-center">
                         <div className="w-6 h-6 rounded-full bg-purple-500 mr-2"></div>
                        <span className="text-sm text-gray-800 dark:text-white font-medium">{campaign.provider}</span>
                      </div>
                      <div className="w-1/5 text-right text-sm text-gray-600 dark:text-gray-300">{formatCurrency(campaign.sales)}</div>
                      <div className="w-1/5 text-right text-sm text-gray-600 dark:text-gray-300">{formatCurrency(campaign.goal)}</div>
                      <div className={`w-1/5 text-right text-sm font-medium ${getStatusColor(campaign.status)}`}>{campaign.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
