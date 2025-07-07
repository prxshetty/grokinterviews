"use client"

import * as React from "react"
import { Suspense } from "react"
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TabNav } from "@/components/ui/tab-nav";

// Lazy load recharts components for better LCP performance
const LazyChart = React.lazy(() => 
  import("./UserActivityChartLazy").then(module => ({ default: module.UserActivityChartLazy }))
);

interface UserActivityData {
  date: string;
  questionsAnswered: number;
  questionsViewed: number;
}

interface UserActivityChartProps {
  data?: UserActivityData[];
  loading?: boolean;
  className?: string;
}

// Default/sample data for when no data is provided
const defaultData: UserActivityData[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
        date: d.toISOString().split('T')[0] as string,
        questionsAnswered: Math.floor(Math.random() * 8) + 1,
        questionsViewed: Math.floor(Math.random() * 10) + 5,
    }
}).reverse();

// Chart loading fallback component
function ChartSkeleton() {
  return (
    <div className="aspect-auto h-[250px] w-full flex items-center justify-center bg-muted/30 rounded-md">
      <LoadingSpinner />
    </div>
  );
}

export function UserActivityChart({ 
  data = defaultData, 
  loading = false, 
  className = ""
}: UserActivityChartProps) {
  const [timeRange, setTimeRange] = React.useState<"week" | "month">("month");

  const chartData = React.useMemo(() => {
    const sourceData = (data && data.length > 0) ? data : defaultData;
    const now = new Date();

    const filteredData = sourceData.filter(d => {
        const itemDate = new Date(d.date + "T00:00:00");
        if (timeRange === "week") {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return itemDate >= startOfWeek;
        }
        if (timeRange === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            return itemDate >= startOfMonth;
        }
        return true;
    });

    return [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, timeRange]);

  if (loading) {
    return (
      <Card className={`@container/card border-border/50 bg-transparent rounded-md ${className}`}>
        <CardHeader className="flex-row items-center">
          <div>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your learning activity over time</CardDescription>
          </div>
          <div className="ml-auto">
            <div className="h-9 w-48 rounded-full bg-muted animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartSkeleton />
        </CardContent>
      </Card>
    );
  }
  
  const navItems = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <Card className={`@container/card border-border/50 bg-transparent rounded-md ${className}`}>
      <CardHeader className="flex-row items-center">
        <div>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>
              Your learning activity over time
            </CardDescription>
        </div>
        <div className="ml-auto">
            <TabNav
                items={navItems}
                activeTab={timeRange}
                onTabChange={(tabId) => setTimeRange(tabId as "week" | "month")}
            />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <Suspense fallback={<ChartSkeleton />}>
          <LazyChart data={chartData} />
        </Suspense>
      </CardContent>
    </Card>
  )
} 