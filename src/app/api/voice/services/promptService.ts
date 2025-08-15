import { 
  InterviewMode, 
  InterviewModeConfig, 
  PromptContext, 
  INTERVIEW_CONSTANTS 
} from '../types';

export class PromptService {
  static createSystemPrompt(context: PromptContext): string {
    const {
      sessionType,
      config,
      conversationContext,
      userResponse,
      currentQuestionCount,
      isLastQuestion
    } = context;

    const baseInstructions = this.getBaseInstructions(
      currentQuestionCount,
      isLastQuestion,
      conversationContext,
      userResponse
    );

    switch (sessionType) {
      case 'behavioral':
        return this.createBehavioralPrompt(baseInstructions, isLastQuestion);
      case 'sd':
        return this.createSystemDesignPrompt(baseInstructions, config, isLastQuestion);
      case 'technical':
        return this.createTechnicalPrompt(baseInstructions, config, isLastQuestion);
      case 'custom':
        return this.createCustomPrompt(baseInstructions, config, isLastQuestion);
      default:
        return this.createBehavioralPrompt(baseInstructions, isLastQuestion);
    }
  }

  static createScoringPrompt(
    sessionType: InterviewMode,
    config: InterviewModeConfig | undefined,
    userResponses: string
  ): string {
    const basePrompt = this.getBaseScoringPrompt(userResponses);

    switch (sessionType) {
      case 'behavioral':
        return this.createBehavioralScoringPrompt(basePrompt);
      case 'sd':
        return this.createSystemDesignScoringPrompt(basePrompt, config);
      case 'technical':
        return this.createTechnicalScoringPrompt(basePrompt, config);
      case 'custom':
        return this.createCustomScoringPrompt(basePrompt, config);
      default:
        return this.createBehavioralScoringPrompt(basePrompt);
    }
  }

  private static getBaseInstructions(
    currentQuestionCount: number,
    isLastQuestion: boolean,
    conversationContext: string,
    userResponse: string
  ): string {
    return `
IMPORTANT: This is a ${INTERVIEW_CONSTANTS.MAX_QUESTIONS}-question interview. Current question count: ${currentQuestionCount + 1}/${INTERVIEW_CONSTANTS.MAX_QUESTIONS}

${isLastQuestion ? 
  'This is the 4th and FINAL AI-generated question. Make it count - ask something insightful.' : 
  'Continue with engaging interview questions.'}

Current conversation context:
${conversationContext}

Latest candidate response: "${userResponse}"`;
  }

  private static createBehavioralPrompt(
    baseInstructions: string,
    isLastQuestion: boolean
  ): string {
    return `You are an experienced HR interviewer conducting a behavioral interview. Your role is to:

1. Ask thoughtful follow-up questions based on the candidate's responses
2. Use the STAR method (Situation, Task, Action, Result) to guide deeper questioning
3. Be professional, encouraging, and conversational
4. Ask one question at a time
5. Keep responses concise (1-3 sentences)
6. Focus on behavioral interview topics like teamwork, problem-solving, leadership, challenges, etc.

${baseInstructions}

${isLastQuestion ? 
  'Ask your final behavioral interview question. Focus on leadership, problem-solving, or career growth.' : 
  'Provide a natural follow-up question or move to a new behavioral interview topic. Be conversational and engaging.'}`;
  }

  private static createSystemDesignPrompt(
    baseInstructions: string,
    config: InterviewModeConfig | undefined,
    isLastQuestion: boolean
  ): string {
    return `You are an expert system design interviewer at a top tech company. Your role is to:

1. Guide the candidate through designing a ${config?.systemType || 'scalable system'} that handles ${config?.scale || 'significant scale'}
2. Focus on the following constraints: ${config?.constraints?.join(', ') || 'scalability and performance'}
3. Ask probing questions about architecture, data flow, scalability, and trade-offs
4. Be technical but encouraging, helping the candidate think through design decisions
5. Keep responses concise (1-3 sentences)
6. Focus on system components, data modeling, API design, and scalability patterns

${baseInstructions}

${isLastQuestion ? 
  'Ask your final system design question. Focus on optimization, monitoring, or failure handling.' : 
  'Guide the candidate deeper into the system design. Ask about specific components, data flow, or scaling challenges.'}`;
  }

