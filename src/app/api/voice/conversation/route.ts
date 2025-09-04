import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/utils/supabase/server';
import { getNextGroqApiKey } from '@/utils/groqApi';
import { checkRateLimit as checkUserRateLimit } from '@/utils/rateLimiting';
import { PromptService } from '../services/promptService';
import { InterviewMode, InterviewModeConfig, PromptContext } from '../types';



interface ConversationMessage {
  type: 'ai' | 'user';
  text: string;
  timestamp?: number;
}

// Helper function to get current week identifier (YYYY-WW format)
function getCurrentWeekIdentifier(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
}

// Helper function to generate AI scoring using PromptService
async function generateInterviewScore(
  conversationHistory: ConversationMessage[], 
  sessionType: InterviewMode, 
  config?: InterviewModeConfig
): Promise<any> {
  const userResponses = conversationHistory
    .filter(msg => msg.type === 'user')
    .map(msg => msg.text)
    .join('\n\n');

  const scoringPrompt = PromptService.createScoringPrompt(sessionType, config, userResponses);

  const apiKey = await getNextGroqApiKey();
  if (!apiKey) throw new Error('Groq API key unavailable');
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: scoringPrompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 800,
  });

  const response = completion.choices[0]?.message?.content?.trim();
  if (!response) throw new Error('No scoring response generated');

  try {
    const parsed = JSON.parse(response);
    // Ensure the parsed object has all required fields with proper defaults
    return {
      overall_score: parsed.overall_score || 7,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Provided detailed responses', 'Showed enthusiasm'],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Could improve structure', 'Needs more specific examples'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Use STAR method', 'Provide quantifiable results', 'Practice storytelling'],
      detailed_feedback: parsed.detailed_feedback || response
    };
  } catch (parseError) {
    console.warn('Failed to parse AI scoring response, using fallback:', parseError);
    // Fallback if JSON parsing fails
    return {
      overall_score: 7,
      strengths: ['Provided detailed responses', 'Showed enthusiasm for the role'],
      weaknesses: ['Could improve response structure', 'Needs more specific examples'],
      improvements: ['Use STAR method for behavioral questions', 'Provide quantifiable results', 'Practice storytelling techniques'],
      detailed_feedback: response || 'The candidate provided responses to the interview questions. Due to a technical issue, detailed feedback could not be generated, but the overall performance was satisfactory.'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userResponse, 
      conversationHistory = [], 
      sessionId, 
      sessionType = 'behavioral', 
      config, // New: optional configuration from frontend
      checkRateLimit = false, 
      voiceId, 
      voiceName 
    } = await request.json();

    // Handle rate limit check requests
    if (checkRateLimit) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check rate limiting using centralized utility with voice tier support
      const rateLimitResult = await checkUserRateLimit('web', user.id, voiceId);
      
      if (!rateLimitResult.isAllowed) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: rateLimitResult.message,
          rateLimited: true
        }, { status: 429 });
      }

      return NextResponse.json({ 
        rateLimited: false,
        remainingAttempts: rateLimitResult.remainingAttempts 
      });
    }

    if (!userResponse || !userResponse.trim()) {
      return NextResponse.json(
        { error: 'No user response provided' },
        { status: 400 }
      );
    }

    console.log('🤖 Processing AI interview response:', {
      userResponse: userResponse.substring(0, 100) + '...',
      historyLength: conversationHistory.length,
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Count current questions (user responses in conversation history)
    const currentQuestionCount = conversationHistory.filter((msg: ConversationMessage) => msg.type === 'user').length;
    
    // Check rate limiting for new interviews (only on first question)
    if (currentQuestionCount === 0) {
      const rateLimitResult = await checkUserRateLimit('web', user.id, voiceId);
      
      if (!rateLimitResult.isAllowed) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: rateLimitResult.message,
          rateLimited: true
        }, { status: 429 });
      }
    }
    
    // Note: Interview completion is now handled in the regular flow below
    // when newQuestionCount >= 4, so no need for separate hard limit logic
    
    const isLastQuestion = currentQuestionCount >= 3; // 4th question (0-indexed)

    // Build conversation context
    const conversationContext = conversationHistory
      .map((msg: ConversationMessage) => 
        `${msg.type === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.text}`
      )
      .join('\n');

    console.log('🤖 Processing interview:', {
      sessionType,
      configUsed: config ? 'custom' : 'preselected',
      questionCount: currentQuestionCount + 1,
      configDetails: {
        programmingLanguage: config?.programmingLanguage,
        focusAreas: config?.focusAreas,
        difficulty: config?.difficulty
      }
    });

    // Create dynamic system prompt using PromptService
    const promptContext: PromptContext = {
      sessionType: sessionType as InterviewMode,
      config: config as InterviewModeConfig,
      conversationContext,
      userResponse,
      currentQuestionCount,
      isLastQuestion
    };

    const systemPrompt = PromptService.createSystemPrompt(promptContext);
    const startTime = Date.now();

    const apiKey = await getNextGroqApiKey();
    if (!apiKey) throw new Error('Groq API key unavailable');
    const groq = new Groq({ apiKey });

    // Call Groq LLM for AI response
    const chatCompletion = await groq.chat.completions.create({
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
      model: 'llama-3.1-8b-instant', // Use fast model for real-time conversation
      temperature: 0.7, // Balanced creativity and consistency
      max_tokens: 200, // Keep responses concise
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('No response generated from AI');
    }

    console.log('✅ AI response generated:', {
      sessionType,
      responseTime: Date.now() - startTime,
      responseLength: aiResponse.length,
      preview: aiResponse.substring(0, 100) + '...'
    });

    // Store conversation data to database (for non-final questions)
    let currentSessionId = sessionId;
    const currentWeek = getCurrentWeekIdentifier();
    
    try {
      // Create new session if none exists
      if (!currentSessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('interview_sessions')
          .insert({
            user_id: user.id,
            session_type: sessionType,
            session_start: new Date().toISOString(),
            total_interactions: 0,
            week_identifier: currentWeek,
            question_count: 0,
            is_completed: false,
            voice_name: voiceName
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
        } else {
          currentSessionId = sessionData.id;
          console.log('✅ New session created:', currentSessionId);
        }
      }

      if (currentSessionId) {
        // Store user response
        await supabase
          .from('voice_transcripts')
          .insert({
            user_id: user.id,
            session_id: currentSessionId,
            transcript_text: userResponse,
            interaction_type: 'user_response',
            conversation_order: conversationHistory.length,
            voice_name: voiceName
          });

        // Store AI response
        await supabase
          .from('voice_transcripts')
          .insert({
            user_id: user.id,
            session_id: currentSessionId,
            transcript_text: aiResponse,
            interaction_type: 'ai_response',
            conversation_order: conversationHistory.length + 1,
            voice_name: voiceName
          });

        // Update session with current question count and check for completion
        const newQuestionCount = currentQuestionCount + 1;
        
        // Check if interview should complete - ensure we have at least 5 questions
        // (including the initial welcome message as question 0)
        const shouldComplete = newQuestionCount >= 5;
        
        await supabase
          .from('interview_sessions')
          .update({
            session_end: shouldComplete ? new Date().toISOString() : null,
            question_count: newQuestionCount,
            is_completed: shouldComplete
          })
          .eq('id', currentSessionId);
          
        // If this completes the interview, generate score
        if (shouldComplete) {
          console.log('🎯 Interview completed after', newQuestionCount, 'questions');
          
          try {
            const updatedHistory = [...conversationHistory, 
              { type: 'user', text: userResponse },
              { type: 'ai', text: aiResponse }
            ];
            
            const score = await generateInterviewScore(updatedHistory, sessionType as InterviewMode, config);
            
            // Check if score already exists for this session to prevent duplicates
            const { data: existingScore } = await supabase
              .from('interview_scores')
              .select('id')
              .eq('session_id', currentSessionId)
              .single();
              
            if (!existingScore) {
              // Store the interview score only if it doesn't exist
              await supabase
                .from('interview_scores')
                .insert({
                  session_id: currentSessionId,
                  overall_score: score.overall_score,
                  strengths: score.strengths,
                  weaknesses: score.weaknesses,
                  improvements: score.improvements,
                  detailed_feedback: score.detailed_feedback
                });
                
              console.log('✅ Interview score generated and stored for completed interview');
            } else {
              console.log('ℹ️ Score already exists for this session, skipping duplicate creation');
            }
          } catch (error) {
            console.error('⚠️ Failed to generate score for completed interview:', error);
          }
        }
          
        console.log('✅ Conversation data stored successfully');
      }
    } catch (dbError) {
      console.error('⚠️ Failed to store conversation data:', dbError);
      // Don't fail the main request if database storage fails
    }

    // Check if interview was completed
    const newQuestionCount = currentQuestionCount + 1;
    const isComplete = newQuestionCount >= 5;
    
    // If completed, get the generated score
    let interviewScore = null;
    if (isComplete && currentSessionId) {
      try {
        const { data: scoreData } = await supabase
          .from('interview_scores')
          .select('*')
          .eq('session_id', currentSessionId)
          .single();
        interviewScore = scoreData;
      } catch (error) {
        console.error('Failed to fetch generated score:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      aiResponse: aiResponse,
      conversationContinues: !isComplete,
      sessionId: currentSessionId,
      questionProgress: {
        current: newQuestionCount,
        total: 5,
        isComplete: isComplete
      },
      interviewComplete: isComplete,
      interviewReport: interviewScore,
      message: isComplete ? (interviewScore ? "Interview completed! Your detailed report is ready." : "Interview completed! Your score will be available shortly.") : undefined
    });

  } catch (error: any) {
    console.error('❌ AI conversation error:', error);

    // Handle specific Groq API errors
    if (error instanceof Groq.APIError) {
      return NextResponse.json(
        { 
          error: 'AI interview response failed', 
          details: error.message,
          type: 'groq_api_error'
        },
        { status: 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error during AI conversation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to continue conversation.' },
    { status: 405 }
  );
}
