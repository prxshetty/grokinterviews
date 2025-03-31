"use client";

import { useState, useEffect } from 'react';
import { fetchActivityData } from '../utils/activity';

interface ActivityData {
  date: string;
  count: number;
}

const ActivityWidget = () => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    streakDays: 0,
    lastWeekCount: 0
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
          const today = new Date().toISOString().split('T')[0];
          
          for (let i = 0; i < data.length; i++) {
            if (data[i].count === 0) break;
            streakDays++;
          }
          
          // Calculate questions viewed in the last week
          const lastWeekData = data.slice(0, 7);
          const lastWeekCount = lastWeekData.reduce((sum, day) => sum + day.count, 0);
          
          setStats({
            totalQuestions,
            streakDays,
            lastWeekCount
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

  // Group activity data by week for display
  const getActivityGrid = () => {
    const weeks: ActivityData[][] = [];
    let weekData: ActivityData[] = [];
    
    // Get most recent 91 days (13 weeks)
    const recentData = activityData.slice(0, 91).reverse();
    
    // Calculate day of week for first item to pad the grid
    if (recentData.length > 0) {
      const firstDate = new Date(recentData[0].date);
      const dayOfWeek = firstDate.getDay();
      
      // Add empty cells for padding
      for (let i = 0; i < dayOfWeek; i++) {
        weekData.push({ date: '', count: -1 });
      }
    }
    
    // Add activity data
    recentData.forEach((day, index) => {
      weekData.push(day);
      
      // Start a new week after 7 days
      if (weekData.length === 7) {
        weeks.push([...weekData]);
        weekData = [];
      }
    });
    
    // Add the last partial week if it exists
    if (weekData.length > 0) {
      weeks.push([...weekData]);
    }
    
    return weeks;
  };

  if (isLoading) {
    return (
      <div className="mt-8 p-6 border border-gray-200 dark:border-gray-800 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const activityGrid = getActivityGrid();

  return (
    <div className="mt-8 p-6 border border-gray-200 dark:border-gray-800 rounded-lg font-mono bg-white dark:bg-black">
      <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Activity Dashboard</h2>
      
      {/* Stats boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalQuestions}</p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.streakDays} days</p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 Days</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.lastWeekCount}</p>
        </div>
      </div>
      
      {/* GitHub-style activity graph */}
      <div className="overflow-x-auto pb-2">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Questions viewed</div>
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 mr-2 pt-6">
            <div className="h-[14px] flex items-center">Mon</div>
            <div className="h-[14px] flex items-center mt-1">Wed</div>
            <div className="h-[14px] flex items-center mt-1">Fri</div>
          </div>
          
          {/* Activity grid */}
          <div className="flex space-x-1">
            {activityGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="flex items-center justify-center w-[14px] h-[14px]"
                    title={day.date ? `${day.date}: ${day.count} questions` : ''}
                  >
                    {day.count >= 0 && (
                      <div
                        className={`rounded-full transition-all duration-200 ${getColor(day.count)} ${getSize(day.count)}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityWidget; 