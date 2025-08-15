export type InterviewMode = 'behavioral' | 'sd' | 'technical' | 'custom';

export interface ConversationMessage {
  type: 'ai' | 'user';
  text: string;
  timestamp?: number;
}

export interface InterviewModeConfig {
  systemType?: string;
  scale?: string;
  constraints?: string[];
  programmingLanguage?: string;
  focusAreas?: string[];
  difficulty?: string;
  customTopics?: string;
  questionFormat?: string;
}

export interface InterviewScore {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  detailed_feedback: string;
}

export interface QuestionProgress {
  current: number;
  total: number;
  isComplete: boolean;
}

export interface ConversationRequest {
  userResponse: string;
  conversationHistory: ConversationMessage[];
  sessionId: string | null;
  sessionType: InterviewMode;
  config?: InterviewModeConfig;
  checkRateLimit?: boolean;
  voiceId?: string;
  voiceName?: string;
}

export interface ConversationResponse {
  success: boolean;
  aiResponse?: string;
  conversationContinues?: boolean;
  sessionId?: string;
  questionProgress?: QuestionProgress;
  interviewComplete?: boolean;
  interviewReport?: InterviewScore;
  message?: string;
  rateLimited?: boolean;
  remainingAttempts?: number;
  error?: string;
}

export interface RateLimitResult {
  isAllowed: boolean;
  message?: string;
  remainingAttempts?: number;
}

export interface SessionData {
  user_id: string;
  session_type: InterviewMode;
  session_start: string;
  session_end?: string;
  total_interactions: number;
  week_identifier: string;
  question_count: number;
  is_completed: boolean;
  voice_name?: string;
}

export interface TranscriptData {
  user_id: string;
  session_id: string;
  transcript_text: string;
  interaction_type: 'user_response' | 'ai_response';
  conversation_order: number;
  voice_name?: string;
}

export interface ScoreData {
  session_id: string;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  detailed_feedback: string;
}

export interface PromptContext {
  sessionType: InterviewMode;
  config?: InterviewModeConfig;
  conversationContext: string;
  userResponse: string;
  currentQuestionCount: number;
  isLastQuestion: boolean;
}

export interface GroqConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

export const INTERVIEW_CONSTANTS = {
  MAX_QUESTIONS: 5,
  FINAL_QUESTION_THRESHOLD: 3,
  GROQ_MODELS: {
    CONVERSATION: 'llama-3.1-8b-instant',
    SCORING: 'llama-3.1-8b-instant'
  },
  GROQ_SETTINGS: {
    CONVERSATION_TEMP: 0.7,
    SCORING_TEMP: 0.3,
    CONVERSATION_MAX_TOKENS: 200,
    SCORING_MAX_TOKENS: 800
  }
} as const;