'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin'); // Redirect if not logged in
        return;
      }
      setUser(session.user);

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
      setLoading(false);
    };

    checkUserAndProfile();
  }, [supabase, router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US');
  };

  const getChangeColor = (change: number) => {
    // Adjusted for better visibility in both modes if needed, but green/red usually works
    return change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Achieved': return 'text-green-500 dark:text-green-400';
      case 'On-Process': return 'text-yellow-500 dark:text-yellow-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-800 dark:text-gray-200 p-8 pt-0">

      {/* Top Bar - Below Main Navigation */}
      <div className="flex justify-between items-center mb-8 sticky top-16 bg-white dark:bg-black py-4 z-40 border-b border-gray-200 dark:border-gray-800">
        {/* Left Tabs */}
        <div className="flex items-center space-x-2">
          <button className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium text-gray-900 dark:text-white">Overview</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">Insights</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">Audiences</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">Users</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">Reports</button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-4">
          {/* Search Input - Placeholder */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for anything..."
              className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 pl-10 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Time Period Buttons - Placeholder */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-1">
            <button className="px-3 py-1 rounded text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white">Today</button>
            <button className="px-3 py-1 rounded text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white">Week</button>
            <button className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-xs font-medium text-gray-700 dark:text-white">Month</button>
            <button className="px-3 py-1 rounded text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white">Year</button>
          </div>

          {/* Date Range - Placeholder */}
          <button className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>May 12 - Jun 12, 2025</span>
            <svg className="w-4 h-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>


      {/* Greeting */}
      <h1 className="text-3xl font-medium text-gray-900 dark:text-white mb-8">
        {getGreeting()}, {profile?.full_name || profile?.username || 'User'}
      </h1>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Overview + Weekly Traffic) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Overview Widget */}
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Overview</h2>
            <div className="flex items-baseline space-x-2 mb-1">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{staticData.overviewValue}</span>
              <span className={`${getChangeColor(staticData.overviewChange)} text-sm font-medium`}>
                +{staticData.overviewChange}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">This is current position overview</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '72%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>72%</span>
              <span>28%</span>
            </div>
          </div>

          {/* Weekly Traffic Widget */}
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Traffic</h2>
              <div className="flex space-x-3 text-xs">
                <span className="flex items-center text-gray-700 dark:text-gray-300"><span className="w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>New Orders</span>
                <span className="flex items-center text-gray-700 dark:text-gray-300"><span className="w-2 h-2 bg-cyan-500 rounded-full mr-1.5"></span>Repeat Orders</span>
                <span className="flex items-center text-gray-700 dark:text-gray-300"><span className="w-2 h-2 bg-pink-500 rounded-full mr-1.5"></span>Lower Limit</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{formatNumber(staticData.weeklyTraffic)} <span className="text-lg font-medium text-gray-500 dark:text-gray-400">Orders</span></p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">This is the total orders for this week</p>
            <div className="h-48 bg-gray-100 dark:bg-gray-800/30 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              Weekly Traffic Chart Placeholder
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
          </div>
        </div>

        {/* Center Column (Revenue + Customer by Time) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Revenue Widget */}
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</h2>
              <div className="flex space-x-2 text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </div>
            </div>
            <div className="h-24 flex items-end justify-between space-x-1 mb-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-full bg-purple-500 dark:bg-purple-600/50 rounded-t-sm" style={{ height: `${Math.random() * 80 + 15}%` }}>
                   <div className="w-full bg-purple-400 dark:bg-purple-600/30 rounded-t-sm h-1/3"></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
              <div >
                <span className="flex items-center mb-1 text-gray-700 dark:text-gray-300"><span className="w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>Total Revenue</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(staticData.revenue)}</span>
              </div>
              <div >
                <span className="flex items-center mb-1 text-gray-700 dark:text-gray-300"><span className="w-2 h-2 bg-purple-500/50 rounded-full mr-1.5"></span>Taxes</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(staticData.taxes)}</span>
              </div>
              <div >
                <span className="flex items-center mb-1 text-gray-700 dark:text-gray-300"><span className="w-2 h-2 bg-purple-500/30 rounded-full mr-1.5"></span>Opex</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(staticData.opex)}</span>
              </div>
            </div>
          </div>

          {/* Customer by Time Widget */}
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer by Time</h2>
              <div className="flex space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span>&lt; 500</span>
                <span>1,000+</span>
                <span>2,000+</span>
                <span>3,000+</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 aspect-square">
              {Array.from({ length: 49 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{ backgroundColor: `rgba(168, 85, 247, ${Math.random() * 0.6 + 0.1})`}}
                ></div>
              ))}
            </div>
             <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
          </div>
        </div>

        {/* Right Column (Metrics + Highest Campaign) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metrics Sidebar Widget */}
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
             <div className="flex justify-end mb-4">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
             </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Users</span>
                  <span className={`${getChangeColor(staticData.usersChange)} text-xs`}>
                     {staticData.usersChange > 0 ? '+' : ''}{staticData.usersChange}%
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatNumber(staticData.users)}</p>
              </div>
               <div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sessions</span>
                  <span className={`${getChangeColor(staticData.sessionsChange)} text-xs`}>
                     {staticData.sessionsChange > 0 ? '+' : ''}{staticData.sessionsChange}%
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatNumber(staticData.sessions)}</p>
              </div>
               <div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Session Duration</span>
                  <span className={`${getChangeColor(staticData.sessionDurationChange)} text-xs`}>
                     {staticData.sessionDurationChange > 0 ? '+' : ''}{staticData.sessionDurationChange}%
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{staticData.sessionDuration}</p>
              </div>
               <div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Page Views</span>
                  <span className={`${getChangeColor(staticData.pageViewsChange)} text-xs`}>
                     {staticData.pageViewsChange > 0 ? '+' : ''}{staticData.pageViewsChange}%
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatNumber(staticData.pageViews)}</p>
              </div>
            </div>
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
                <span className="w-1/5 text-right">Status</span>
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
  );
}
