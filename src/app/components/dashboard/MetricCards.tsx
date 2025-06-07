import { TrendingDownIcon, TrendingUpIcon, BookmarkIcon, ClockIcon, TargetIcon, BrainIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ProgressData {
  questionsCompleted: number;
  questionsViewed: number;
  totalQuestions: number;
  completionPercentage: number;
  domainsSolved: number;
  totalDomains: number;
}

interface UserStats {
  totalTimeSpent: number;
  apiCallsMade: number;
  bookmarksCount: number;
  questionsAnswered: number;
  topicsExplored: number;
  avgTimePerQuestion: number;
  preferredModel: string;
  loading: boolean;
  error: string | null;
}

interface MetricCardsProps {
  progressData: ProgressData;
  userStats: UserStats;
}

export function MetricCards({ progressData, userStats }: MetricCardsProps) {
  if (userStats.loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 px-4 lg:px-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader className="relative">
              <CardDescription className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <CardTitle className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate trends (you might want to store previous values to calculate real trends)
  const completionTrend = progressData.completionPercentage > 5 ? 'up' : 'neutral';
  const timeTrend = userStats.totalTimeSpent > 60 ? 'up' : 'neutral';
  const domainsTrend = progressData.domainsSolved > 1 ? 'up' : 'neutral';
  const apiTrend = userStats.apiCallsMade > 10 ? 'up' : 'neutral';

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUpIcon className="size-3" />;
    if (trend === 'down') return <TrendingDownIcon className="size-3" />;
    return <TargetIcon className="size-3" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 px-4 lg:px-6">
      {/* Questions Completed */}
      <Card className="@container/card shadow-xs bg-gradient-to-t from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent">
        <CardHeader className="relative">
          <CardDescription>Questions Completed</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {progressData.questionsCompleted}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className={`flex gap-1 rounded-lg text-xs ${getTrendColor(completionTrend)}`}>
              {getTrendIcon(completionTrend)}
              {progressData.completionPercentage.toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {completionTrend === 'up' ? 'Great progress!' : 'Keep going!'} <BrainIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {progressData.totalQuestions - progressData.questionsCompleted} questions remaining
          </div>
        </CardFooter>
      </Card>

      {/* Time Spent */}
      <Card className="@container/card shadow-xs bg-gradient-to-t from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent">
        <CardHeader className="relative">
          <CardDescription>Time Spent Learning</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {userStats.totalTimeSpent}m
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className={`flex gap-1 rounded-lg text-xs ${getTrendColor(timeTrend)}`}>
              {getTrendIcon(timeTrend)}
              {userStats.avgTimePerQuestion > 0 ? `${userStats.avgTimePerQuestion}m/q` : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {timeTrend === 'up' ? 'Consistent learning' : 'Building momentum'} <ClockIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Average {userStats.avgTimePerQuestion || 0} min per question
          </div>
        </CardFooter>
      </Card>

      {/* Domains Solved */}
      <Card className="@container/card shadow-xs bg-gradient-to-t from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent">
        <CardHeader className="relative">
          <CardDescription>Domains Explored</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {progressData.domainsSolved}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className={`flex gap-1 rounded-lg text-xs ${getTrendColor(domainsTrend)}`}>
              {getTrendIcon(domainsTrend)}
              of {progressData.totalDomains}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {domainsTrend === 'up' ? 'Diverse learning' : 'Expanding knowledge'} <TargetIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {userStats.topicsExplored} topics explored
          </div>
        </CardFooter>
      </Card>

      {/* API Calls / AI Usage */}
      <Card className="@container/card shadow-xs bg-gradient-to-t from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent">
        <CardHeader className="relative">
          <CardDescription>AI Interactions</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {userStats.apiCallsMade}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className={`flex gap-1 rounded-lg text-xs ${getTrendColor(apiTrend)}`}>
              {getTrendIcon(apiTrend)}
              {userStats.bookmarksCount} saved
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {apiTrend === 'up' ? 'Active AI usage' : 'Getting started'} <BookmarkIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Using {userStats.preferredModel || 'AI assistant'}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 