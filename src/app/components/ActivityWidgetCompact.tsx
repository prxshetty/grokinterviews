"use client";

import { useState, useEffect } from 'react';
import { fetchActivityData } from '../utils/activity';

interface ActivityData {
  date: string;
  count: number;
}

const ActivityWidgetCompact = () => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    streakDays: 0
  });

  useEffect(() => {
    const getActivityData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchActivityData();
        setActivityData(data);
        
        // Calculate stats
        if (data.length > 0) {
          // Calculate total questions viewed
          const totalQuestions = data.reduce((sum, day) => sum + day.count, 0);
          
          // Calculate current streak
          let streakDays = 0;
          for (let i = 0; i < data.length; i++) {
            if (data[i].count === 0) break;
            streakDays++;
          }
          
          setStats({
            totalQuestions,
            streakDays
          });
        }
      } catch (error) {
        console.error('Failed to fetch activity data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getActivityData();
  }, []);

  // Calculate max count for size intensity
  const maxCount = Math.max(...activityData.map(d => d.count), 1);

  // Get color based on count - now using black in light mode and white in dark mode
  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    return 'bg-black dark:bg-white';
  };

  // Get size based on count
  const getSize = (count: number) => {
    if (count === 0) return 'w-[8px] h-[8px]';
    
    // Calculate size based on count relative to max count
    const sizeRatio = count / maxCount;
    
    if (sizeRatio <= 0.25) return 'w-[8px] h-[8px]';
    if (sizeRatio <= 0.5) return 'w-[10px] h-[10px]';
    if (sizeRatio <= 0.75) return 'w-[12px] h-[12px]';
    return 'w-[14px] h-[14px]';
  };

  if (isLoading) {
    return (
      <div className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg animate-pulse">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Get only the most recent 7 days for the compact view
  const recentActivity = activityData.slice(0, 7);

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg font-mono bg-white dark:bg-black">
      <h3 className="text-sm mb-3 text-gray-800 dark:text-white">Your Activity</h3>
      
      {/* Stats boxes */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{stats.totalQuestions}</p>
        </div>
        <div className="p-2 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">Streak</p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{stats.streakDays} days</p>
        </div>
      </div>
      
      {/* Recent activity cells - last 7 days */}
      <div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recent activity</div>
        <div className="flex justify-between">
          {recentActivity.map((day, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-[16px] h-[16px]"
              title={`${day.date}: ${day.count} questions`}
            >
              <div
                className={`rounded-full transition-all duration-200 ${getColor(day.count)} ${getSize(day.count)}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityWidgetCompact; 