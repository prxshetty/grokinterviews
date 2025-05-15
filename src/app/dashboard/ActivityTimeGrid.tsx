'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityTimeGridProps {
  className?: string;
  fullWidth?: boolean;
}

export default function ActivityTimeGrid({ className = "", fullWidth = false }: ActivityTimeGridProps) {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Fetch activity data and user stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Try to fetch authenticated user data
        const activityResponse = await fetch('/api/user/activity-grid');

        if (activityResponse.status === 401) {
          // User is not authenticated
          console.log('User not authenticated');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // User is authenticated
        setIsAuthenticated(true);

        if (!activityResponse.ok) {
          throw new Error('Failed to fetch activity data');
        }

        const activityData = await activityResponse.json();
        setActivityData(activityData.activityData || []);

        // Fetch user stats to get total time spent
        const statsResponse = await fetch('/api/user/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setTotalTimeSpent(statsData.totalTimeSpent || 0);
        } else {
          console.error('Failed to fetch user stats');
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get color based on activity count and theme
  const getActivityColor = (count: number, isToday: boolean = false) => {
    // Define color scales for dark and light themes
    const darkModeColors = [
      'bg-gray-800', // 0 activities
      'bg-gray-700', // 1-2 activities
      'bg-gray-600', // 3-5 activities
      'bg-gray-400', // 6-9 activities
      'bg-white', // 10+ activities
    ];

    const lightModeColors = [
      'bg-gray-200', // 0 activities
      'bg-gray-300', // 1-2 activities
      'bg-gray-400', // 3-5 activities
      'bg-gray-600', // 6-9 activities
      'bg-black', // 10+ activities
    ];

    const colors = isDarkMode ? darkModeColors : lightModeColors;

    // If it's today, use a special highlight color
    if (isToday) {
      return isDarkMode ? 'bg-white ring-1 ring-white' : 'bg-black ring-1 ring-black';
    }

    if (count === 0) return colors[0];
    if (count <= 2) return colors[1];
    if (count <= 5) return colors[2];
    if (count <= 9) return colors[3];
    return colors[4];
  };

  // Format date for tooltip
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get the current week's dates
  const today = new Date();
  const currentWeekDates: string[] = [];

  // Fill in the current week dates (7 days)
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    currentWeekDates.push(date.toISOString().split('T')[0]);
  }

  // Format total time spent
  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  // Get current month name
  const getCurrentMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
  };

  return (
    <div className={`p-6 rounded-lg ${className} ${fullWidth ? 'w-full' : ''} ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total time</h2>
          <div className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatTimeSpent(totalTimeSpent)}</div>
        </div>
      </div>

      {loading ? (
        <div className="h-auto flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="h-auto flex items-center justify-center py-8 text-red-500 dark:text-red-400">
          {error}
        </div>
      ) : !isAuthenticated ? (
        <div className="h-auto flex flex-col items-center justify-center py-16 relative">
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-black bg-opacity-70 text-white px-6 py-4 rounded-lg text-center">
              <p className="text-lg font-medium">Sign in to use this feature</p>
              <a href="/signin" className="mt-2 inline-block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition-colors">
                Sign In
              </a>
            </div>
          </div>
          {/* Blurred content */}
          <div className="filter blur-sm w-full">
            <div className="grid grid-cols-31 gap-[6px] h-[140px]"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-full mx-auto">
          <div className="flex">
            <div className="flex flex-col justify-between h-[140px] mr-3 pt-1">
              <div className={`text-xs uppercase font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mon</div>
              <div className={`text-xs uppercase font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tue</div>
              <div className={`text-xs uppercase font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wed</div>
              <div className={`text-xs uppercase font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Thu</div>
              <div className={`text-xs uppercase font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fri</div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-31 gap-[6px] h-[140px]">
                {currentWeekDates.map((dateStr, index) => {
                  // Add a visual separator every 4 columns (representing weeks in a month)
                  const isEndOfWeek = (index + 1) % 4 === 0;
                  const marginRight = isEndOfWeek ? 'mr-4' : '';
                  const activity = activityData.find(item => item.date === dateStr) || { date: dateStr, count: 0 };
                  const dayDate = new Date(dateStr);
                  const isToday = dayDate.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={`day-${dateStr}`}
                      className={`
                        flex items-center justify-center
                        ${getActivityColor(activity.count, isToday)}
                        transition-all duration-200
                        rounded-full h-[10px] w-[10px]
                        ${marginRight}
                      `}
                      title={`${formatDate(dateStr)}: ${activity.count} activities`}
                    />
                  );
                })}

                {/* Generate empty circles for days without activity data */}
                {Array.from({ length: 4 }).map((_, weekIndex) => (
                  <React.Fragment key={`week-${weekIndex}`}>
                    {Array.from({ length: 28 }).map((_, dayIndex) => {
                      // Add a visual separator every 4 columns (representing weeks in a month)
                      const isEndOfWeek = (dayIndex + 1) % 4 === 0;
                      const marginRight = isEndOfWeek ? 'mr-4' : '';

                      // Calculate the date for this position
                      const date = new Date();
                      date.setDate(date.getDate() - (weekIndex * 28 + dayIndex));
                      const dateStr = date.toISOString().split('T')[0];

                      // Find activity for this date or default to 0
                      const activity = activityData.find(item => item.date === dateStr) || { date: dateStr, count: 0 };
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={`day-${dateStr}`}
                          className={`
                            flex items-center justify-center
                            ${getActivityColor(activity.count, isToday)}
                            transition-all duration-200
                            rounded-full h-[10px] w-[10px]
                            ${marginRight}
                          `}
                          title={`${formatDate(dateStr)}: ${activity.count} activities`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className={`flex justify-center items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>
            <span>{getCurrentMonthName()}</span>
          </div>
        </div>
      )}
    </div>
  );
} 