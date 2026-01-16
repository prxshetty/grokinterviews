'use client';

import { useState, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { getSession, updateSession } from '@/utils/transcript-storage';

interface InterviewReport {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  detailed_feedback?: string;
}

interface TranscriptReportProps {
  score?: number;
  label?: string;
  sessionId?: string;
  sessionType?: string;
  apiKey?: string;
  onReportGenerated?: (report: InterviewReport) => void;
}

export function TranscriptReport({
  score,
  label = "Overall Score",
  sessionId,
  sessionType = 'behavioral',
  apiKey,
  onReportGenerated
}: TranscriptReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScore, setGeneratedScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayScore = score ?? generatedScore;
  const normalizedScore = displayScore !== null
    ? Math.max(0, Math.min(10, Math.round(displayScore)))
    : null;

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

  const handleStartAnalysis = useCallback(async () => {
    if (!sessionId || !apiKey) {
      setError('Missing session or API key');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get session from localStorage
      const session = getSession(sessionId);
      if (!session || session.messages.length === 0) {
        setError('No transcript data found');
        setIsGenerating(false);
        return;
      }

      // Convert messages to conversation history format
      const conversationHistory = session.messages.map(msg => ({
        type: msg.type,
        text: msg.text
      }));

      // Get the last user response for the API call
      const lastUserMessage = session.messages
        .filter(msg => msg.type === 'user')
        .pop();

      if (!lastUserMessage) {
        setError('No user responses found');
        setIsGenerating(false);
        return;
      }

      // Call the existing conversation API to generate a score
      // We simulate completing the interview by passing enough history
      const response = await fetch('/api/voice/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userResponse: lastUserMessage.text,
          conversationHistory: conversationHistory.slice(0, -1), // All except last
          sessionId,
          sessionType: session.sessionType || sessionType,
          apiKey,
          // Force scoring by having enough questions
          forceScore: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate analysis');
      }

      const result = await response.json();

      if (result.interviewReport) {
        const report = typeof result.interviewReport === 'string'
          ? JSON.parse(result.interviewReport)
          : result.interviewReport;

        setGeneratedScore(report.overall_score);

        // Save to localStorage
        updateSession(sessionId, { score: report });

        onReportGenerated?.(report);
      } else {
        setError('Could not generate analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, apiKey, sessionType, onReportGenerated]);

  // Show Start Analysis button if no score and sessionId is provided
  if (normalizedScore === null && sessionId) {
    return (
      <div className="bg-background border border-border rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Interview Analysis
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Generate an AI-powered analysis of your interview performance
          </p>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleStartAnalysis}
            disabled={isGenerating || !apiKey}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Start Analysis
              </>
            )}
          </button>

          {!apiKey && (
            <p className="text-muted-foreground text-xs mt-3">
              Configure your API key in Account Settings
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show nothing if no score and no sessionId
  if (normalizedScore === null) {
    return null;
  }

  // Show score card
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