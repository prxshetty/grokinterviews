'use client';

import React from 'react';
import { MessageSquare, User, Download, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TabNav } from '@/components/ui/tab-nav';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { VOICE_CONFIG, VoiceOption } from '@/types/voice.types';

// Interfaces
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
  session_type: 'behavioral' | 'technical' | 'general';
  interview_mode: 'web' | 'phone';
  session_start?: string;
  session_end?: string | null;
  call_duration?: number;
  interview_scores?: any[];
  voice_name?: string | undefined;
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
  filteredInterviews,
  voiceFilter,
  onVoiceFilterChange,
}: InterviewListProps) {
  const [activeTab, setActiveTab] = React.useState<'web' | 'phone'>('web');

  const getStatusBorderColor = (interview: CombinedInterview) => {
    if (interview.type === 'web') {
      if (interview.status === 'completed') return 'bg-green-500';
      if (interview.interview_scores && interview.interview_scores.length > 0) return 'bg-yellow-500';
      return 'bg-gray-300 dark:bg-gray-600';
    } else {
      switch (interview.status.toLowerCase()) {
        case 'completed':
        case 'ended':
          return 'bg-green-500';
        case 'failed':
        case 'busy':
        case 'no-answer':
          return 'bg-red-500';
        default:
          return 'bg-gray-300 dark:bg-gray-600';
      }
    }
  };

  const renderInterviewItem = (interview: CombinedInterview) => {
    const isSelected = (selectedSession?.id === interview.id && interview.type === 'web') ||
                     (selectedPhoneCall?.id === interview.id && interview.type === 'phone');
    
    const statusBorderColor = getStatusBorderColor(interview);
    const interviewer = interview.voice_name && interview.voice_name in VOICE_CONFIG ? VOICE_CONFIG[interview.voice_name as VoiceOption] : null;
    const interviewerName = interviewer ? interviewer.displayName : 'AI Interviewer';
    const interviewerImage = interviewer ? interviewer.image : ' / images / female_default.png';

    return (
      <div
        key={`${interview.type}-${interview.id}`}
        className={cn(
          "cursor-pointer transition-all duration-300 rounded-xl overflow-hidden",
          "bg-white/60 dark:bg-gray-800/60 shadow-sm border",
          isSelected 
            ? "border-blue-500/50 shadow-md"
            : "border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300/80 dark:hover:border-gray-600/80"
        )}
        onClick={() => onSelectInterview(interview)}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key="content"
            initial={{ height: 'auto' }}
            animate={{ height: isSelected ? 80 : 72 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={interviewerImage} alt={interviewerName} className="object-cover" />
                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {interviewerName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {interview.session_type} Interview
                </p>
              </div>

              {isSelected ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={(e) => { 
                      e.stopPropagation();
                      onExport(interview);
                    }}
                    className="rounded-full h-9 w-9 bg-gray-100 dark:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className={cn("h-1 w-full transition-colors duration-300", statusBorderColor)} />
      </div>
    );
  };

  const renderInterviewGroup = (title: string, interviews: CombinedInterview[]) => {
    const filtered = interviews.filter(i => i.type === activeTab);
    if (filtered.length === 0) return null;

    return (
      <div key={title}>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          {title}
        </h3>
        <div className="space-y-2">
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
        <div className="p-4 border-b border-gray-200/80 dark:border-gray-700/80">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Interview Records
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={voiceFilter} onValueChange={onVoiceFilterChange}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Voices</SelectItem>
                  {Object.entries(VOICE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredInterviews.length} total interviews
          </p>
        </div>
        
        <div className="p-3">
          <TabNav 
            items={tabItems}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as 'web' | 'phone')}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeInterviews.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-1">No {activeTab} interviews</h3>
              <p className="text-xs text-muted-foreground">
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
