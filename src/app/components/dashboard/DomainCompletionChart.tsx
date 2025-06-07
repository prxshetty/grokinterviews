"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DomainStat {
  domainName: string;
  completionPercentage: number;
}

interface DomainCompletionChartProps {
  data: DomainStat[];
}

const chartConfig = {
  completionPercentage: {
    label: "Completion %",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function DomainCompletionChart({ data }: DomainCompletionChartProps) {
  const chartData = data
    .map(item => ({
      name: item.domainName,
      completionPercentage: item.completionPercentage,
    }))
    // show top 5 completed domains
    .sort((a, b) => b.completionPercentage - a.completionPercentage)
    .slice(0, 5)
    .reverse();

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{
          left: 10,
          right: 50,
        }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={5}
          axisLine={false}
          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 14)}…` : value}
          interval={0}
          width={100}
        />
        <XAxis dataKey="completionPercentage" type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar
          dataKey="completionPercentage"
          layout="vertical"
          fill="var(--color-completionPercentage)"
          radius={4}
        >
          <LabelList
            dataKey="completionPercentage"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
            formatter={(value: number) => `${Math.round(value)}%`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
} 