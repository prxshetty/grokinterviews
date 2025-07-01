"use client"; 

import React from "react";
import { usePathname } from "next/navigation";
import { TabNav } from "@/components/ui/tab-nav";

interface DashboardNavProps {
  className?: string;
}

function DashboardNav({ className = "" }: DashboardNavProps) {
  const pathname = usePathname();

  // Define dashboard tabs with href for navigation
  const dashboardTabs = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'activity', label: 'Recent Activity', href: '/dashboard/activity' },
    { id: 'bookmarks', label: 'Bookmarks', href: '/dashboard/bookmarks' },
  ];

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/dashboard/activity') return 'activity';
    if (pathname === '/dashboard/bookmarks') return 'bookmarks';
    return 'dashboard'; // fallback
  };

  return (
    <div className={`flex items-center w-full ${className}`}>
      <TabNav
        items={dashboardTabs}
        activeTab={getActiveTab()}
        onTabChange={() => {}} // Navigation handled by Links
        variant="link"
      />
    </div>
  );
}

export default DashboardNav; 