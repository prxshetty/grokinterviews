'use client';

import React from 'react';
import DashboardNav from '../../components/ui/DashboardNav';

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-800 dark:text-gray-200 p-8 pt-0">
      {/* Top Bar - Below Main Navigation */}
      <div className="sticky top-16 bg-white dark:bg-black py-4 z-40 border-b border-gray-200 dark:border-gray-800 mb-8">
        <DashboardNav />
      </div>

      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-900 dark:text-white">
          Recent Activity
        </h1>
      </div>

      <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Your recent activity will be displayed here.
        </p>
      </div>
    </div>
  );
}
