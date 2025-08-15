import Groq from 'groq-sdk';
import { 
  InterviewScore, 
  ConversationMessage, 
  InterviewMode, 
  InterviewModeConfig,
  INTERVIEW_CONSTANTS 
} from '../types';
import { FALLBACK_SCORE, ERROR_MESSAGES } from '../constants';
import { PromptService } from './promptService';

export class ScoringService {
  private groq: Groq;

  constructor(groq: Groq) {
    this.groq = groq;
  }

  async generateInterviewScore(
    conversationHistory: ConversationMessage[], 
    sessionType: InterviewMode = 'behavioral', 
    config: InterviewModeConfig | null = null
  ): Promise<InterviewScore> {
    const userResponses = this.extractUserResponses(conversationHistory);
    const scoringPrompt = PromptService.createScoringPrompt(
      sessionType, 
      config || undefined, 
      userResponses
    );

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: scoringPrompt }],
        model: INTERVIEW_CONSTANTS.GROQ_MODELS.SCORING,
        temperature: INTERVIEW_CONSTANTS.GROQ_SETTINGS.SCORING_TEMP,
        max_tokens: INTERVIEW_CONSTANTS.GROQ_SETTINGS.SCORING_MAX_TOKENS,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new Error(ERROR_MESSAGES.NO_SCORING_RESPONSE);
      }

      return this.parseScoreResponse(response);
    } catch (error) {
      console.error('Error generating interview score:', error);
      return this.createFallbackScore(error);
    }
  }

  private extractUserResponses(conversationHistory: ConversationMessage[]): string {
    return conversationHistory
      .filter(msg => msg.type === 'user')
      .map(msg => msg.text)
      .join('\n\n');
  }

  private parseScoreResponse(response: string): InterviewScore {
    try {
      const parsed = JSON.parse(response);
      return this.validateScore(parsed);
    } catch (parseError) {
      console.warn('Failed to parse scoring response as JSON, using fallback:', parseError);
      return {
        ...FALLBACK_SCORE,
        detailed_feedback: response
      };
    }
  }

  private validateScore(score: any): InterviewScore {
    // Validate the score structure and provide defaults for missing fields
    return {
      overall_score: this.validateOverallScore(score.overall_score),
      strengths: this.validateStringArray(score.strengths, FALLBACK_SCORE.strengths),
      weaknesses: this.validateStringArray(score.weaknesses, FALLBACK_SCORE.weaknesses),
      improvements: this.validateStringArray(score.improvements, FALLBACK_SCORE.improvements),
      detailed_feedback: this.validateString(score.detailed_feedback, FALLBACK_SCORE.detailed_feedback)
    };
  }

  private validateOverallScore(score: any): number {
    if (typeof score === 'number' && score >= 1 && score <= 10) {
      return score;
    }
    return FALLBACK_SCORE.overall_score;
  }

  private validateStringArray(arr: any, fallback: string[]): string[] {
    if (Array.isArray(arr) && arr.every(item => typeof item === 'string')) {
      return arr;
    }
    return fallback;
  }

  private validateString(str: any, fallback: string): string {
    if (typeof str === 'string' && str.trim().length > 0) {
      return str;
    }
    return fallback;
  }

  private createFallbackScore(error: any): InterviewScore {
    return {
      ...FALLBACK_SCORE,
      detailed_feedback: `${FALLBACK_SCORE.detailed_feedback} Error: ${error?.message || 'Unknown error'}`
    };
  }
}