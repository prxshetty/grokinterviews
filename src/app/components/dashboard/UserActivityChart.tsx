"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

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
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("7d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return defaultData;
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const today = new Date();
    let daysToSubtract = 7;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "90d") {
      daysToSubtract = 90;
    }
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    return sortedData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [data, timeRange]);

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Your learning activity over time</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex justify-center items-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Activity Overview</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Your learning activity over the selected period
          </span>
          <span className="@[540px]/card:hidden">Your activity</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
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
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
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