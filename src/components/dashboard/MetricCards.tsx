import { BentoCard } from '@/components/ui/bento-card'
import { Card } from '@/components/ui/card'

export interface ProgressData {
  questionsCompleted: number
  questionsViewed: number
  totalQuestions: number
  completionPercentage: number
  domainsSolved: number
  totalDomains: number
}

export interface UserStats {
  totalTimeSpent: number
  apiCallsMade: number
  bookmarksCount: number
  questionsAnswered: number
  topicsExplored: number
  avgTimePerQuestion: number
  preferredModel: string
  loading: boolean
  error: string | null
}

interface MetricCardsProps {
  progressData: ProgressData
  userStats: UserStats
}

const cardColors: string[][] = [
  ["#10B981", "#6EE7B7", "#A7F3D0"], // Green gradient for completion
  ["#3B82F6", "#60A5FA", "#93C5FD"], // Blue gradient for time
  ["#8B5CF6", "#A78BFA", "#C4B5FD"], // Purple gradient for domains
  ["#F59E0B", "#FBBF24", "#FCD34D"], // Yellow gradient for bookmarks
] as const;

export function MetricCards({ progressData, userStats }: MetricCardsProps) {
  if (userStats.loading) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="animate-pulse border bg-card p-4 min-h-[100px]"
          >
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="mt-3 h-6 w-1/3 rounded bg-muted" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
          </Card>
        ))}
      </>
    )
  }

  const metricsData = [
    {
      title: "Questions Completed",
      value: `${Math.round(progressData.completionPercentage)}%`,
      subtitle: `${progressData.questionsCompleted} of ${progressData.totalQuestions} questions`,
      colors: cardColors[0],
      delay: 0.1,
    },
    {
      title: "Time Spent Learning",
      value: `${userStats.totalTimeSpent}m`,
      subtitle: `Avg ${userStats.avgTimePerQuestion}m per question`,
      colors: cardColors[1],
      delay: 0.2,
    },
    {
      title: "Domains Explored",
      value: `${progressData.domainsSolved}`,
      subtitle: `${userStats.topicsExplored} topics viewed`,
      colors: cardColors[2],
      delay: 0.3,
    },
    {
      title: "Bookmarks Saved",
      value: userStats.bookmarksCount,
      subtitle: `Using ${userStats.preferredModel || 'AI assistant'}`,
      colors: cardColors[3],
      delay: 0.4,
    },
  ];

  return (
    <>
      {metricsData.map((metric, index) => (
        <div key={index} className="min-h-[100px]">
          <BentoCard
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            colors={metric.colors || ["#6B7280", "#9CA3AF", "#D1D5DB"]}
            delay={metric.delay}
          />
        </div>
      ))}
    </>
  )
} 