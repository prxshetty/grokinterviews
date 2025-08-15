import { SupabaseClient } from '@supabase/supabase-js';
import { 
  SessionData, 
  TranscriptData, 
  ScoreData, 
  InterviewScore, 
  InterviewMode 
} from '../types';
import { LOG_MESSAGES } from '../constants';

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async createSession(
    userId: string,
    sessionType: InterviewMode,
    voiceName?: string,
    weekIdentifier?: string
  ): Promise<string | null> {
    try {
      const sessionData: Partial<SessionData> = {
        user_id: userId,
        session_type: sessionType,
        session_start: new Date().toISOString(),
        total_interactions: 0,
        week_identifier: weekIdentifier || this.getCurrentWeekIdentifier(),
        question_count: 0,
        is_completed: false
      };

      // Only include voice_name if it has a valid value
      if (voiceName) {
        sessionData.voice_name = voiceName;
      }

      const { data, error } = await this.supabase
        .from('interview_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) {
        console.error(LOG_MESSAGES.SESSION_CREATION_ERROR, error);
        return null;
      }

      console.log(LOG_MESSAGES.NEW_SESSION_CREATED, data.id);
      return data.id;
    } catch (error) {
      console.error(LOG_MESSAGES.SESSION_CREATION_ERROR, error);
      return null;
    }
  }

  async storeConversationPair(
    userId: string,
    sessionId: string,
    userResponse: string,
    aiResponse: string,
    conversationOrder: number,
    voiceName?: string
  ): Promise<void> {
    try {
      const userTranscript: TranscriptData = {
        user_id: userId,
        session_id: sessionId,
        transcript_text: userResponse,
        interaction_type: 'user_response',
        conversation_order: conversationOrder
      };

      const aiTranscript: TranscriptData = {
        user_id: userId,
        session_id: sessionId,
        transcript_text: aiResponse,
        interaction_type: 'ai_response',
        conversation_order: conversationOrder + 1
      };

      // Only include voice_name if it has a valid value
      if (voiceName) {
        userTranscript.voice_name = voiceName;
        aiTranscript.voice_name = voiceName;
      }

      // Store both transcripts
      await Promise.all([
        this.supabase.from('voice_transcripts').insert(userTranscript),
        this.supabase.from('voice_transcripts').insert(aiTranscript)
      ]);

      console.log(LOG_MESSAGES.CONVERSATION_STORED);
    } catch (error) {
      console.error(LOG_MESSAGES.CONVERSATION_STORAGE_FAILED, error);
      throw error;
    }
  }

  async updateSessionProgress(
    sessionId: string,
    questionCount: number
  ): Promise<void> {
    try {
      await this.supabase
        .from('interview_sessions')
        .update({
          session_end: new Date().toISOString(),
          question_count: questionCount
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to update session progress:', error);
      throw error;
    }
  }

  async completeSession(
    sessionId: string,
    finalQuestionCount: number
  ): Promise<void> {
    try {
      await this.supabase
        .from('interview_sessions')
        .update({
          session_end: new Date().toISOString(),
          question_count: finalQuestionCount,
          is_completed: true
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }

  async storeInterviewScore(
    sessionId: string,
    score: InterviewScore
  ): Promise<void> {
    try {
      const scoreData: ScoreData = {
        session_id: sessionId,
        overall_score: score.overall_score,
        strengths: score.strengths,
        weaknesses: score.weaknesses,
        improvements: score.improvements,
        detailed_feedback: score.detailed_feedback
      };

      await this.supabase
        .from('interview_scores')
        .insert(scoreData);

      console.log(LOG_MESSAGES.SCORE_GENERATED);
    } catch (error) {
      console.error(LOG_MESSAGES.SCORE_GENERATION_FAILED, error);
      throw error;
    }
  }

  async storeCompleteInterview(
    userId: string,
    sessionId: string | null,
    sessionType: InterviewMode,
    userResponse: string,
    aiResponse: string,
    conversationOrder: number,
    score: InterviewScore | null,
    voiceName?: string
  ): Promise<string | null> {
    try {
      let currentSessionId = sessionId;

      // Create session if it doesn't exist
      if (!currentSessionId) {
        currentSessionId = await this.createSession(
          userId,
          sessionType,
          voiceName
        );
        if (!currentSessionId) {
          throw new Error('Failed to create session');
        }
      }

      // Store conversation pair
      await this.storeConversationPair(
        userId,
        currentSessionId,
        userResponse,
        aiResponse,
        conversationOrder,
        voiceName
      );

      // Complete the session
      await this.completeSession(currentSessionId, 5);

      // Store score if available
      if (score) {
        await this.storeInterviewScore(currentSessionId, score);
      }

      return currentSessionId;
    } catch (error) {
      console.error(LOG_MESSAGES.FINAL_CONVERSATION_STORAGE_FAILED, error);
      return sessionId; // Return original sessionId even if operations fail
    }
  }

  async storeOngoingConversation(
    userId: string,
    sessionId: string | null,
    sessionType: InterviewMode,
    userResponse: string,
    aiResponse: string,
    conversationOrder: number,
    questionCount: number,
    voiceName?: string
  ): Promise<string | null> {
    try {
      let currentSessionId = sessionId;

      // Create session if it doesn't exist
      if (!currentSessionId) {
        currentSessionId = await this.createSession(
          userId,
          sessionType,
          voiceName
        );
        if (!currentSessionId) {
          throw new Error('Failed to create session');
        }
      }

      // Store conversation pair
      await this.storeConversationPair(
        userId,
        currentSessionId,
        userResponse,
        aiResponse,
        conversationOrder,
        voiceName
      );

      // Update session progress
      await this.updateSessionProgress(currentSessionId, questionCount);

      return currentSessionId;
    } catch (error) {
      console.error(LOG_MESSAGES.CONVERSATION_STORAGE_FAILED, error);
      return sessionId; // Return original sessionId even if storage fails
    }
  }

  private getCurrentWeekIdentifier(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
  }
}