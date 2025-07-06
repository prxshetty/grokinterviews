'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui';
import { useStreak } from '@/hooks/useStreak';
import { Flame, Trophy, Calendar, Target } from 'lucide-react';

interface StreakChartProps {
  className?: string;
}

export function StreakChart({ className = '' }: StreakChartProps) {
  const { 
    current_streak, 
    highest_streak, 
    last_active_date, 
    streak_start_date,
    grace_used,
    isLoading, 
    error 
  } = useStreak();

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" color="primary" text="Loading streak data..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Failed to load streak data</p>
        </div>
      </Card>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStreakStatus = () => {
    if (current_streak === 0) return 'Start your streak!';
    if (current_streak === 1) return 'Great start!';
    if (current_streak < 7) return 'Building momentum!';
    if (current_streak < 30) return 'On fire! 🔥';
    return 'Legendary streak! 🏆';
  };

  const getStreakColor = () => {
    if (current_streak === 0) return 'text-muted-foreground';
    if (current_streak < 7) return 'text-orange-500';
    if (current_streak < 30) return 'text-red-500';
    return 'text-purple-500';
  };

  // Generate calendar data for the current month
  const generateCalendarData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
    
    const calendarData = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarData.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      
      // Enhanced activity detection - check if day is within streak period
      let isActive = false;
      if (last_active_date && current_streak > 0) {
        const lastActiveDate = new Date(last_active_date);
        const daysDiff = Math.floor((lastActiveDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        isActive = daysDiff >= 0 && daysDiff < current_streak;
      }
      
      // Special case: if today is the last active date
      if (last_active_date && date.toDateString() === new Date(last_active_date).toDateString()) {
        isActive = true;
      }
      
      calendarData.push({
        day,
        date,
        isToday,
        isActive
      });
    }
    
    return calendarData;
  };

  const calendarData = generateCalendarData();
  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const year = today.getFullYear();

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h3 className="text-base font-semibold">Streak Calendar</h3>
          </div>
          {grace_used && (
            <Badge variant="secondary" className="text-xs">
              Grace Used
            </Badge>
          )}
        </div>

        {/* Current Streak Display */}
        <div className="text-center space-y-1">
          <div className={`text-2xl font-bold ${getStreakColor()}`}>
            {current_streak}
          </div>
          <div className="text-xs text-muted-foreground">
            {current_streak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-xs font-medium text-foreground">
            {getStreakStatus()}
          </div>
        </div>

        {/* Custom Streak Calendar */}
        <div className="w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            {/* Month/Year Header */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                {monthName} {year}
              </h2>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {/* Day headers */}
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarData.map((dayData, index) => (
                <div key={index} className="aspect-square flex items-center justify-center">
                  {dayData ? (
                    <div className="relative group">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                          dayData.isActive
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md transform scale-105'
                            : dayData.isToday
                            ? 'bg-orange-100 text-orange-600 border border-orange-400 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-500'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                        }`}
                      >
                        {dayData.day}
                      </div>
                      {/* Flame icon for active days */}
                      {dayData.isActive && (
                        <div className="absolute -top-1 -right-1 animate-pulse">
                          <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <Flame className="w-2 h-2 text-white" />
                          </div>
                        </div>
                      )}
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        {dayData.isActive ? 'Active Day' : dayData.isToday ? 'Today' : 'Inactive'}
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Enhanced Legend */}
            <div className="flex justify-center space-x-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-sm"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-orange-400 rounded-full bg-orange-100 dark:bg-orange-900/30"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
            </div>
            <div className="text-base font-semibold">{highest_streak}</div>
            <div className="text-xs text-muted-foreground">Best</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-blue-500" />
            </div>
            <div className="text-base font-semibold">
              {streak_start_date ? formatDate(streak_start_date) : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">Started</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3 w-3 text-green-500" />
            </div>
            <div className="text-base font-semibold">
              {last_active_date ? formatDate(last_active_date) : 'Never'}
            </div>
            <div className="text-xs text-muted-foreground">Last</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default StreakChart; 