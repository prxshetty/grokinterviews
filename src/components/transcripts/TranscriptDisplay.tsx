'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TabNav } from '@/components/ui/tab-nav';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Eye, 
  Trash2,
  Download,
  ChevronRight,
  Star,
  BarChart3,
  Settings
} from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '@/config';
import { cn } from '@/lib/utils';

interface InterviewSession {
  id: string;
  session_type: 'behavioral' | 'technical' | 'general';
  session_start: string;
  session_end: string | null;
  question_count: number;
  week_identifier: string;
  is_completed: boolean;
  transcripts: Transcript[];
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
  conversationFlow?: Array<{
    id: string;
    interactionType: string;
    transcriptText: string;
    conversationOrder: number;
    createdAt: string;
  }>;
  vapiData?: {
    messages?: Array<{
      role: 'assistant' | 'user' | 'system' | 'function';
      message: string;
      time: number;
      endTime?: number;
      secondsFromStart: number;
      duration?: number;
    }>;
    cost?: number;
    endedReason?: string;
    analysis?: any;
    artifact?: any;
  };
}

interface Transcript {
  id: string;
  transcript_text: string;
  interaction_type: 'ai_response' | 'user_response';
  created_at: string;
  conversation_order: number;
  ai_response?: string;
}

interface InterviewScore {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  detailed_feedback: string;
  created_at: string;
}

interface TranscriptDisplayProps {
  selectedSession: InterviewSession | null;
  selectedPhoneCall: PhoneCall | null;
  selectedScore: InterviewScore | null;
  loadingScore: boolean;
  activeTab: string;
  isExporting: boolean;
  profile: any;
  onTabChange: (tab: string) => void;
  onExportSession: (session: InterviewSession) => void;
  onExportPhoneTranscript: (phoneCall: PhoneCall) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function TranscriptDisplay({
  selectedSession,
  selectedPhoneCall,
  selectedScore,
  loadingScore,
  activeTab,
  isExporting,
  profile,
  onTabChange,
  onExportSession,
  onExportPhoneTranscript,
  onDeleteSession
}: TranscriptDisplayProps) {
  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'behavioral': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'technical': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'general': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Incomplete';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!selectedSession && !selectedPhoneCall) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Select an Interview
          </h3>
          <p className="text-muted-foreground">
            Choose an interview from the list to view its transcript and details.
          </p>
        </div>
      </div>
    );
  }

  const isWebInterview = !!selectedSession;

  return (
    <div className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border-0 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={getSessionTypeColor(isWebInterview ? (selectedSession?.session_type || 'general') : 'general')}>
                {isWebInterview ? (selectedSession?.session_type || 'General') : 'General'} Interview
              </Badge>
              <Badge variant="outline" className="text-xs">
                {isWebInterview ? 'Web' : 'Phone'} Interview
              </Badge>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Interview Session
            </h2>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(isWebInterview ? (selectedSession?.session_start || '') : (selectedPhoneCall?.created_at || ''))}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {isWebInterview 
                  ? formatDuration(selectedSession!.session_start, selectedSession!.session_end)
                  : formatPhoneDuration(selectedPhoneCall!.call_duration || 0)
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => isWebInterview ? onExportSession(selectedSession!) : onExportPhoneTranscript(selectedPhoneCall!)}
              disabled={isExporting}
              className="rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            
            {isWebInterview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteSession(selectedSession!.id)}
                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <TabNav
          items={[
            { id: 'transcript', label: 'Transcript' },
            { id: 'analysis', label: 'Analysis' }
          ]}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {isWebInterview ? (
              // Web Interview Transcript
              selectedSession!.transcripts && selectedSession!.transcripts.length > 0 ? (
                selectedSession!.transcripts
                  .sort((a, b) => a.conversation_order - b.conversation_order)
                  .map((transcript) => (
                    <div key={transcript.id} className="space-y-3">
                      {transcript.interaction_type === 'ai_response' && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src="/ai-avatar.png" alt="AI" />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">AI</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {transcript.transcript_text}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {transcript.interaction_type === 'user_response' && (
                        <div className="flex gap-3 justify-end">
                          <div className="flex-1 max-w-[80%] bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {transcript.transcript_text}
                            </p>
                          </div>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt="You" />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transcript available for this session.</p>
                </div>
              )
            ) : (
              // Phone Interview Transcript
              selectedPhoneCall!.transcript_text ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedPhoneCall!.transcript_text}
                  </p>
                </div>
              ) : selectedPhoneCall!.conversationFlow && selectedPhoneCall!.conversationFlow.length > 0 ? (
                <div className="space-y-4">
                  {selectedPhoneCall!.conversationFlow
                    .sort((a, b) => a.conversationOrder - b.conversationOrder)
                    .map((flow) => (
                      <div key={flow.id} className="space-y-3">
                        <div className={cn(
                          "flex gap-3",
                          flow.interactionType === 'user_response' ? 'justify-end' : ''
                        )}>
                          {flow.interactionType === 'ai_response' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src="/ai-avatar.png" alt="AI" />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">AI</AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "flex-1 rounded-2xl p-4",
                            flow.interactionType === 'ai_response' 
                              ? "bg-blue-50 dark:bg-blue-900/20" 
                              : "max-w-[80%] bg-gray-50 dark:bg-gray-700/50"
                          )}>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {flow.transcriptText}
                            </p>
                          </div>
                          
                          {flow.interactionType === 'user_response' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt="You" />
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {profile?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transcript available for this phone call.</p>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {isWebInterview ? (
              // Web Interview Analysis
              loadingScore ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="md" text="Loading analysis..." />
                </div>
              ) : selectedScore ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Overall Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className={cn("text-3xl font-bold", getScoreColor(selectedScore.overall_score))}>
                          {selectedScore.overall_score}/10
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(selectedScore.overall_score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths */}
                  {selectedScore.strengths && selectedScore.strengths.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-green-600 dark:text-green-400">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedScore.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Areas for Improvement */}
                  {selectedScore.weaknesses && selectedScore.weaknesses.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-orange-600 dark:text-orange-400">Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedScore.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Feedback */}
                  {selectedScore.detailed_feedback && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle>Detailed Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {selectedScore.detailed_feedback}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-sm font-medium mb-2">No Analysis Available</h3>
                  <p className="text-xs text-muted-foreground">
                    Complete the interview to see your performance analysis.
                  </p>
                </div>
              )
            ) : (
              // Phone Interview Analysis
              selectedPhoneCall!.analysis_summary || selectedPhoneCall!.interview_score ? (
                <div className="space-y-6">
                  {selectedPhoneCall!.interview_score && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Interview Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className={cn("text-3xl font-bold", getScoreColor(selectedPhoneCall!.interview_score!))}>
                            {selectedPhoneCall!.interview_score}/10
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(selectedPhoneCall!.interview_score! / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedPhoneCall!.analysis_summary && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle>Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {selectedPhoneCall!.analysis_summary}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedPhoneCall!.strengths && selectedPhoneCall!.strengths.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-green-600 dark:text-green-400">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedPhoneCall!.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {selectedPhoneCall!.weaknesses && selectedPhoneCall!.weaknesses.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-orange-600 dark:text-orange-400">Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedPhoneCall!.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {selectedPhoneCall!.recommendations && selectedPhoneCall!.recommendations.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle>Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedPhoneCall!.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Settings className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-sm font-medium mb-2">No Analysis Available</h3>
                  <p className="text-xs text-muted-foreground">
                    Analysis data is not available for this phone interview.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}