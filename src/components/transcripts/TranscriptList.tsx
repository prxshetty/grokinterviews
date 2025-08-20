'use client';

import React from 'react';
import { MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TabNav } from '@/components/ui/tab-nav';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { VoiceOption } from '@/types/voice.types';
import { getVoiceDisplayName, getVoiceAvatarUrl, isVoicePremium, getAvailableVoices } from '@/utils/voiceUtils';

// Interfaces
interface InterviewSession {
  id: string;
  session_type: 'behavioral' | 'technical' | 'custom' | 'sd';
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
  voice_name?: string;
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
  voice_name?: string;
}

interface CombinedInterview {
  id: string;
  type: 'web' | 'phone';
  date: string;
  status: string;
  session_type: 'behavioral' | 'technical' | 'custom' | 'sd';
  interview_mode: 'web' | 'phone';
  session_start?: string;
  session_end?: string | null;
  call_duration?: number;
  interview_scores?: any[];
  voice_name?: string | undefined;
}

interface InterviewListProps {
  groupedInterviews: {
    today: CombinedInterview[];
    yesterday: CombinedInterview[];
    last30Days: CombinedInterview[];
    older: CombinedInterview[];
  };
  selectedSession: InterviewSession | null;
  selectedPhoneCall: PhoneCall | null;
  onSelectInterview: (interview: CombinedInterview) => void;
  onExport: (interview: CombinedInterview) => void;
  voiceFilter: VoiceOption | 'all';
  onVoiceFilterChange: (value: VoiceOption | 'all') => void;
}

export function InterviewList({
  groupedInterviews,
  selectedSession,
  selectedPhoneCall,
  onSelectInterview,
  onExport,
  voiceFilter,
  onVoiceFilterChange,
}: InterviewListProps) {
  const [activeTab, setActiveTab] = React.useState<'web' | 'phone'>('web');




  const formatDuration = (interview: CombinedInterview) => {
    if (interview.type === 'phone' && interview.call_duration) {
      const minutes = Math.floor(interview.call_duration / 60);
      const seconds = interview.call_duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (interview.type === 'web' && interview.session_start && interview.session_end) {
      const start = new Date(interview.session_start);
      const end = new Date(interview.session_end);
      const durationMs = end.getTime() - start.getTime();
      const minutes = Math.floor(durationMs / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
  };



  const renderInterviewItem = (interview: CombinedInterview) => {
    const isSelected = (selectedSession?.id === interview.id && interview.type === 'web') ||
                     (selectedPhoneCall?.id === interview.id && interview.type === 'phone');

    // Use utility functions for voice configuration
    const interviewerName = getVoiceDisplayName(interview.voice_name, interview.type);
    const interviewerImage = getVoiceAvatarUrl(interview.voice_name, interview.type);
    const duration = formatDuration(interview);

    return (
      <div
        key={`${interview.type}-${interview.id}`}
        className={cn(
          "group cursor-pointer transition-all duration-300 rounded-full relative",
          "bg-gray-100/80 dark:bg-gray-800/80 shadow-sm border backdrop-blur-sm",
          "hover:shadow-md hover:bg-gray-50/90 dark:hover:bg-gray-750/90",
          isSelected 
            ? "border-blue-500/60 shadow-lg bg-blue-50/50 dark:bg-blue-900/20"
            : "border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300/80 dark:hover:border-gray-600/80"
        )}
        onClick={() => onSelectInterview(interview)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-14 w-14 ring-2 ring-white/50 dark:ring-gray-700/50">
                <AvatarImage 
                  src={interviewerImage} 
                  alt={interviewerName} 
                  className="object-cover object-[center_25%]" 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 mt-1 space-y-1">
              {/* Title (Name) and Tag */}
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-base font-medium truncate leading-tight",
                  isVoicePremium(interview.voice_name, interview.type)
                    ? "text-amber-600 dark:text-amber-400" 
                    : "text-gray-900 dark:text-gray-100"
                )}>
                  {interviewerName}
                </h3>
                <span className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-colors flex-shrink-0 border",
                  "bg-transparent text-gray-700 border-gray-300 dark:text-gray-300 dark:border-gray-600",
                  interview.session_type === 'behavioral' && "bg-transparent text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-600",
                  interview.session_type === 'technical' && "bg-transparent text-purple-700 border-purple-300 dark:text-purple-300 dark:border-purple-600",
                  interview.session_type === 'sd' && "bg-transparent text-red-700 border-red-300 dark:text-red-300 dark:border-red-600",
                  interview.session_type === 'custom' && "bg-transparent text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-600"
                )}>
                  {interview.session_type === 'sd' ? 'SYSTEM DESIGN' : interview.session_type.toUpperCase()}
                </span>
              </div>
              
              {/* Subtitle (Date and Duration) */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {new Date(interview.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {duration && (
                  <>
                    <span>•</span>
                    <span>{duration}</span>
                  </>
                )}
              </div>
            </div>


          </div>
        </div>
      </div>
    );
  };

  const renderInterviewGroup = (title: string, interviews: CombinedInterview[]) => {
    const filtered = interviews.filter(i => i.type === activeTab);
    if (filtered.length === 0) return null;

    return (
      <div key={title} className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
          {title}
        </h3>
        <div className="space-y-3">
          {filtered.map(renderInterviewItem)}
        </div>
      </div>
    );
  };

  const activeInterviews = React.useMemo(() => {
    return Object.values(groupedInterviews).flat().filter(i => i.type === activeTab);
  }, [groupedInterviews, activeTab]);

  const tabItems = [
    { id: 'web', label: 'Web' },
    { id: 'phone', label: 'Phone' },
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm h-full flex flex-col">
        
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <TabNav
              items={tabItems}
              activeTab={activeTab}
              onTabChange={(id) => {
                setActiveTab(id as 'web' | 'phone');
                onVoiceFilterChange('all');
              }}
            />
            <Select value={voiceFilter} onValueChange={onVoiceFilterChange}>
              <SelectTrigger className="w-36 h-8 text-xs rounded-full border-gray-300/60 dark:border-gray-600/60">
                <SelectValue placeholder="Voice" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">
                  <span className="font-medium">All Voices</span>
                </SelectItem>
                {/* Show appropriate voices based on active tab */}
                {getAvailableVoices(activeTab).map((config) => (
                  <SelectItem key={config.technicalName} value={config.technicalName}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage 
                          src={config.image} 
                          alt={config.displayName}
                          className="object-cover object-[center_25%]"
                        />
                        <AvatarFallback className="text-xs">
                          {config.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                         config.tier === 'premium' 
                           ? "text-amber-600 dark:text-amber-400 font-medium" 
                           : "text-foreground font-medium"
                       )}>
                         {config.displayName}
                       </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {activeInterviews.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">No {activeTab} interviews</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Your recorded {activeTab} interviews will appear here.
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