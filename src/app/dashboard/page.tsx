'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ProgressSaver from '@/components/progress/ProgressSaver';
import { ActivityGrid } from '@/components/progress';
import { Calendar } from '@/components/ui';
import { DomainStat, ActivityItem } from '@/types/dashboard.types';
import { LoadingSpinner } from '@/components/ui';

// Component imports
import { 
  DomainCompletionWidget, 
  RecentActivityWidget, 
  UserActivityChart,
  MetricCards
} from '@/components/dashboard';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
          activityRes,
          bookmarksRes,
          userStatsRes,
          domainStatsRes,
          activityChartRes
        ] = await Promise.all([
          fetch('/api/user/progress'),
          fetch('/api/user/activity?limit=3'),
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

          // Handle activity data
          if (activityRes.ok) {
            const activityResult = await activityRes.json();
            setActivityData({ activities: activityResult.activities || [], loading: false, error: null });
          } else {
            setActivityData({ activities: [], loading: false, error: 'Failed to fetch activity' });
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
          setActivityData(prev => ({ ...prev, loading: false, error: 'Fetch error' }));
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProgressSaver />
        
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground">
            {getGreeting()}, {profile?.full_name || profile?.username || 'User'}
          </h1>
        </div>

        {/* Top Section: Metric Cards (2x2) + Calendar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Left: Metric Cards in 2x2 Grid */}
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCards 
                progressData={progressData}
                userStats={userStats}
              />
            </div>
          </div>

          {/* Right: Calendar Activity Tracker */}
          <div className="xl:col-span-1">
            <div className="p-6 rounded-lg border border-border bg-card text-card-foreground h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-foreground">
                  Activity Calendar
                </h2>
                <button
                  onClick={() => setShowCalendarView(!showCalendarView)}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  {showCalendarView ? 'Week View' : 'Calendar View'}
                </button>
              </div>
              
              {showCalendarView ? (
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    weekStartsOn={1}
                    className="rounded-md border border-border w-full"
                    modifiers={{
                      lowActivity: (date: Date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayData = activityChartData.data.find(item => item.date === dateStr);
                        return Boolean(dayData && dayData.questionsAnswered >= 1 && dayData.questionsAnswered <= 2);
                      },
                      mediumActivity: (date: Date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayData = activityChartData.data.find(item => item.date === dateStr);
                        return Boolean(dayData && dayData.questionsAnswered >= 3 && dayData.questionsAnswered <= 5);
                      },
                      highActivity: (date: Date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayData = activityChartData.data.find(item => item.date === dateStr);
                        return Boolean(dayData && dayData.questionsAnswered >= 6);
                      },
                      noActivity: (date: Date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayData = activityChartData.data.find(item => item.date === dateStr);
                        return Boolean(!dayData || dayData.questionsAnswered === 0);
                      }
                    }}
                    modifiersStyles={{
                      lowActivity: {
                        backgroundColor: 'hsl(var(--primary))',
                        opacity: '0.2',
                        color: 'hsl(var(--primary))',
                        fontWeight: '500'
                      },
                      mediumActivity: {
                        backgroundColor: 'hsl(var(--primary))',
                        opacity: '0.4',
                        color: 'hsl(var(--primary-foreground))',
                        fontWeight: '600'
                      },
                      highActivity: {
                        backgroundColor: 'hsl(var(--primary))',
                        opacity: '0.8',
                        color: 'hsl(var(--primary-foreground))',
                        fontWeight: 'bold'
                      },
                      noActivity: {
                        backgroundColor: 'transparent',
                        color: 'hsl(var(--muted-foreground))',
                        opacity: '0.6'
                      }
                    }}
                  />
                  
                  {/* Activity Legend */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-muted"></div>
                      <span className="text-muted-foreground">None</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-primary/20"></div>
                      <span className="text-muted-foreground">1-2</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-primary/40"></div>
                      <span className="text-muted-foreground">3-5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-primary/80"></div>
                      <span className="text-muted-foreground">6+</span>
                    </div>
                  </div>

                  {/* Selected Date Details */}
                  {selectedDate && (
                    <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-foreground">
                          {selectedDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        {(() => {
                          const dateStr = selectedDate.toISOString().split('T')[0];
                          const dayActivity = activityChartData.data.find(item => item.date === dateStr);
                          if (dayActivity && dayActivity.questionsAnswered > 0) {
                            let badgeColor = 'bg-muted text-muted-foreground';
                            let badgeText = 'None';
                            
                            if (dayActivity.questionsAnswered >= 6) {
                              badgeColor = 'bg-primary/80 text-primary-foreground';
                              badgeText = 'High';
                            } else if (dayActivity.questionsAnswered >= 3) {
                              badgeColor = 'bg-primary/40 text-primary-foreground';
                              badgeText = 'Medium';
                            } else if (dayActivity.questionsAnswered >= 1) {
                              badgeColor = 'bg-primary/20 text-primary';
                              badgeText = 'Low';
                            }
                            
                            return (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                                {badgeText}
                              </span>
                            );
                          }
                          return (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              None
                            </span>
                          );
                        })()}
                      </div>
                      
                      {(() => {
                        const dateStr = selectedDate.toISOString().split('T')[0];
                        const dayActivity = activityChartData.data.find(item => item.date === dateStr);
                        return dayActivity && dayActivity.questionsAnswered > 0 ? (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {dayActivity.questionsAnswered}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Questions Completed
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-muted-foreground">
                              No activity recorded
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <ActivityGrid />
              )}
            </div>
          </div>
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
