export const CLOSING_MESSAGE = `Thank you for completing your interview! This concludes our session. You've answered all 5 questions, and we'll now evaluate your responses. You should receive your detailed feedback and score shortly. We appreciate your time and thoughtful answers.`;

export const FALLBACK_SCORE = {
  overall_score: 7,
  strengths: ['Provided detailed responses', 'Showed enthusiasm'],
  weaknesses: ['Could improve structure', 'Needs more specific examples'],
  improvements: ['Use structured approach', 'Provide quantifiable results', 'Practice storytelling'],
  detailed_feedback: 'Unable to generate detailed feedback. Please try again.'
};

export const ERROR_MESSAGES = {
  NO_USER_RESPONSE: 'No user response provided',
  AUTH_REQUIRED: 'Authentication required',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  AI_GENERATION_FAILED: 'No response generated from AI',
  AI_INTERVIEW_FAILED: 'AI interview response failed',
  INTERNAL_SERVER_ERROR: 'Internal server error during AI conversation',
  NO_SCORING_RESPONSE: 'No scoring response generated',
  METHOD_NOT_ALLOWED: 'Method not allowed. Use POST to continue conversation.'
};

export const SUCCESS_MESSAGES = {
  INTERVIEW_COMPLETED_WITH_REPORT: 'Interview completed! Your detailed report is ready.',
  INTERVIEW_COMPLETED_PENDING_SCORE: 'Interview completed! Your score will be available shortly.'
};

export const LOG_MESSAGES = {
  NEW_SESSION_CREATED: '✅ New session created:',
  CONVERSATION_STORED: '✅ Conversation data stored successfully',
  SCORE_GENERATED: '✅ Interview score generated and stored successfully',
  AI_RESPONSE_GENERATED: '✅ AI interview response generated:',
  PROCESSING_AI_RESPONSE: '🤖 Processing AI interview response:',
  SESSION_CREATION_ERROR: 'Error creating session:',
  CONVERSATION_STORAGE_FAILED: '⚠️ Failed to store conversation data:',
  FINAL_CONVERSATION_STORAGE_FAILED: '⚠️ Failed to store final conversation data:',
  SCORE_GENERATION_FAILED: '⚠️ Failed to generate interview score:',
  AI_CONVERSATION_ERROR: '❌ AI conversation error:'
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMIT: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;