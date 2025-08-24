// Removed Flame import as we're using custom SVG
import { cn } from '@/lib/utils';
import { Tooltip } from '@radix-ui/react-tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakBadgeProps {
  currentStreak: number;
  highestStreak: number;
  className?: string;
  isLoading?: boolean;
}

export function StreakBadge({ currentStreak, highestStreak, className, isLoading = false }: StreakBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-full",
              "text-orange-600 dark:text-orange-400",
              "hover:from-orange-500/20 hover:to-red-500/20 transition-colors",
              isLoading && "opacity-70",
              className
            )}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              className={cn(
                "w-6 h-6 lg:w-5 lg:h-5 -mt-2 lg:mt-0 bi bi-fire",
                currentStreak > 0 ? "animate-flicker" : "",
                isLoading && "animate-pulse"
              )} 
              viewBox="0 0 16 16"
            >
              <defs>
                <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ff4500" />
                  <stop offset="30%" stopColor="#ff6b35" />
                  <stop offset="60%" stopColor="#f7931e" />
                  <stop offset="100%" stopColor="#ffcc02" />
                </linearGradient>
                <linearGradient id="fireGradientInactive" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
              </defs>
              <path 
                 d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15"
                 fill={currentStreak > 0 ? "url(#fireGradient)" : "url(#fireGradientInactive)"}
               />
               <path 
                 d="M8 15c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15"
                 fill={currentStreak > 0 ? "#ffcc02" : "#d1d5db"}
               />
            </svg>
            <span className={cn( isLoading && "animate-pulse")}>{currentStreak}</span>
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