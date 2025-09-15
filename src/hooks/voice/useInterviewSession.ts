import { useState, useCallback, useEffect } from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';

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
  createSession: (sessionType: string, voiceName?: string, config?: InterviewModeConfig) => Promise<string | null>;
  endSession: () => Promise<void>;
  addToHistory: (type: 'ai' | 'user', text: string) => void;
  updateCurrentQuestion: (question: string) => void;
  setInterviewReport: (report: any) => void;
  setSessionActive: (active: boolean) => void;
  setSessionCompleted: (completed: boolean) => void;
}

// Utility function to generate dynamic welcome messages (fallback)
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

// Async function to fetch personalized welcome message from API
const fetchWelcomeMessage = async (sessionType: string, config?: InterviewModeConfig, voice?: string): Promise<string> => {
  try {
    const params = new URLSearchParams({
      sessionType,
      ...(config && { config: encodeURIComponent(JSON.stringify(config)) }),
      ...(voice && { voice })
    });
    
    const response = await fetch(`/api/voice/conversation?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.welcomeMessage;
    }
    
    // Fallback to hardcoded message if API fails
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
    currentQuestion: "Loading welcome message...", // Initial loading state
    interviewReport: null,
  });

  // Initialize welcome message on mount
  useEffect(() => {
    fetchWelcomeMessage('behavioral', undefined, undefined).then(welcomeMessage => {
      setSession(prev => ({ ...prev, currentQuestion: welcomeMessage }));
    });
  }, []);

  const createSession = useCallback(async (sessionType: string, voiceName?: string, config?: InterviewModeConfig): Promise<string | null> => {
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
        
        // Fetch personalized welcome message
        const welcomeMessage = await fetchWelcomeMessage(sessionType, config, voiceName);
        
        // Store the welcome message in transcripts for conversation order 0
        try {
          await fetch('/api/voice/store-conversation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: newSessionId,
              transcriptText: welcomeMessage,
              interactionType: 'ai_response',
              conversationOrder: 0,
              sessionType,
              voiceName,
            }),
          })
        } catch (error) {
          console.error('Error storing welcome transcript:', error)
        }
        
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

    // Reset to default welcome message
    const welcomeMessage = await fetchWelcomeMessage('behavioral', undefined, undefined);
    
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