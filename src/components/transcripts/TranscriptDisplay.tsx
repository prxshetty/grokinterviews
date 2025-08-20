'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabNav } from '@/components/ui/tab-nav';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Calendar, 
  TrendingUp, 
  Eye, 
  ChevronRight,
  Star,
  BarChart3,
} from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '@/config';
import { cn } from '@/lib/utils';
import { getVoiceAvatarUrl } from '@/utils/voiceUtils';
import { getScoreColor } from '@/components/voice/shared/utils';
import { MiniAudioPlayer } from '@/components/ui/MiniAudioPlayer';

interface InterviewSession {
  id: string;
  session_type: 'behavioral' | 'technical' | 'custom' | 'sd';
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
  conversationFlow?: Array<{
    id: string;
    interactionType: string;
    transcriptText: string;
    conversationOrder: number;
    createdAt: string;
  }>;
  vapiData?: {
    messages?: Array<{
      role: 'assistant' | 'user' | 'system' | 'function' | 'bot';
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
  voice_name?: string;
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
  profile: any;
  onTabChange: (tab: string) => void;
}

export function TranscriptDisplay({
  selectedSession,
  selectedPhoneCall,
  selectedScore,
  loadingScore,
  activeTab,
  profile,
  onTabChange
}: TranscriptDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Use utility function for voice avatar URL with fallback to DEFAULT_AVATAR_URL
  const getVoiceAvatar = (voiceName?: string, interviewType?: 'web' | 'phone') => {
    const avatarUrl = getVoiceAvatarUrl(voiceName, interviewType);
    return avatarUrl || DEFAULT_AVATAR_URL;
  };

  if (!selectedSession && !selectedPhoneCall) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="h-20 w-20 text-gray-400" />
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
    <div className="flex-1 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col">
      {/* Tab Navigation with Session Info */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <TabNav
            items={[
              { id: 'transcript', label: 'Transcript' },
              { id: 'analysis', label: 'Analysis' }
            ]}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          
          {/* Mini Audio Player for Phone Interviews */}
          {selectedPhoneCall && (
            <MiniAudioPlayer callId={selectedPhoneCall.vapi_call_id} />
          )}
        </div>
      </div>



      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'transcript' && (
          <div className="h-full overflow-y-auto px-6 py-6">
            {isWebInterview ? (
              /* Web Interview Transcript */
              <div className="space-y-6">       
                <div className="space-y-4">
                  {selectedSession?.transcripts
                    ?.sort((a, b) => a.conversation_order - b.conversation_order)
                    .map((transcript) => (
                      <div
                        key={transcript.id}
                        className={`flex gap-3 ${
                          transcript.interaction_type === 'user_response' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {transcript.interaction_type === 'ai_response' && (
                          <div className="flex-shrink-0">
                            <img
                              src={getVoiceAvatar(transcript.voice_name || selectedSession?.voice_name, 'web')}
                              alt="AI"
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div
                           className={`max-w-xs lg:max-w-md px-4 py-2 ${
                             transcript.interaction_type === 'user_response'
                               ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                               : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md'
                           }`}
                         >
                           <p className="text-sm whitespace-pre-wrap">{transcript.transcript_text}</p>
                           <p className={`text-xs opacity-70 mt-2 ${
                             transcript.interaction_type === 'user_response' ? 'text-right' : 'text-left'
                           }`}>
                             {new Date(transcript.created_at).toLocaleTimeString([], {
                               hour: '2-digit',
                               minute: '2-digit'
                             })}
                           </p>
                         </div>
                        
                        {transcript.interaction_type === 'user_response' && (
                          <div className="flex-shrink-0">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt="User" />
                              <AvatarFallback>
                                {profile?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              /* Phone Call Transcript */
              <div className="space-y-6">                
                <div className="space-y-4">
                  {/* Use VAPI messages if available, fallback to conversationFlow */}
                  {selectedPhoneCall?.vapiData?.messages && selectedPhoneCall.vapiData.messages.length > 0 ? (
                    selectedPhoneCall.vapiData.messages
                      .filter(msg => msg.role === 'bot' || msg.role === 'user')
                      .sort((a, b) => a.secondsFromStart - b.secondsFromStart)
                      .map((message, index) => (
                        <div
                          key={`vapi-${index}`}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.role === 'bot' && (
                            <div className="flex-shrink-0">
                              <img
                                src={getVoiceAvatar(selectedPhoneCall?.voice_name, 'phone')}
                                alt="AI"
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div
                             className={`max-w-xs lg:max-w-md px-4 py-2 ${
                               message.role === 'user'
                                 ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                                 : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md'
                             }`}
                           >
                             <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                             <p className={`text-xs opacity-70 mt-2 ${
                               message.role === 'user' ? 'text-right' : 'text-left'
                             }`}>
                               {Math.floor(message.secondsFromStart / 60)}:{String(Math.floor(message.secondsFromStart % 60)).padStart(2, '0')}
                             </p>
                           </div>
                          
                          {message.role === 'user' && (
                            <div className="flex-shrink-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt="User" />
                                <AvatarFallback>
                                  {profile?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    /* Fallback to conversationFlow for older data */
                    selectedPhoneCall?.conversationFlow
                      ?.sort((a, b) => a.conversationOrder - b.conversationOrder)
                      .map((flow) => (
                        <div
                          key={flow.id}
                          className={`flex gap-3 ${
                            flow.interactionType === 'user_response' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {flow.interactionType === 'ai_response' && (
                            <div className="flex-shrink-0">
                              <img
                                src={getVoiceAvatar(selectedPhoneCall?.voice_name, 'phone')}
                                alt="AI"
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div
                             className={`max-w-xs lg:max-w-md px-4 py-2 ${
                               flow.interactionType === 'user_response'
                                 ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                                 : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md'
                             }`}
                           >
                             <p className="text-sm whitespace-pre-wrap">{flow.transcriptText}</p>
                             <p className={`text-xs opacity-70 mt-2 ${
                               flow.interactionType === 'user_response' ? 'text-right' : 'text-left'
                             }`}>
                               {new Date(flow.createdAt).toLocaleTimeString([], {
                                 hour: '2-digit',
                                 minute: '2-digit'
                               })}
                             </p>
                           </div>
                          
                          {flow.interactionType === 'user_response' && (
                            <div className="flex-shrink-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt="User" />
                                <AvatarFallback>
                                  {profile?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="h-full overflow-y-auto px-6 py-6">
            {loadingScore ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Interview Analysis
                </h2>
                
                {(selectedScore || selectedPhoneCall?.analysis_summary) ? (
                  <div className="grid gap-6">
                    {/* Overall Score */}
                    {(selectedScore?.overall_score || selectedPhoneCall?.interview_score) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Overall Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "text-3xl font-bold",
                              getScoreColor(selectedScore?.overall_score || selectedPhoneCall?.interview_score || 0).replace('bg-', 'text-').replace('/20', '')
                            )}>
                              {selectedScore?.overall_score || selectedPhoneCall?.interview_score}/10
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {selectedScore?.overall_score || selectedPhoneCall?.interview_score! >= 8 ? 'Excellent performance' :
                               selectedScore?.overall_score || selectedPhoneCall?.interview_score! >= 6 ? 'Good performance' :
                               selectedScore?.overall_score || selectedPhoneCall?.interview_score! >= 4 ? 'Average performance' :
                               'Needs improvement'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Strengths */}
                    {(selectedScore?.strengths?.length || selectedPhoneCall?.strengths?.length) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-green-700 dark:text-green-400">
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {(selectedScore?.strengths || selectedPhoneCall?.strengths || []).map((strength, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Areas for Improvement */}
                    {(selectedScore?.weaknesses?.length || selectedPhoneCall?.weaknesses?.length) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-amber-700 dark:text-amber-400">
                            Areas for Improvement
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {(selectedScore?.weaknesses || selectedPhoneCall?.weaknesses || []).map((weakness, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Recommendations */}
                    {(selectedScore?.improvements?.length || selectedPhoneCall?.recommendations?.length) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-blue-700 dark:text-blue-400">
                            Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {(selectedScore?.improvements || selectedPhoneCall?.recommendations || []).map((improvement, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Detailed Feedback */}
                    {(selectedScore?.detailed_feedback || selectedPhoneCall?.analysis_summary) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Detailed Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedScore?.detailed_feedback || selectedPhoneCall?.analysis_summary}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No Analysis Available
                    </h3>
                    <p className="text-muted-foreground">
                      Analysis will appear here once the interview is processed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}