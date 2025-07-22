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
  static async createSession(sessionType: string) {
    const response = await fetch('/api/voice/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionType }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    
    return response.json();
  }

  static async addInitialWelcomeMessage(sessionId: string, welcomeText: string) {
    try {
      const response = await fetch('/api/voice/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          transcriptText: welcomeText,
          interactionType: 'ai_response',
          conversationOrder: 0
        }),
      });
      
      if (!response.ok) {
        console.warn('Failed to add initial welcome message to transcripts');
      }
    } catch (error) {
      console.error('Error adding initial welcome message:', error);
    }
  }

  static async generateAIResponse(
    userText: string, 
    conversationHistory: ConversationMessage[], 
    sessionId: string | null,
    sessionType: string = 'behavioral'
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
        sessionType
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to generate AI response';
      
      // Check for rate limit errors
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

  static async terminateInterview(
    sessionId: string,
    reason: TerminationReason,
    conversationHistory: ConversationMessage[]
  ) {
    try {
      const response = await fetch('/api/voice/terminate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          reason,
          conversationHistory
        }),
      });

      if (response.ok) {
        console.log('✅ Interview terminated successfully in database');
      } else {
        console.error('❌ Failed to terminate interview in database');
      }
    } catch (error) {
      console.error('❌ Error calling termination API:', error);
    }
  }

  static async fetchSessionTranscripts(sessionId: string) {
    const response = await fetch(`/api/voice/sessions?sessionId=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch session transcripts');
    }
    
    const data = await response.json();
    const sessionTranscripts = data.transcripts || [];
    
    // Sort by conversation_order or created_at ascending (chronological order)
    sessionTranscripts.sort((a: any, b: any) => {
      if (a.conversation_order && b.conversation_order) {
        return a.conversation_order - b.conversation_order;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    return sessionTranscripts;
  }
}