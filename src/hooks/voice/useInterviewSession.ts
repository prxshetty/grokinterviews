import { useState, useCallback } from 'react';

export interface InterviewSession {
  id: string | null;
  isActive: boolean;
  isCompleted: boolean;
  conversationHistory: Array<{type: 'ai' | 'user', text: string}>;
  currentQuestion: string;
  interviewReport: any | null;
}

export interface UseInterviewSessionReturn {
  session: InterviewSession;
  createSession: (sessionType: string, voiceName?: string) => Promise<string | null>;
  endSession: () => Promise<void>;
  addToHistory: (type: 'ai' | 'user', text: string) => void;
  updateCurrentQuestion: (question: string) => void;
  setInterviewReport: (report: any) => void;
  setSessionActive: (active: boolean) => void;
  setSessionCompleted: (completed: boolean) => void;
}

export const useInterviewSession = (): UseInterviewSessionReturn => {
  const [session, setSession] = useState<InterviewSession>({
    id: null,
    isActive: false,
    isCompleted: false,
    conversationHistory: [],
    currentQuestion: "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background.",
    interviewReport: null,
  });

  const createSession = useCallback(async (sessionType: string, voiceName?: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/voice/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionType, voiceName }),
      });
      
      if (response.ok) {
        const result = await response.json();
        const newSessionId = result.session.id;
        
        setSession(prev => ({
          ...prev,
          id: newSessionId,
          isActive: true,
          conversationHistory: [],
        }));
        
        return newSessionId;
      }
      return null;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }, []);

  const endSession = useCallback(async () => {
    // Mark session as completed in database if there's an active session
    if (session.id) {
      try {
        await fetch('/api/voice/sessions/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: session.id }),
        });
      } catch (error) {
        console.error('Error marking session as completed:', error);
        // Continue with local state reset even if API call fails
      }
    }

    setSession(prev => ({
      ...prev,
      id: null,
      isActive: false,
      isCompleted: false,
      conversationHistory: [],
      interviewReport: null,
      currentQuestion: "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background.",
    }));
  }, [session.id]);

  const addToHistory = useCallback((type: 'ai' | 'user', text: string) => {
    setSession(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, { type, text }],
    }));
  }, []);

  const updateCurrentQuestion = useCallback((question: string) => {
    setSession(prev => ({
      ...prev,
      currentQuestion: question,
    }));
  }, []);

  const setInterviewReport = useCallback((report: any) => {
    setSession(prev => ({
      ...prev,
      interviewReport: report,
    }));
  }, []);

  const setSessionActive = useCallback((active: boolean) => {
    setSession(prev => ({
      ...prev,
      isActive: active,
    }));
  }, []);

  const setSessionCompleted = useCallback((completed: boolean) => {
    setSession(prev => ({
      ...prev,
      isCompleted: completed,
    }));
  }, []);

  return {
    session,
    createSession,
    endSession,
    addToHistory,
    updateCurrentQuestion,
    setInterviewReport,
    setSessionActive,
    setSessionCompleted,
  };
};