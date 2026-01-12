'use client';



interface ProgressBarProps {
  progress: number; // 0-100
  total?: number;
  completed?: number;
  showText?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({
  progress,
  total,
  completed,
  showText = true,
  height = 'md',
  className = '',
}: ProgressBarProps) {
  // Ensure progress is a number and clamped between 0 and 100
  const numericProgress = typeof progress === 'string' ? parseFloat(progress) : progress;
  const safeProgress = Math.max(0, Math.min(numericProgress || 0, 100));

  // Determine height class
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[height];

  // For display, if progress is very small but > 0, set a minimum width to make it visible
  const displayWidth = (safeProgress > 0 && safeProgress < 2) ? 2 : safeProgress;

  const progressColor = 'bg-foreground';

  return (
    <div className={`flex items-center w-full ${className}`}>
      <div className={`flex-grow bg-muted rounded-full overflow-hidden ${heightClass} relative`}>
        <div
          className={`${progressColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${displayWidth}%`, height: '100%' }}
        ></div>
        {/* Progress indicator dot */}
        {safeProgress > 0 && (
          <div
            className="absolute w-3 h-3 bg-foreground rounded-full border-2 border-background transition-all duration-500 ease-out"
            style={{
              left: `${displayWidth}%`,
              top: '50%',
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          />
        )}
      </div>

      {showText && (
        <div className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
          {completed !== undefined && total !== undefined ? (
            <span>{completed}/{total}</span>
          ) : (
            <span>{Math.round(safeProgress)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
