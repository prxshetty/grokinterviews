import React from 'react';

interface UserStatsWidgetProps {
  userStats: {
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
  };
}

export default function UserStatsWidget({ userStats }: UserStatsWidgetProps) {
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

  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Stats</h2>
      </div>

      {userStats.loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 dark:border-purple-500 border-t-transparent" />
        </div>
      ) : userStats.error ? (
        <div className="text-center py-4">
          <p className="text-sm text-purple-600 dark:text-purple-400">{userStats.error}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Time Spent */}
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Spent</span>
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
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">API Calls</span>
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
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bookmarks</span>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {userStats.bookmarksCount}
            </p>
          </div>

          {/* Topics Explored */}
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Topics Explored</span>
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
  );
} 