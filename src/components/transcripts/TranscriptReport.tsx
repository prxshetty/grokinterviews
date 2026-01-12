'use client';



interface TranscriptReportProps {
  score: number;
  label?: string;
}

export function TranscriptReport({ score, label = "Overall Score" }: TranscriptReportProps) {
  const normalizedScore = Math.max(0, Math.min(10, Math.round(score)));

  const getPerformanceText = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Needs Improvement';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-blue-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-background border border-border rounded-3xl p-8 shadow-lg">
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-foreground">
              {label}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="text-center mt-5">
              <div className={`text-6xl font-bold ${getScoreColor(normalizedScore)} mb-2`}>
                {normalizedScore}
              </div>
              <div className="text-lg font-medium text-muted-foreground mb-4">
                {getPerformanceText(normalizedScore)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`${getProgressColor(normalizedScore)} h-2 rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${(normalizedScore / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}