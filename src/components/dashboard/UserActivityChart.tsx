"use client"

import * as React from "react"
import { Area, AreaChart, XAxis } from "recharts"
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { TabNav } from "@/components/ui/tab-nav";

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

const chartConfig = {
  questionsAnswered: {
    label: "Q. Completed",
    color: "#10B981", // emerald-500
  },
  questionsViewed: {
    label: "Q. Viewed",
    color: "#818CF8", // indigo-400
  },
} satisfies ChartConfig

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
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Your learning activity over time</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <LoadingSpinner />
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
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillQuestionsAnswered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-questionsAnswered)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-questionsAnswered)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillQuestionsViewed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-questionsViewed)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-questionsViewed)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value: string) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="questionsViewed"
              type="monotone"
              fill="url(#fillQuestionsViewed)"
              stroke="var(--color-questionsViewed)"
            />
            <Area
              dataKey="questionsAnswered"
              type="monotone"
              fill="url(#fillQuestionsAnswered)"
              stroke="var(--color-questionsAnswered)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 