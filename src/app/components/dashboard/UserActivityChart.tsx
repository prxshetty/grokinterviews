"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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

interface UserActivityData {
  date: string;
  questionsAnswered: number;
  questionsViewed: number;
}

interface UserActivityChartProps {
  data?: UserActivityData[];
  loading?: boolean;
}

const chartConfig = {
  activity: {
    label: "Activity",
  },
  questionsAnswered: {
    label: "Questions Answered",
    color: "hsl(var(--chart-1))",
  },
  questionsViewed: {
    label: "Questions Viewed",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

// Default/sample data for when no data is provided
const defaultData: UserActivityData[] = [
  { date: "2024-04-01", questionsAnswered: 5, questionsViewed: 12 },
  { date: "2024-04-02", questionsAnswered: 3, questionsViewed: 8 },
  { date: "2024-04-03", questionsAnswered: 7, questionsViewed: 15 },
  { date: "2024-04-04", questionsAnswered: 4, questionsViewed: 10 },
  { date: "2024-04-05", questionsAnswered: 8, questionsViewed: 18 },
  { date: "2024-04-06", questionsAnswered: 6, questionsViewed: 14 },
  { date: "2024-04-07", questionsAnswered: 2, questionsViewed: 6 },
]

export function UserActivityChart({ data = defaultData, loading = false }: UserActivityChartProps) {
  const chartData = React.useMemo(() => {
    const sourceData = (data && data.length > 0) ? data : defaultData;
    return [...sourceData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Your learning activity over time</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex justify-center items-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
        <CardDescription>
          Your learning activity over time.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillQuestionsAnswered" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-questionsAnswered)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-questionsAnswered)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillQuestionsViewed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-questionsViewed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-questionsViewed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
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
              type="natural"
              fill="url(#fillQuestionsViewed)"
              stroke="var(--color-questionsViewed)"
              stackId="a"
            />
            <Area
              dataKey="questionsAnswered"
              type="natural"
              fill="url(#fillQuestionsAnswered)"
              stroke="var(--color-questionsAnswered)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 