'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VoiceOption } from '@/types/voice.types';
import {
  getAllSessions,
  getSession,
  deleteSession as deleteLocalSession,
  type VoiceSession as StoredVoiceSession
} from '@/utils/transcript-storage';

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
  session_type: 'behavioral' | 'technical' | 'custom' | 'sd';
  interview_mode: 'web' | 'phone';
  session_start?: string | undefined;
  session_end?: string | null | undefined;
  call_duration?: number | undefined;
  interview_scores?: any[] | undefined;
  voice_name?: string | undefined;
}

function convertStoredSession(stored: StoredVoiceSession): InterviewSession {
  return {
    id: stored.id,
    session_type: stored.sessionType,
    session_start: stored.startedAt,
    session_end: stored.endedAt || null,
    question_count: stored.messages.filter(m => m.type === 'ai').length,
    week_identifier: new Date(stored.startedAt).toISOString().split('T')[0] ?? '',
    is_completed: stored.isCompleted,
    transcripts: stored.messages.map((msg, idx) => ({
      id: `${stored.id}-${idx}`,
      transcript_text: msg.text,
      interaction_type: msg.type === 'ai' ? 'ai_response' as const : 'user_response' as const,
      created_at: new Date(msg.timestamp).toISOString(),
      conversation_order: idx,
    })),
    interview_scores: stored.score ? [{
      overall_score: stored.score.overall_score,
      created_at: stored.endedAt || stored.startedAt
    }] : undefined,
    interview_mode: 'web',
    voice_name: stored.voiceName || 'Default Voice'
  };
}

export function useInterviewData() {
  const { user } = useAuth();
  const router = useRouter();

  const routerRef = useRef(router);
  routerRef.current = router;

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [voiceFilter, setVoiceFilter] = useState<VoiceOption | 'all'>('all');

  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [selectedScore, setSelectedScore] = useState<InterviewScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [activeTab, setActiveTab] = useState('transcript');
  const [isExporting, setIsExporting] = useState(false);

  const hasFetchedDataRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch sessions from localStorage
      const storedSessions = getAllSessions();
      const webSessions = storedSessions.map(convertStoredSession);
      setSessions(webSessions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch interview data');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessionsRef = useRef(fetchSessions);
  fetchSessionsRef.current = fetchSessions;

  useEffect(() => {
    if (!user) {
      routerRef.current.push('/signin');
      return;
    }

    if (!hasFetchedDataRef.current) {
      hasFetchedDataRef.current = true;
      fetchSessionsRef.current();
    }
  }, [user]);

  const fetchScore = useCallback(async (sessionId: string) => {
    try {
      setLoadingScore(true);
      const storedSession = getSession(sessionId);

      if (storedSession?.score) {
        setSelectedScore({
          overall_score: storedSession.score.overall_score,
          strengths: storedSession.score.strengths,
          weaknesses: storedSession.score.weaknesses,
          improvements: storedSession.score.improvements,
          detailed_feedback: storedSession.score.detailed_feedback || '',
          created_at: storedSession.endedAt || storedSession.startedAt
        });
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
      deleteLocalSession(sessionId);
      toast.success('Interview session deleted successfully');
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setSelectedScore(null);
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

  const allInterviews = useMemo(() => {
    return sessions.map(session => ({
      ...session,
      type: 'web' as const,
      date: session.session_start,
      status: session.is_completed ? 'completed' : 'incomplete',
      interview_mode: (session.interview_mode || 'web') as 'web' | 'phone',
      voice_name: session.voice_name
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  const filteredInterviews = useMemo(() => {
    return allInterviews.filter(interview => {
      const matchesVoiceFilter = voiceFilter === 'all' ||
        (interview.voice_name && interview.voice_name === voiceFilter);

      return matchesVoiceFilter;
    });
  }, [allInterviews, voiceFilter]);

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
    const originalSession = sessions.find(session => session.id === interview.id);
    if (originalSession) {
      setSelectedSession(originalSession);
      fetchScore(interview.id);
    }
  }, [fetchScore, sessions]);

  const refreshData = useCallback(async () => {
    hasFetchedDataRef.current = false;
    await fetchSessionsRef.current();
    hasFetchedDataRef.current = true;
  }, []);

  return {
    // Data
    sessions,
    phoneCalls: [],
    allInterviews,
    filteredInterviews,
    groupedInterviews,

    // State
    loading,
    voiceFilter,
    selectedSession,
    selectedPhoneCall: null,
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
    exportPhoneTranscript: () => { },
    fetchSessions,
    refreshData
  };
}