  private static createTechnicalPrompt(
    baseInstructions: string,
    config: InterviewModeConfig | undefined,
    isLastQuestion: boolean
  ): string {
    return `You are a senior software engineer conducting a technical interview. Your role is to:

1. Ask coding and technical questions related to ${config?.programmingLanguage || 'programming'}
2. Focus on these areas: ${config?.focusAreas?.join(', ') || 'problem-solving and algorithms'}
3. Set questions at ${config?.difficulty?.toLowerCase() || 'medium'} difficulty level
4. Be supportive while challenging the candidate's technical thinking
5. Ask about code complexity, edge cases, and optimization
6. Keep responses concise (1-3 sentences)

${baseInstructions}

${isLastQuestion ? 
  'Ask your final technical question. Focus on optimization, debugging, or advanced concepts.' : 
  'Present a technical problem or ask about implementation details. Be specific and practical.'}`;
  }

  private static createCustomPrompt(
    baseInstructions: string,
    config: InterviewModeConfig | undefined,
    isLastQuestion: boolean
  ): string {
    return `You are an expert interviewer conducting a specialized interview. Your role is to:

1. Ask questions about: ${config?.customTopics || 'the specified topics'}
2. Use ${config?.questionFormat?.toLowerCase() || 'flexible'} format for your questions
3. Set questions at ${config?.difficulty?.toLowerCase() || 'medium'} difficulty level
4. Be knowledgeable and engaging about the specific subject matter
5. Tailor your approach to the candidate's responses and expertise level
6. Keep responses concise (1-3 sentences)

${baseInstructions}

${isLastQuestion ? 
  'Ask your final question about the specified topics. Make it insightful and comprehensive.' : 
  'Continue exploring the candidate\'s knowledge and experience in the specified areas.'}`;
  }

  private static getBaseScoringPrompt(userResponses: string): string {
    return `
Analyze the following candidate responses and provide a comprehensive evaluation:

${userResponses}

Provide your evaluation in the following JSON format:
{
  "overall_score": [score from 1-10],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "detailed_feedback": "Comprehensive feedback paragraph"
}`;
  }

  private static createBehavioralScoringPrompt(basePrompt: string): string {
    return `You are an expert HR interviewer evaluating a candidate's performance in a behavioral interview. 

${basePrompt}

Evaluation criteria:
- Communication clarity and structure
- Use of STAR method (Situation, Task, Action, Result)
- Specific examples and details
- Problem-solving approach
- Leadership and teamwork skills
- Self-awareness and growth mindset

Be constructive, specific, and helpful in your feedback.`;
  }

  private static createSystemDesignScoringPrompt(
    basePrompt: string,
    config: InterviewModeConfig | undefined
  ): string {
    return `You are an expert system design interviewer evaluating a candidate's system design skills for a ${config?.systemType || 'scalable system'} at ${config?.scale || 'significant scale'}.

${basePrompt}

Evaluation criteria:
- System architecture understanding
- Scalability and performance considerations
- Trade-off analysis and decision making
- Knowledge of system components and patterns
- Problem decomposition and structured thinking
- Consideration of constraints: ${config?.constraints?.join(', ') || 'scalability and performance'}

Focus on technical depth, architectural choices, and systems thinking. Be constructive and specific.`;
  }

  private static createTechnicalScoringPrompt(
    basePrompt: string,
    config: InterviewModeConfig | undefined
  ): string {
    return `You are a senior software engineer evaluating a candidate's technical interview performance in ${config?.programmingLanguage || 'programming'}.

${basePrompt}

Evaluation criteria:
- Problem-solving approach and algorithm design
- Code quality and best practices
- Understanding of ${config?.focusAreas?.join(', ') || 'programming concepts'}
- Complexity analysis and optimization
- Debugging and edge case handling
- Communication of technical concepts

Difficulty level assessed: ${config?.difficulty || 'Medium'}. Be constructive and focus on technical competency.`;
  }

  private static createCustomScoringPrompt(
    basePrompt: string,
    config: InterviewModeConfig | undefined
  ): string {
    return `You are an expert interviewer evaluating a candidate's knowledge and skills in specialized topics.

${basePrompt}

Evaluation criteria:
- Deep understanding of: ${config?.customTopics || 'the specified topics'}
- Quality of responses in ${config?.questionFormat || 'flexible'} format
- Technical or domain expertise demonstration
- Problem-solving approach
- Communication clarity
- Practical application knowledge

Difficulty level assessed: ${config?.difficulty || 'Medium'}. Focus on domain expertise and practical knowledge.`;
  }
}