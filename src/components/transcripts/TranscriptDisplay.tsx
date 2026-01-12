'use client';


import Image from 'next/image';
import { TabNav } from '@/components/ui/tab-nav';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
// add reusable report components
import { TranscriptReport } from '@/components/transcripts/TranscriptReport';
import { AnalysisCard } from '@/components/transcripts/AnalysisCard';
import { DetailedFeedbackCard } from '@/components/transcripts/DetailedFeedbackCard';
import {
  TrendingUp,
  Eye,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '@/config';
import { getVoiceAvatarUrl } from '@/utils/voiceUtils';

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
  }[] | undefined;
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
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <TabNav
            items={[
              { id: 'transcript', label: 'Transcript' },
              { id: 'analysis', label: 'Analysis' }
            ]}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
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
                        className={`flex gap-3 ${transcript.interaction_type === 'user_response' ? 'justify-end' : 'justify-start'
                          }`}
                      >
                        {transcript.interaction_type === 'ai_response' && (
                          <div className="flex-shrink-0">
                            <Image
                              src={getVoiceAvatar(transcript.voice_name || selectedSession?.voice_name, 'web')}
                              alt="AI"
                              className="h-8 w-8 rounded-full object-cover"
                              width={32}
                              height={32}
                              loading="lazy"
                              sizes="32px"
                            />
                          </div>
                        )}

                        <div
                          className={`max-w-sm lg:max-w-lg xl:max-w-2xl px-4 py-2 ${transcript.interaction_type === 'user_response'
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md'
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{transcript.transcript_text}</p>
                          <p className={`text-xs opacity-70 mt-2 ${transcript.interaction_type === 'user_response' ? 'text-right' : 'text-left'
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
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                          {message.role === 'bot' && (
                            <div className="flex-shrink-0">
                              <Image
                                src={getVoiceAvatar(selectedPhoneCall?.voice_name, 'phone')}
                                alt="AI"
                                className="h-8 w-8 rounded-full object-cover"
                                width={32}
                                height={32}
                                loading="lazy"
                                sizes="32px"
                              />
                            </div>
                          )}

                          <div
                            className={`max-w-sm lg:max-w-lg xl:max-w-2xl px-4 py-2 ${message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md'
                              }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                            <p className={`text-xs opacity-70 mt-2 ${message.role === 'user' ? 'text-right' : 'text-left'
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
                          className={`flex gap-3 ${flow.interactionType === 'user_response' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                          {flow.interactionType === 'ai_response' && (
                            <div className="flex-shrink-0">
                              <Image
                                src={getVoiceAvatar(selectedPhoneCall?.voice_name, 'phone')}
                                alt="AI"
                                className="h-8 w-8 rounded-full object-cover"
                                width={32}
                                height={32}
                                loading="lazy"
                                sizes="32px"
                              />
                            </div>
                          )}

                          <div
                            className={`max-w-sm lg:max-w-lg xl:max-w-2xl px-4 py-2 ${flow.interactionType === 'user_response'
                              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md'
                              }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{flow.transcriptText}</p>
                            <p className={`text-xs opacity-70 mt-2 ${flow.interactionType === 'user_response' ? 'text-right' : 'text-left'
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

                {(selectedScore || selectedPhoneCall?.analysis_summary) ? (
                  <div className="space-y-6">
                    {/* First Row - Overall Score and Recommendations */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <TranscriptReport
                          score={(selectedScore?.overall_score ?? selectedPhoneCall?.interview_score) || 0}
                        />
                      </div>
                      <div>
                        <AnalysisCard
                          title="Recommendations"
                          items={selectedScore?.improvements ?? selectedPhoneCall?.recommendations ?? []}
                          icon={<ChevronRight className="h-5 w-5" />}
                          colorClassName="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                    </div>

                    {/* Second Row - Strengths and Areas for Improvement */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <AnalysisCard
                        title="Strengths"
                        items={selectedScore?.strengths ?? selectedPhoneCall?.strengths ?? []}
                        icon={<TrendingUp className="h-5 w-5" />}
                        colorClassName="text-green-600 dark:text-green-400"
                      />

                      <AnalysisCard
                        title="Areas for Improvement"
                        items={selectedScore?.weaknesses ?? selectedPhoneCall?.weaknesses ?? []}
                        icon={<ChevronRight className="h-5 w-5" />}
                        colorClassName="text-amber-600 dark:text-amber-400"
                      />
                    </div>

                    {/* Detailed Feedback - Full Width */}
                    <div className="w-full">
                      <DetailedFeedbackCard
                        title="Detailed Feedback"
                        feedback={selectedScore?.detailed_feedback ?? selectedPhoneCall?.analysis_summary ?? ''}
                        icon={<Eye className="h-5 w-5" />}
                      />
                    </div>
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