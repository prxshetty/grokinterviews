"use client"

import * as React from "react"
import { Area, AreaChart, XAxis } from "recharts"
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

interface UserActivityChartLazyProps {
  data: UserActivityData[];
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

export function UserActivityChartLazy({ data }: UserActivityChartLazyProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[250px] w-full"
    >
      <AreaChart data={data}>
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
  )
} 