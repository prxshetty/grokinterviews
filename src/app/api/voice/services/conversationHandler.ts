import Groq from 'groq-sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  ConversationRequest,
  ConversationResponse,
  ConversationMessage,
  PromptContext,
  INTERVIEW_CONSTANTS 
} from '../types';
import { 
  CLOSING_MESSAGE, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  LOG_MESSAGES 
} from '../constants';
import { PromptService } from './promptService';
import { ScoringService } from './scoringService';
import { DatabaseService } from './databaseService';

export class ConversationHandler {
  private groq: Groq;
  private scoringService: ScoringService;
  private databaseService: DatabaseService;

  constructor(groq: Groq, supabase: SupabaseClient) {
    this.groq = groq;
    this.scoringService = new ScoringService(groq);
    this.databaseService = new DatabaseService(supabase);
  }

  async handleConversation(
    request: ConversationRequest,
    userId: string
  ): Promise<ConversationResponse> {
    const {
      userResponse,
      conversationHistory,
      sessionId,
      sessionType,
      config,
      voiceName
    } = request;

    console.log(LOG_MESSAGES.PROCESSING_AI_RESPONSE, {
      userResponse: userResponse.substring(0, 100) + '...',
      historyLength: conversationHistory.length,
    });

    const currentQuestionCount = this.countUserQuestions(conversationHistory);

    // Check if interview should be completed
    if (currentQuestionCount >= INTERVIEW_CONSTANTS.FINAL_QUESTION_THRESHOLD + 1) {
      return await this.completeInterview(
        userId,
        sessionId,
        sessionType,
        userResponse,
        conversationHistory,
        config,
        voiceName
      );
    }

    // Continue with normal interview flow
    return await this.continueInterview(
      userId,
      sessionId,
      sessionType,
      userResponse,
      conversationHistory,
      config,
      voiceName,
      currentQuestionCount
    );
  }

  private async completeInterview(
    userId: string,
    sessionId: string | null,
    sessionType: string,
    userResponse: string,
    conversationHistory: ConversationMessage[],
    config: any,
    voiceName?: string
  ): Promise<ConversationResponse> {
    let interviewScore = null;
    
    try {
      // Generate score synchronously for immediate response
      const updatedHistory = [...conversationHistory, 
        { type: 'user' as const, text: userResponse }
      ];
      
      interviewScore = await this.scoringService.generateInterviewScore(
        updatedHistory, 
        sessionType as any, 
        config
      );
    } catch (error) {
      console.error(LOG_MESSAGES.SCORE_GENERATION_FAILED, error);
    }

    // Store final conversation data
    const finalSessionId = await this.databaseService.storeCompleteInterview(
      userId,
      sessionId,
      sessionType as any,
      userResponse,
      CLOSING_MESSAGE,
      conversationHistory.length,
      interviewScore,
      voiceName
    );

    const response: ConversationResponse = {
      success: true,
      aiResponse: CLOSING_MESSAGE,
      conversationContinues: false,
      questionProgress: {
        current: INTERVIEW_CONSTANTS.MAX_QUESTIONS,
        total: INTERVIEW_CONSTANTS.MAX_QUESTIONS,
        isComplete: true
      },
      interviewComplete: true,
      message: interviewScore 
        ? SUCCESS_MESSAGES.INTERVIEW_COMPLETED_WITH_REPORT 
        : SUCCESS_MESSAGES.INTERVIEW_COMPLETED_PENDING_SCORE
    };

    // Only include sessionId if it has a valid value
    const validSessionId = finalSessionId || sessionId;
    if (validSessionId) {
      response.sessionId = validSessionId;
    }

    // Only include interviewReport if it has a valid value
    if (interviewScore) {
      response.interviewReport = interviewScore;
    }

    return response;
  }

  private async continueInterview(
    userId: string,
    sessionId: string | null,
    sessionType: string,
    userResponse: string,
    conversationHistory: ConversationMessage[],
    config: any,
    voiceName: string | undefined,
    currentQuestionCount: number
  ): Promise<ConversationResponse> {
    const isLastQuestion = currentQuestionCount >= INTERVIEW_CONSTANTS.FINAL_QUESTION_THRESHOLD;

    // Generate AI response
    const aiResponse = await this.generateAIResponse(
      sessionType,
      config,
      conversationHistory,
      userResponse,
      currentQuestionCount,
      isLastQuestion
    );

    // Store conversation data
    const updatedSessionId = await this.databaseService.storeOngoingConversation(
      userId,
      sessionId,
      sessionType as any,
      userResponse,
      aiResponse,
      conversationHistory.length,
      currentQuestionCount + 1,
      voiceName
    );

    const response: ConversationResponse = {
      success: true,
      aiResponse: aiResponse,
      conversationContinues: true,
      questionProgress: {
        current: currentQuestionCount + 1,
        total: INTERVIEW_CONSTANTS.MAX_QUESTIONS,
        isComplete: false
      }
    };

    // Only include sessionId if it has a valid value
    const validSessionId = updatedSessionId || sessionId;
    if (validSessionId) {
      response.sessionId = validSessionId;
    }

    return response;
  }

  private async generateAIResponse(
    sessionType: string,
    config: any,
    conversationHistory: ConversationMessage[],
    userResponse: string,
    currentQuestionCount: number,
    isLastQuestion: boolean
  ): Promise<string> {
    const conversationContext = this.buildConversationContext(conversationHistory);
    
    const promptContext: PromptContext = {
      sessionType: sessionType as any,
      config,
      conversationContext,
      userResponse,
      currentQuestionCount,
      isLastQuestion
    };

    const systemPrompt = PromptService.createSystemPrompt(promptContext);

    const chatCompletion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Please provide your next interview question or follow-up based on the candidate's response: "${userResponse}"`,
        },
      ],
      model: INTERVIEW_CONSTANTS.GROQ_MODELS.CONVERSATION,
      temperature: INTERVIEW_CONSTANTS.GROQ_SETTINGS.CONVERSATION_TEMP,
      max_tokens: INTERVIEW_CONSTANTS.GROQ_SETTINGS.CONVERSATION_MAX_TOKENS,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error(ERROR_MESSAGES.AI_GENERATION_FAILED);
    }

    console.log(LOG_MESSAGES.AI_RESPONSE_GENERATED, {
      responseLength: aiResponse.length,
      preview: aiResponse.substring(0, 100) + '...',
    });

    return aiResponse;
  }

  private buildConversationContext(conversationHistory: ConversationMessage[]): string {
    return conversationHistory
      .map((msg: ConversationMessage) => 
        `${msg.type === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.text}`
      )
      .join('\n');
  }

  private countUserQuestions(conversationHistory: ConversationMessage[]): number {
    return conversationHistory.filter((msg: ConversationMessage) => msg.type === 'user').length;
  }
}