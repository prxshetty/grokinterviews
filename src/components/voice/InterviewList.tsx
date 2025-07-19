'use client';

import React from 'react';
import { Clock, MessageSquare, Monitor, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterviewSession {
  id: string;
  session_type: 'behavioral' | 'technical' | 'general';
  session_start: string;
  session_end: string | null;
  question_count: number;
  week_identifier: string;
  is_completed: boolean;
  interview_scores?: {
    overall_score: number;
    created_at: string;
  }[];
  interview_mode?: 'web' | 'phone';
}

interface PhoneCall {
  id: string;
  user_id: string;
  vapi_call_id: string;
  phone_number: string;
  call_status: string;
  call_duration: number;
  audio_recording_url?: string;
  transcript_text?: string;
  analysis_summary?: string;
  interview_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface CombinedInterview {
  id: string;
  type: 'web' | 'phone';
  date: string;
  status: string;
  session_type: 'behavioral' | 'technical' | 'general';
  interview_mode: 'web' | 'phone';
  session_start?: string;
  session_end?: string | null;
  call_duration?: number;
  interview_scores?: any[];
}

interface InterviewListProps {
  filteredInterviews: CombinedInterview[];
  groupedInterviews: {
    today: CombinedInterview[];
    yesterday: CombinedInterview[];
    last30Days: CombinedInterview[];
    older: CombinedInterview[];
  };
  selectedSession: InterviewSession | null;
  selectedPhoneCall: PhoneCall | null;
  onSelectInterview: (interview: CombinedInterview) => void;
}

export function InterviewList({
  filteredInterviews,
  groupedInterviews,
  selectedSession,
  selectedPhoneCall,
  onSelectInterview
}: InterviewListProps) {
  const getInterviewModeIcon = (type: 'web' | 'phone') => {
    return type === 'web' ? Monitor : Phone;
  };

  const formatWebDuration = (start: string, end: string | null) => {
    if (!end) {
      return 'Incomplete';
    }
    
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  const formatPhoneDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'ended':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
      case 'ringing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
      case 'busy':
      case 'no-answer':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderInterviewItem = (interview: CombinedInterview) => {
    const IconComponent = getInterviewModeIcon(interview.type);
    const isSelected = (selectedSession?.id === interview.id && interview.type === 'web') ||
                     (selectedPhoneCall?.id === interview.id && interview.type === 'phone');
    
    return (
      <div
        key={`${interview.type}-${interview.id}`}
        className={cn(
          "cursor-pointer transition-all duration-200 rounded-2xl p-4 border group hover:shadow-md",
          isSelected 
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm" 
            : "bg-white/60 dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-700/80"
        )}
        onClick={() => onSelectInterview(interview)}
      >
        <div className="flex items-center justify-between">
          {/* Left side: SVG + Status */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-lg",
              interview.type === 'web' 
                ? "bg-blue-100 dark:bg-blue-900/30" 
                : "bg-green-100 dark:bg-green-900/30"
            )}>
              <IconComponent className={cn(
                "h-3.5 w-3.5",
                interview.type === 'web' 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-green-600 dark:text-green-400"
              )} />
            </div>
            
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              interview.type === 'web'
                ? interview.status === 'completed'
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : (interview.interview_scores && interview.interview_scores.length > 0)
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                : getCallStatusColor(interview.status)
            )}>
              {interview.type === 'web' 
                ? interview.status === 'completed' 
                  ? 'Completed' 
                  : (interview.interview_scores && interview.interview_scores.length > 0)
                    ? 'In Progress'
                    : 'Incomplete'
                : interview.status.charAt(0).toUpperCase() + interview.status.slice(1)
              }
            </span>
          </div>
          
          {/* Right side: Duration */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {interview.type === 'web' 
              ? formatWebDuration(interview.session_start!, interview.session_end!)
              : formatPhoneDuration(interview.call_duration || 0)
            }
          </div>
        </div>
      </div>
    );
  };

  const renderInterviewGroup = (title: string, interviews: CombinedInterview[]) => {
    if (interviews.length === 0) return null;

    return (
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          {title}
        </h3>
        <div className="space-y-3">
          {interviews.map(renderInterviewItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border-0 shadow-sm h-full flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-medium text-foreground mb-1">
            Interview Records
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredInterviews.length} interviews found
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredInterviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-2">No interviews found</h3>
              <p className="text-xs text-muted-foreground">
                Start your first interview to see records here.
              </p>
            </div>
          ) : (
            <>
              {renderInterviewGroup("Today", groupedInterviews.today)}
              {renderInterviewGroup("Yesterday", groupedInterviews.yesterday)}
              {renderInterviewGroup("Last 30 Days", groupedInterviews.last30Days)}
              {renderInterviewGroup("Older", groupedInterviews.older)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}