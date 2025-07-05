import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@radix-ui/react-tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakBadgeProps {
  currentStreak: number;
  highestStreak: number;
  className?: string;
}

export function StreakBadge({ currentStreak, highestStreak, className }: StreakBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-full",
              "bg-gradient-to-r from-orange-500/10 to-red-500/10",
              "text-orange-600 dark:text-orange-400",
              "border border-orange-200/50 dark:border-orange-500/20",
              "hover:from-orange-500/20 hover:to-red-500/20 transition-colors",
              className
            )}
          >
            <Flame 
              className={cn(
                "w-4 h-4",
                currentStreak > 0 ? "animate-flicker text-orange-500" : "text-gray-400"
              )} 
            />
            <span>{currentStreak}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {currentStreak} Day{currentStreak !== 1 ? 's' : ''} Streak
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Longest Streak: {highestStreak} Day{highestStreak !== 1 ? 's' : ''}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 