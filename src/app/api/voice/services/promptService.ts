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
        return this.createBehavioralPrompt(baseInstructions, config, isLastQuestion);
      case 'sd':
        return this.createSystemDesignPrompt(baseInstructions, config, isLastQuestion);
      case 'technical':
        return this.createTechnicalPrompt(baseInstructions, config, isLastQuestion);
      case 'custom':
        return this.createCustomPrompt(baseInstructions, config, isLastQuestion);
      default:
        return this.createBehavioralPrompt(baseInstructions, config, isLastQuestion);
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
        return this.createBehavioralScoringPrompt(basePrompt, config);
      case 'sd':
        return this.createSystemDesignScoringPrompt(basePrompt, config);
      case 'technical':
        return this.createTechnicalScoringPrompt(basePrompt, config);
      case 'custom':
        return this.createCustomScoringPrompt(basePrompt, config);
      default:
        return this.createBehavioralScoringPrompt(basePrompt, config);
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
    config: InterviewModeConfig | undefined,
    isLastQuestion: boolean
  ): string {
    const industryContext = config?.industry ? `in the ${config.industry} industry` : '';
    const roleContext = config?.targetRole ? `for the ${config.targetRole} role` : '';
    const experienceContext = config?.minYearsExperience !== undefined && config?.maxYearsExperience !== undefined ? 
      `targeting candidates with ${config.minYearsExperience}-${config.maxYearsExperience} years of experience` : '';
    
    const experienceLevel = config?.minYearsExperience !== undefined && config?.maxYearsExperience !== undefined ?
      config.minYearsExperience === 0 && config.maxYearsExperience <= 2 ? 'entry-level' :
      config.minYearsExperience <= 2 && config.maxYearsExperience <= 5 ? 'junior to mid-level' :
      config.minYearsExperience <= 5 && config.maxYearsExperience <= 10 ? 'mid-level to senior' :
      config.minYearsExperience >= 8 ? 'senior to executive-level' : 'mid-level'
      : 'mid-level';

    return `You are an experienced HR interviewer conducting a behavioral interview${industryContext} ${roleContext} ${experienceContext}. Your role is to:

1. Ask thoughtful follow-up questions based on the candidate's responses
2. Use the STAR method (Situation, Task, Action, Result) to guide deeper questioning
3. Be professional, encouraging, and conversational
4. Ask one question at a time - NEVER provide examples or suggestions
5. Keep responses concise (1-3 sentences)
6. Simply acknowledge their answer and move to the next behavioral topic
7. Ask ${experienceLevel} appropriate questions based on their experience range
8. Focus on competencies relevant to the ${config?.targetRole || 'target role'} ${industryContext}

${baseInstructions}

${isLastQuestion ? 
  'Ask your final behavioral interview question. Focus on the most critical competency for this role and experience level.' : 
  'Acknowledge their previous answer briefly and ask your next behavioral question relevant to their experience level and role. Do not give examples or suggestions.'}`;
  }

  private static createSystemDesignPrompt(
    baseInstructions: string,
    config: InterviewModeConfig | undefined,
    isLastQuestion: boolean
  ): string {
    const roleContext = config?.targetRole ? ` for the ${config.targetRole} role` : '';
    return `You are an expert system design interviewer at a top tech company${roleContext}. Your role is to:

1. Guide the candidate through designing a ${config?.systemType || 'scalable system'} that handles ${config?.scale || 'significant scale'}
2. Focus on the following constraints: ${config?.constraints?.join(', ') || 'scalability and performance'}
3. Ask questions that can be answered conceptually (architecture choices, trade-offs, approaches)
4. NEVER provide architectural solutions - only ask probing questions
5. Keep responses concise (1-3 sentences)
6. Simply acknowledge their answer and move to the next design aspect

${baseInstructions}

${isLastQuestion ? 
  'Ask your final system design question. Focus on optimization, monitoring, or failure handling.' : 
  'Acknowledge their previous answer briefly and ask about the next system design aspect. Do not provide solutions.'}`;
  }

  private static createTechnicalPrompt(
    baseInstructions: string,
    config: InterviewModeConfig | undefined,
    isLastQuestion: boolean
  ): string {
    const roleContext = config?.targetRole ? ` for the ${config.targetRole} role` : '';
    return `You are a senior software engineer conducting a technical interview${roleContext}. Your role is to:

1. Ask coding and technical questions related to ${config?.programmingLanguage || 'programming'} that are pertinent to ${config?.targetRole || 'the target role'}
2. Focus on these areas: ${config?.focusAreas?.join(', ') || 'problem-solving and algorithms'}
3. Set questions at ${config?.difficulty?.toLowerCase() || 'medium'} difficulty level
4. Ask questions that can be answered in words (explain concepts, approach, trade-offs)
5. NEVER provide solutions or answers - only ask questions
6. Keep responses concise (1-3 sentences)
7. Simply acknowledge the answer and move to the next question

${baseInstructions}

${isLastQuestion ? 
  'Ask your final technical question. Focus on optimization, debugging, or advanced concepts.' : 
  'Acknowledge their previous answer briefly and ask your next technical question. Do not give solutions.'}`;
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
4. Ask questions that can be answered conceptually and in words
5. NEVER provide solutions, examples, or detailed explanations - only ask questions
6. Keep responses concise (1-3 sentences)
7. Simply acknowledge their answer and move to the next topic

${baseInstructions}

${isLastQuestion ? 
  'Ask your final question about the specified topics. Make it insightful and comprehensive.' : 
  'Acknowledge their previous answer briefly and ask your next question about the topics. Do not provide solutions.'}`;
  }

  private static getBaseScoringPrompt(userResponses: string): string {
    return `
Analyze the following candidate responses and provide a comprehensive evaluation:

${userResponses}

IMPORTANT: You must respond with ONLY valid JSON in the exact format below. Do not include any text before or after the JSON.

{
  "overall_score": 7,
  "strengths": ["Clear communication", "Good problem-solving approach", "Relevant experience"],
  "weaknesses": ["Could provide more specific examples", "Needs to elaborate on technical details"],
  "improvements": ["Use the STAR method for behavioral questions", "Provide quantifiable results", "Practice explaining complex concepts simply"],
  "detailed_feedback": "The candidate demonstrated solid understanding and communication skills. Their responses showed good analytical thinking, though they could benefit from providing more concrete examples and measurable outcomes. Overall performance indicates strong potential with room for growth in storytelling and technical depth."
}

Score Guidelines:
- 9-10: Exceptional performance, ready for senior roles
- 7-8: Strong performance, good fit for the role
- 5-6: Average performance, some concerns but potential
- 3-4: Below average, significant gaps
- 1-2: Poor performance, not suitable for the role`;
  }

  private static createBehavioralScoringPrompt(
    basePrompt: string,
    config: InterviewModeConfig | undefined
  ): string {
    const industryContext = config?.industry ? ` in the ${config.industry} industry` : '';
    const roleContext = config?.targetRole ? ` for the ${config.targetRole} role` : '';
    const experienceContext = config?.minYearsExperience !== undefined && config?.maxYearsExperience !== undefined ? 
      ` with ${config.minYearsExperience}-${config.maxYearsExperience} years of experience` : '';
    
    const experienceLevel = config?.minYearsExperience !== undefined && config?.maxYearsExperience !== undefined ?
      config.minYearsExperience === 0 && config.maxYearsExperience <= 2 ? 'entry-level' :
      config.minYearsExperience <= 2 && config.maxYearsExperience <= 5 ? 'junior to mid-level' :
      config.minYearsExperience <= 5 && config.maxYearsExperience <= 10 ? 'mid-level to senior' :
      config.minYearsExperience >= 8 ? 'senior to executive-level' : 'mid-level'
      : 'mid-level';

    return `You are an expert HR interviewer evaluating a candidate's performance in a behavioral interview${industryContext}${roleContext}${experienceContext}. 

${basePrompt}

Evaluation criteria:
- Communication clarity and structure
- Use of STAR method (Situation, Task, Action, Result)
- Specific examples and details relevant to ${config?.targetRole || 'the target role'}
- Problem-solving approach and critical thinking appropriate for ${experienceLevel} professionals
- Leadership and teamwork skills matching the ${config?.minYearsExperience}-${config?.maxYearsExperience || 'target'} year experience range
- Self-awareness and growth mindset
- Industry-specific competencies${industryContext}
- Role-appropriate depth and complexity for ${config?.targetRole || 'the position'}

Experience Level Assessment: ${experienceLevel} (${config?.minYearsExperience || 0}-${config?.maxYearsExperience || 5} years)
Evaluate responses against expectations for this experience level and role.
Be constructive, specific, and helpful in your feedback.`;
  }

  private static createSystemDesignScoringPrompt(
    basePrompt: string,
    config: InterviewModeConfig | undefined
  ): string {
    const roleContext = config?.targetRole ? ` for the ${config.targetRole} role` : '';
    return `You are an expert system design interviewer evaluating a candidate's system design skills for a ${config?.systemType || 'scalable system'} at ${config?.scale || 'significant scale'}${roleContext}.

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
    return `You are a senior software engineer evaluating a candidate's technical interview performance in ${config?.programmingLanguage || 'programming'} for the ${config?.targetRole || 'target'} role.

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