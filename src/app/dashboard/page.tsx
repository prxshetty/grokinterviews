'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ProgressSaver from '../components/progress/ProgressSaver';
import { ActivityGrid } from '../components/progress';
import DashboardNav from './DashboardNav';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';

// Component imports
import { 
  OverviewWidget, 
  DomainCompletionWidget, 
  RecentActivityWidget, 
  UserStatsWidget,
  UserActivityChart,
  MetricCards
} from '../components/dashboard';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

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

interface DomainStat {
  domain: string;
  domainName: string;
  totalQuestions: number;
  completedQuestions: number;
  completionPercentage: number;
  color: string;
}

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

  const [activityData, setActivityData] = useState<{
    activities: ActivityItem[];
    loading: boolean;
    error: string | null;
  }>({
    activities: [],
    loading: true,
    error: null
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

  const router = useRouter();
  const supabase = createClientComponentClient();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin');
        return;
      }

      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
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

  // Fetch additional data when loading is complete
  useEffect(() => {
    if (loading) return;

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
          setUserStats(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch user stats'
          }));
        }
      } catch (error) {
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
          setDomainStats(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch domain stats'
          }));
        }
      } catch (error) {
        setDomainStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error fetching domain stats'
        }));
      }
    };

    const fetchActivityChartData = async () => {
      setActivityChartData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch('/api/user/activity-grid');
        if (response.ok) {
          const data = await response.json();
          // Transform the activity grid data to chart format
          const chartData = data.map((item: any) => ({
            date: item.date,
            questionsAnswered: item.count || 0,
            questionsViewed: Math.floor((item.count || 0) * 1.5) // Approximation, you might want to track this separately
          }));
          setActivityChartData({
            data: chartData,
            loading: false,
            error: null
          });
        } else {
          setActivityChartData(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch activity chart data'
          }));
        }
      } catch (error) {
        setActivityChartData(prev => ({
          ...prev,
          loading: false,
          error: 'Error fetching activity chart data'
        }));
      }
    };

    fetchActivityData();
    fetchUserStats();
    fetchDomainStats();
    fetchActivityChartData();
  }, [loading]);

  const refreshProgressData = async () => {
    try {
      // Manually save any completed questions
      const completedQuestions = JSON.parse(sessionStorage.getItem('completedQuestions') || '[]');
      if (completedQuestions.length > 0) {
        console.log('Manually saving completed questions:', completedQuestions);

        const results = [];
        for (const questionId of completedQuestions) {
          try {
            const response = await fetch('/api/user/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questionId, status: 'completed' }),
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

        const successes = results.filter(r => r.success).length;
        const failures = results.length - successes;

        if (failures === 0) {
          sessionStorage.removeItem('completedQuestions');
        }
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
      }
    } catch (err) {
      console.error('Error in refresh operation:', err);
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
        <ProgressSaver />

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-6">Dashboard</h2>
          <Suspense fallback={<div className="text-center p-4">Loading Nav...</div>}>
            <DashboardNav />
          </Suspense>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 dark:text-white">
            {getGreeting()}, {profile?.full_name || profile?.username || 'User'}
          </h1>
        </div>

        {/* Metric Cards - Section Cards Style */}
        <div className="mb-8">
          <MetricCards 
            progressData={progressData}
            userStats={userStats}
          />
        </div>

        {/* Activity Chart - Full Width */}
        <div className="mb-6">
          <UserActivityChart 
            data={activityChartData.data}
            loading={activityChartData.loading}
          />
        </div>

        {/* Secondary Grid - Domain and Activity Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column */}
          <div className="space-y-6">
            <DomainCompletionWidget 
              domainStats={domainStats}
            />
            <ActivityGrid />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <RecentActivityWidget 
              activityData={activityData}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
