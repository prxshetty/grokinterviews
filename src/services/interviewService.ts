import {
  createSession as createLocalSession,
  addMessage,
  getSession,
  completeSession,
  type VoiceSession
} from '@/utils/transcript-storage';

export interface TerminationReason {
  type: 'rate_limit' | 'microphone_error' | 'network_error' | 'user_abort' | 'system_error';
  message: string;
  details?: string;
}

export interface ConversationMessage {
  type: 'ai' | 'user';
  text: string;
}

export interface AIResponseResult {
  success: boolean;
  aiResponse?: string;
  sessionId?: string;
  interviewReport?: any;
}

export class InterviewService {
  static createSession(sessionType: string, voiceName?: string): { session: VoiceSession } {
    const validSessionType = sessionType as 'behavioral' | 'technical' | 'custom' | 'sd';
    const session = createLocalSession(validSessionType, voiceName);
    return { session };
  }

  static addInitialWelcomeMessage(sessionId: string, welcomeText: string): void {
    addMessage(sessionId, { type: 'ai', text: welcomeText, timestamp: Date.now() });
  }

  static async generateAIResponse(
    userText: string,
    conversationHistory: ConversationMessage[],
    sessionId: string | null,
    sessionType: string = 'behavioral',
    config?: any
  ): Promise<AIResponseResult> {
    const response = await fetch('/api/voice/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userResponse: userText,
        conversationHistory,
        sessionId,
        sessionType,
        config
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to generate AI response';

      if (response.status === 429 ||
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('quota')) {
        throw new Error(`RATE_LIMIT: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.success || !result.aiResponse) {
      throw new Error('No AI response received');
    }

    return result;
  }

  static terminateInterview(
    sessionId: string,
    _reason: TerminationReason,
    _conversationHistory: ConversationMessage[]
  ): void {
    completeSession(sessionId);
    console.log('✅ Interview terminated successfully in localStorage');
  }

  static fetchSessionTranscripts(sessionId: string): any[] {
    const session = getSession(sessionId);
    if (!session) {
      return [];
    }

    return session.messages.map((msg, index) => ({
      transcript_text: msg.text,
      interaction_type: msg.type === 'ai' ? 'ai_response' : 'user_response',
      conversation_order: index,
      created_at: new Date(msg.timestamp).toISOString()
    }));
  }
}