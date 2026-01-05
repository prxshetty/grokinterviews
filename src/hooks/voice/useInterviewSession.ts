import { useState, useCallback } from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';
import { type AIConfig } from '@/utils/ai-config-storage';
import { createSession as createLocalSession, addMessage, completeSession } from '@/utils/transcript-storage';

export interface InterviewSession {
  id: string | null;
  isActive: boolean;
  isCompleted: boolean;
  conversationHistory: Array<{ type: 'ai' | 'user', text: string }>;
  currentQuestion: string;
  interviewReport: any | null;
}

export interface UseInterviewSessionReturn {
  session: InterviewSession;
  createSession: (sessionType: string, voiceName?: string, config?: InterviewModeConfig, aiConfig?: AIConfig | null) => Promise<string | null>;
  endSession: (aiConfig?: AIConfig | null) => Promise<void>;
  addToHistory: (type: 'ai' | 'user', text: string) => void;
  updateCurrentQuestion: (question: string) => void;
  setInterviewReport: (report: any) => void;
  setSessionActive: (active: boolean) => void;
  setSessionCompleted: (completed: boolean) => void;
}

const generateWelcomeMessage = (sessionType: string, config?: InterviewModeConfig): string => {
  const baseGreeting = "Welcome to your";

  switch (sessionType) {
    case 'behavioral':
      return `${baseGreeting} behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background.`;

    case 'sd':
      const systemType = config?.systemType || 'scalable system';
      const scale = config?.scale || 'significant scale';
      return `${baseGreeting} system design interview! Today we'll design a ${systemType} that handles ${scale}. Let's start by discussing your experience with system architecture and distributed systems.`;

    case 'technical':
      const language = config?.programmingLanguage || 'programming';
      const focusArea = config?.focusAreas?.[0] || 'problem-solving';
      return `${baseGreeting} technical interview focusing on ${language} and ${focusArea}! I'll present coding challenges and technical problems. Let's begin: Tell me about your experience with ${language} and your approach to problem-solving.`;

    case 'custom':
      const topics = config?.customTopics || 'specialized topics';
      return `${baseGreeting} custom interview session! We'll be focusing on ${topics}. Let's start by discussing your background and experience in these areas.`;

    default:
      return `${baseGreeting} interview practice session! I'll ask you questions to help you prepare. Let's start with: Tell me about yourself and your background.`;
  }
};

const fetchWelcomeMessage = async (sessionType: string, config?: InterviewModeConfig, voice?: string, aiConfig?: AIConfig | null): Promise<string> => {
  try {
    if (!aiConfig?.apiKey) {
      console.warn('No API key provided for welcome message, using fallback');
      return generateWelcomeMessage(sessionType, config);
    }

    const response = await fetch('/api/voice/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'welcome',
        sessionType,
        config,
        voiceName: voice,
        apiKey: aiConfig.apiKey,
        provider: aiConfig.provider,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.welcomeMessage;
    }

    console.warn('Failed to fetch welcome message, using fallback:', response.status);
    return generateWelcomeMessage(sessionType, config);

  } catch (error) {
    console.error('Error fetching welcome message:', error);
    return generateWelcomeMessage(sessionType, config);
  }
};

export const useInterviewSession = (): UseInterviewSessionReturn => {
  const [session, setSession] = useState<InterviewSession>({
    id: null,
    isActive: false,
    isCompleted: false,
    conversationHistory: [],
    currentQuestion: "Welcome! Please start your interview session.",
    interviewReport: null,
  });

  const createSession = useCallback(async (sessionType: string, voiceName?: string, config?: InterviewModeConfig, aiConfig?: AIConfig | null): Promise<string | null> => {
    try {
      const validSessionType = sessionType as 'behavioral' | 'technical' | 'custom' | 'sd';
      const localSession = createLocalSession(validSessionType, voiceName);
      const newSessionId = localSession.id;
      const welcomeMessage = await fetchWelcomeMessage(sessionType, config, voiceName, aiConfig);
      addMessage(newSessionId, { type: 'ai', text: welcomeMessage, timestamp: Date.now() });

      setSession(prev => ({
        ...prev,
        id: newSessionId,
        isActive: true,
        isCompleted: false,
        conversationHistory: [],
        currentQuestion: welcomeMessage,
        interviewReport: null,
      }));

      return newSessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }, []);

  const endSession = useCallback(async (aiConfig?: AIConfig | null) => {
    if (session.id) {
      completeSession(session.id);
    }
    const welcomeMessage = await fetchWelcomeMessage('behavioral', undefined, undefined, aiConfig);

    setSession(prev => ({
      ...prev,
      id: null,
      isActive: false,
      isCompleted: false,
      conversationHistory: [],
      interviewReport: null,
      currentQuestion: welcomeMessage,
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