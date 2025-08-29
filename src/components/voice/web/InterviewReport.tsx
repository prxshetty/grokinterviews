import React from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';

interface InterviewReportProps {
  report: {
    overall_score: number;
    summary?: string;
    detailed_feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    improvements?: string[];
  };
}

export default function InterviewReport({ report }: InterviewReportProps) {
  const router = useRouter();
  
  // Handle null/undefined report
  if (!report) {
    return (
      <div className="w-full max-w-[380px] md:max-w-[500px] lg:max-w-[700px] mx-auto">
        <div className="rounded-3xl border border-border bg-background p-4 shadow-[0_8px_30px_rgba(0,0,0,0.24)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">No report data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure score is within valid range (1-10)
  const normalizedScore = Math.max(1, Math.min(10, Math.round(report.overall_score)));



  const handleViewAnalysis = () => {
    router.push('/transcripts');
  };

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <button 
        onClick={handleViewAnalysis}
        className="w-full rounded-2xl border border-border bg-background p-1 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-muted/50 hover:border-muted-foreground/30"
        title="View Analysis"
      >
        <div className="flex items-center justify-between p-1">
          {/* Score Display - Left Side */}
          <div className="flex items-center gap-1.5">
            {/* Score Circle - Smaller */}
            <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(normalizedScore / 10) * 251.2} 251.2`}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-light text-foreground">{normalizedScore}</span>
              </div>
            </div>

            {/* Report Text */}
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">View detailed analysis</p>
            </div>
          </div>

          {/* Icon - Right Side */}
          <Play className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}