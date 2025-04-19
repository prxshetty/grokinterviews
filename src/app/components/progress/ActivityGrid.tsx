"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityGridProps {
  className?: string;
}

export default function ActivityGrid({ className = "" }: ActivityGridProps) {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Fetch activity data
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/activity-grid');
        if (!response.ok) {
          throw new Error('Failed to fetch activity data');
        }
        const data = await response.json();
        setActivityData(data.activityData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  // Get color based on activity count
  const getActivityColor = (count: number, isToday: boolean = false) => {
    // Define color scales for light and dark modes with orange tones
    const lightModeColors = [
      'bg-gray-100 text-gray-700', // 0 activities
      'bg-orange-100 text-orange-800', // 1-2 activities
      'bg-orange-300 text-orange-900', // 3-5 activities
      'bg-orange-500 text-white', // 6-9 activities
      'bg-orange-700 text-white', // 10+ activities
    ];

    const darkModeColors = [
      'bg-gray-800 text-gray-300', // 0 activities
      'bg-orange-900 text-orange-100', // 1-2 activities
      'bg-orange-700 text-white', // 3-5 activities
      'bg-orange-500 text-white', // 6-9 activities
      'bg-orange-400 text-orange-900', // 10+ activities
    ];

    // If it's today, use a special highlight color
    if (isToday) {
      return isDarkMode ? 'bg-orange-500 text-white ring-2 ring-orange-300' : 'bg-orange-600 text-white ring-2 ring-orange-300';
    }

    const colors = isDarkMode ? darkModeColors : lightModeColors;

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

  return (
    <div className={`p-6 rounded-lg border border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">This Week's Activity</h2>
      </div>

      {loading ? (
        <div className="h-auto flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="h-auto flex items-center justify-center py-8 text-red-500 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {/* Day labels - horizontal layout */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
            <div className="text-center">Mon</div>
            <div className="text-center">Tue</div>
            <div className="text-center">Wed</div>
            <div className="text-center">Thu</div>
            <div className="text-center">Fri</div>
            <div className="text-center">Sat</div>
            <div className="text-center">Sun</div>
          </div>

          {/* Days grid - single row layout for current week only */}
          <div className="grid grid-cols-7 gap-2">
            {currentWeekDates.map((dateStr) => {
              // Find activity for this date
              const activity = activityData.find(item => item.date === dateStr) || { date: dateStr, count: 0 };

              // Extract day number and check if it's today
              const dayDate = new Date(dateStr);
              const dayNumber = dayDate.getDate();
              const isToday = dayDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={`day-${dateStr}`}
                  className={`
                    py-3 rounded-2xl flex flex-col items-center justify-center
                    ${getActivityColor(activity.count, isToday)}
                    transition-all duration-200
                    ${isToday ? 'shadow-md' : activity.count > 0 ? 'shadow-sm' : ''}
                  `}
                  title={`${formatDate(dateStr)}: ${activity.count} activities`}
                >
                  {/* Day number */}
                  <div className="text-lg font-semibold">{dayNumber}</div>

                  {/* Activity indicator */}
                  {activity.count > 0 && (
                    <div className="mt-1 flex space-x-1">
                      <div className="h-1 w-1 rounded-full bg-current opacity-80"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
