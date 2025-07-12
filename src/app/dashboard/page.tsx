'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ProgressSaver from '@/components/progress/ProgressSaver';
import { DomainStat } from '@/types/dashboard.types';
import { LoadingSpinner } from '@/components/ui';

// Component imports
import { 
  UserActivityChart,
  MetricCards,
  DomainCompletionWidget,
  StreakChart,
} from '@/components/dashboard';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const isMounted = useRef(true);
  const router = useRouter();

  const [progressData, setProgressData] = useState({
    questionsCompleted: 0,
    questionsViewed: 0,
    totalQuestions: 0,
    completionPercentage: 0,
    domainsSolved: 0,
    totalDomains: 0,
    loading: true
  });

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

  const [activityChartData, setActivityChartData] = useState<{
    data: Array<{
      date: string;
      questionsAnswered: number;
      questionsViewed: number;
    }>;
    loading: boolean;
    error: string | null;
  }>({
    data: [],
    loading: true,
    error: null
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data using existing API endpoints
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchDashboardData = async () => {
      if (!isMounted.current) return;
      
      try {
        // Fetch user stats using existing API endpoints
        const [
          progressRes,
          bookmarksRes,
          userStatsRes,
          domainStatsRes,
          activityChartRes
        ] = await Promise.all([
          fetch('/api/user/progress'),
          fetch('/api/user/bookmarks'),
          fetch('/api/user/stats'),
          fetch('/api/user/domains'),
          fetch('/api/user/activity-grid')
        ]);

        if (isMounted.current) {
          // Handle progress data
          if (progressRes.ok) {
            const data = await progressRes.json();
            if (data.totalQuestions > 0) {
              data.completionPercentage = (data.questionsCompleted / data.totalQuestions) * 100;
            } else {
              data.completionPercentage = 0;
            }
            setProgressData({...data, loading: false});
          } else {
            setProgressData(prev => ({ ...prev, loading: false }));
          }

          // Handle user stats (including bookmarks)
          let bookmarksCount = 0;
          if (bookmarksRes.ok) {
            const bookmarksResult = await bookmarksRes.json();
            bookmarksCount = bookmarksResult.bookmarks?.length || 0;
          }

          if (userStatsRes.ok) {
            const statsData = await userStatsRes.json();
            setUserStats({
              ...statsData,
              bookmarksCount,
              joinDate: user?.created_at || null,
              loading: false, 
              error: null
            });
          } else {
             setUserStats(prev => ({ ...prev, bookmarksCount, loading: false, error: 'Failed to load user stats' }));
          }

          // Handle domain stats
          if (domainStatsRes.ok) {
            const domainData = await domainStatsRes.json();
            setDomainStats({
              domains: domainData.domains || [],
              totalDomains: domainData.totalDomains || 0,
              loading: false,
              error: null
            });
          } else {
            setDomainStats(prev => ({...prev, loading: false, error: 'Failed to load domain stats' }));
          }
          
          // Handle activity chart data
          if (activityChartRes.ok) {
            const chartResult = await activityChartRes.json();
             const chartData = (chartResult.activityData || []).map((item: any) => ({
                date: item.date,
                questionsAnswered: item.count || 0,
                questionsViewed: Math.floor((item.count || 0) * 1.5) 
            }));
            setActivityChartData({ data: chartData, loading: false, error: null });
          } else {
            setActivityChartData({ data: [], loading: false, error: 'Failed to fetch chart data'});
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (isMounted.current) {
          setProgressData(prev => ({ ...prev, loading: false }));
          setUserStats(prev => ({ ...prev, loading: false, error: 'Fetch error' }));
          setDomainStats(prev => ({ ...prev, loading: false, error: 'Fetch error' }));
          setActivityChartData(prev => ({ ...prev, loading: false, error: 'Fetch error' }));
        }
      }
    };
    
    fetchDashboardData();
  }, [authLoading, user]);

  if (authLoading || !profile) {
    // Distinguish between initial load and the state during sign-out
    const spinnerText = authLoading ? "Loading dashboard..." : "Redirecting...";
    
    return (
      <LoadingSpinner 
        size="xl" 
        color="primary" 
        text={spinnerText}
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32 sm:pt-36 md:pt-40">
        <ProgressSaver />
        
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground">
            {getGreeting()},{' '}
            {profile?.full_name || profile?.username || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Here's your progress overview. Keep up the great work!
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <UserActivityChart 
                data={activityChartData.data} 
                loading={activityChartData.loading}
              />
              <div className="grid grid-cols-4 gap-4">
                <MetricCards progressData={progressData} userStats={userStats} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <StreakChart className="h-full" />
            </div>
          </div>

          <div className="w-full">
            <DomainCompletionWidget domainStats={domainStats} />
          </div>
        </div>
      </div>
    </div>
  );
}
