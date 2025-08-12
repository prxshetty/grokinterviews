'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VoiceOption } from '@/types/voice.types';

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

export function useInterviewData() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Use ref to store router to avoid dependency issues
  const routerRef = useRef(router);
  routerRef.current = router;
  
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [phoneCalls, setPhoneCalls] = useState<PhoneCall[]>([]);
  const [loading, setLoading] = useState(true);

  const [voiceFilter, setVoiceFilter] = useState<VoiceOption | 'all'>('all');
  
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [selectedPhoneCall, setSelectedPhoneCall] = useState<PhoneCall | null>(null);
  const [selectedScore, setSelectedScore] = useState<InterviewScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [activeTab, setActiveTab] = useState('transcript');
  const [isExporting, setIsExporting] = useState(false);

  // Track if we've already fetched data to prevent unnecessary re-fetching
  const hasFetchedDataRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch web interview sessions
      const sessionsResponse = await fetch('/api/voice/sessions');
      const sessionsData = await sessionsResponse.json();
      
      if (sessionsData.success) {
        const webSessions = (sessionsData.sessions || []).map((session: InterviewSession) => ({
          ...session,
          interview_mode: 'web' as const,
          voice_name: session.voice_name || 'Default Voice'
        }));
        setSessions(webSessions);
      } else {
        toast.error('Failed to fetch web interview sessions');
        setSessions([]);
      }

      // Fetch enhanced phone call transcript history
      const phoneResponse = await fetch(`/api/voice/transcripts?limit=50`);
      const phoneData = await phoneResponse.json();
      
      if (phoneResponse.ok && phoneData.success) {
        const enhancedPhoneCalls = phoneData.data.map((item: any) => ({
          id: item.id,
          user_id: user?.id,
          vapi_call_id: item.vapiCallId,
          phone_number: item.phoneNumber,
          call_status: item.callStatus,
          call_duration: item.callDuration || 0,
          audio_recording_url: item.audioRecordingUrl,
          transcript_text: item.transcriptText,
          analysis_summary: item.analysisSummary,
          interview_score: item.interviewScore,
          strengths: item.strengths,
          weaknesses: item.weaknesses,
          recommendations: item.recommendations,
          error_message: null,
          metadata: item.vapiData,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
          conversationFlow: item.conversationFlow,
          vapiData: item.vapiData
        }));
        setPhoneCalls(enhancedPhoneCalls);
      } else {
        console.error('Failed to fetch phone call transcripts:', phoneData.error);
        setPhoneCalls([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch interview data');
      setSessions([]);
      setPhoneCalls([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Store fetchSessions in a ref to access it in useEffect without dependency issues
  const fetchSessionsRef = useRef(fetchSessions);
  fetchSessionsRef.current = fetchSessions;

  useEffect(() => {
    if (!user) {
      routerRef.current.push('/signin');
      return;
    }
    
    // Only fetch data once, even if user object changes due to desktop switching
    if (!hasFetchedDataRef.current) {
      hasFetchedDataRef.current = true;
      fetchSessionsRef.current();
    }
  }, [user]); // Use ref pattern to avoid fetchSessions dependency

  const fetchScore = useCallback(async (sessionId: string) => {
    try {
      setLoadingScore(true);
      const response = await fetch(`/api/voice/score?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedScore(data.score);
      } else {
        setSelectedScore(null);
      }
    } catch (error) {
      console.error('Error fetching score:', error);
      setSelectedScore(null);
    } finally {
      setLoadingScore(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this interview session? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/voice/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Interview session deleted successfully');
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
          setSelectedScore(null);
        }
      } else {
        toast.error('Failed to delete interview session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete interview session');
    }
  }, [selectedSession?.id]);

  const exportSession = useCallback(async (session: InterviewSession) => {
    setIsExporting(true);
    try {
      const transcripts = session.transcripts
        .sort((a, b) => a.conversation_order - b.conversation_order)
        .map(t => `${t.interaction_type === 'ai_response' ? 'AI' : 'You'}: ${t.transcript_text}`)
        .join('\n\n');
      
      const content = `Interview Session - ${session.session_type}\nDate: ${new Date(session.session_start).toLocaleString()}\nDuration: ${session.session_end ? Math.floor((new Date(session.session_end).getTime() - new Date(session.session_start).getTime()) / 60000) + ' minutes' : 'Incomplete'}\n\n--- Transcript ---\n\n${transcripts}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-${session.session_type}-${new Date(session.session_start).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportPhoneTranscript = useCallback((phoneCall: PhoneCall) => {
    setIsExporting(true);
    try {
      const content = phoneCall.transcript_text || 'No transcript available';
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phone-interview-${new Date(phoneCall.created_at).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Create combined list of all interviews
  const allInterviews = useMemo(() => {
    return [
      ...sessions.map(session => ({
        ...session,
        type: 'web' as const,
        date: session.session_start,
        status: session.is_completed ? 'completed' : 'incomplete',
        interview_mode: (session.interview_mode || 'web') as 'web' | 'phone',
        voice_name: session.voice_name
      })),
      ...phoneCalls.map(call => ({
        ...call,
        type: 'phone' as const,
        date: call.created_at,
        status: call.call_status,
        session_type: 'behavioral' as const,
        interview_mode: 'phone' as const,
        voice_name: call.voice_name
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, phoneCalls]);

  // Filter interviews based on voice
  const filteredInterviews = useMemo(() => {
    return allInterviews.filter(interview => {
      const matchesVoiceFilter = voiceFilter === 'all' || 
        (interview.voice_name && interview.voice_name === voiceFilter);
      
      return matchesVoiceFilter;
    });
  }, [allInterviews, voiceFilter]);

  // Group interviews by date
  const groupedInterviews = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as CombinedInterview[],
      yesterday: [] as CombinedInterview[],
      last30Days: [] as CombinedInterview[],
      older: [] as CombinedInterview[]
    };

    filteredInterviews.forEach(interview => {
      const interviewDate = new Date(interview.date);
      const interviewDay = new Date(interviewDate.getFullYear(), interviewDate.getMonth(), interviewDate.getDate());

      if (interviewDay.getTime() === today.getTime()) {
        groups.today.push(interview);
      } else if (interviewDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(interview);
      } else if (interviewDate >= thirtyDaysAgo) {
        groups.last30Days.push(interview);
      } else {
        groups.older.push(interview);
      }
    });

    return groups;
  }, [filteredInterviews]);

  const handleSelectInterview = useCallback((interview: CombinedInterview) => {
    if (interview.type === 'web') {
      // Find the original session from the sessions array
      const originalSession = sessions.find(session => session.id === interview.id);
      if (originalSession) {
        setSelectedSession(originalSession);
        setSelectedPhoneCall(null);
        if (interview.status === 'completed') {
          fetchScore(interview.id);
        } else {
          setSelectedScore(null);
        }
      }
    } else {
      // Find the original phone call from the phoneCalls array
      const originalPhoneCall = phoneCalls.find(call => call.id === interview.id);
      if (originalPhoneCall) {
        setSelectedPhoneCall(originalPhoneCall);
        setSelectedSession(null);
        setSelectedScore(null);
      }
    }
  }, [fetchScore, sessions, phoneCalls]);

  // Manual refresh function that resets the fetch flag and re-fetches data
  const refreshData = useCallback(async () => {
    hasFetchedDataRef.current = false;
    await fetchSessionsRef.current();
    hasFetchedDataRef.current = true;
  }, []);

  return {
    // Data
    sessions,
    phoneCalls,
    allInterviews,
    filteredInterviews,
    groupedInterviews,
    
    // State
    loading,
    voiceFilter,
    selectedSession,
    selectedPhoneCall,
    selectedScore,
    loadingScore,
    activeTab,
    isExporting,
    
    // Actions
    setVoiceFilter,
    setActiveTab,
    handleSelectInterview,
    fetchScore,
    deleteSession,
    exportSession,
    exportPhoneTranscript,
    fetchSessions,
    refreshData
  };
}