import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit as checkUserRateLimit } from '@/utils/rateLimiting';

// Initialize Groq client (reuse existing API key management)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_0 || process.env.GROQ_API_KEY,
});

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

// Helper function to generate AI scoring
async function generateInterviewScore(conversationHistory: ConversationMessage[]): Promise<any> {
  const userResponses = conversationHistory
    .filter(msg => msg.type === 'user')
    .map(msg => msg.text)
    .join('\n\n');

  const scoringPrompt = `You are an expert HR interviewer evaluating a candidate's performance in a behavioral interview. 

Analyze the following candidate responses and provide a comprehensive evaluation:

${userResponses}

Provide your evaluation in the following JSON format:
{
  "overall_score": [score from 1-10],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "detailed_feedback": "Comprehensive feedback paragraph"
}

Evaluation criteria:
- Communication clarity and structure
- Use of STAR method (Situation, Task, Action, Result)
- Specific examples and details
- Problem-solving approach
- Leadership and teamwork skills
- Self-awareness and growth mindset

Be constructive, specific, and helpful in your feedback.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: scoringPrompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 800,
  });

  const response = completion.choices[0]?.message?.content?.trim();
  if (!response) throw new Error('No scoring response generated');

  try {
    return JSON.parse(response);
  } catch {
    // Fallback if JSON parsing fails
    return {
      overall_score: 7,
      strengths: ['Provided detailed responses', 'Showed enthusiasm'],
      weaknesses: ['Could improve structure', 'Needs more specific examples'],
      improvements: ['Use STAR method', 'Provide quantifiable results', 'Practice storytelling'],
      detailed_feedback: response
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userResponse, conversationHistory = [], sessionId, sessionType = 'behavioral', checkRateLimit = false, voiceId } = await request.json();

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
    
    // Hard limit: After 4 API calls (plus initial hardcoded question = 5 total)
    if (currentQuestionCount >= 4) {
      // Force interview completion with hardcoded closing message
      const closingMessage = "Thank you for completing your interview! This concludes our session. You've answered all 5 questions, and we'll now evaluate your responses. You should receive your detailed feedback and score shortly. We appreciate your time and thoughtful answers.";
      
      // Store the final user response and closing message
      let currentSessionId = sessionId;
      let interviewScore = null;
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
              is_completed: false
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
          // Store final user response
          await supabase
            .from('voice_transcripts')
            .insert({
              user_id: user.id,
              session_id: currentSessionId,
              transcript_text: userResponse,
              interaction_type: 'user_response',
              conversation_order: conversationHistory.length,
            });

          // Store closing message
          await supabase
            .from('voice_transcripts')
            .insert({
              user_id: user.id,
              session_id: currentSessionId,
              transcript_text: closingMessage,
              interaction_type: 'ai_response',
              conversation_order: conversationHistory.length + 1,
            });

          // Mark session as completed
          await supabase
            .from('interview_sessions')
            .update({
              session_end: new Date().toISOString(),
              question_count: 5,
              is_completed: true
            })
            .eq('id', currentSessionId);

          // Generate score and report synchronously for immediate response
          const updatedHistory = [...conversationHistory, 
            { type: 'user', text: userResponse }
          ];
          
          try {
            const score = await generateInterviewScore(updatedHistory);
            
            // Store the interview score
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
            
            // Update session (interview_report column may not exist yet)
            await supabase
              .from('interview_sessions')
              .update({
                session_end: new Date().toISOString(),
                question_count: 5,
                is_completed: true
              })
              .eq('id', currentSessionId);
            
            // TODO: Add interview_report column to store JSON report when database migration is possible
            
            interviewScore = score;
            console.log('✅ Interview score generated and stored successfully');
          } catch (error) {
            console.error('⚠️ Failed to generate interview score:', error);
            // Continue without score if generation fails
          }
        }
      } catch (dbError) {
        console.error('⚠️ Failed to store final conversation data:', dbError);
      }

      return NextResponse.json({
        success: true,
        aiResponse: closingMessage,
        conversationContinues: false,
        sessionId: currentSessionId,
        questionProgress: {
          current: 5,
          total: 5,
          isComplete: true
        },
        interviewComplete: true,
        interviewReport: interviewScore,
        message: interviewScore ? "Interview completed! Your detailed report is ready." : "Interview completed! Your score will be available shortly."
      });
    }
    
    const isLastQuestion = currentQuestionCount >= 3; // 4th question (0-indexed)

    // Build conversation context
    const conversationContext = conversationHistory
      .map((msg: ConversationMessage) => 
        `${msg.type === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.text}`
      )
      .join('\n');

    // Create system prompt for behavioral interview
    const systemPrompt = `You are an experienced HR interviewer conducting a behavioral interview. Your role is to:

1. Ask thoughtful follow-up questions based on the candidate's responses
2. Use the STAR method (Situation, Task, Action, Result) to guide deeper questioning
3. Be professional, encouraging, and conversational
4. Ask one question at a time
5. Keep responses concise (1-3 sentences)
6. Focus on behavioral interview topics like teamwork, problem-solving, leadership, challenges, etc.

IMPORTANT: This is a 5-question interview. Current question count: ${currentQuestionCount + 1}/5

${isLastQuestion ? 
  'This is the 4th and FINAL AI-generated question. Make it count - ask something insightful about their experience.' : 
  'Continue with engaging behavioral questions.'}

Current conversation context:
${conversationContext}

Latest candidate response: "${userResponse}"

${isLastQuestion ? 
  'Ask your final behavioral interview question. Focus on leadership, problem-solving, or career growth.' : 
  'Provide a natural follow-up question or move to a new behavioral interview topic. Be conversational and engaging.'}`;

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

    console.log('✅ AI interview response generated:', {
      responseLength: aiResponse.length,
      preview: aiResponse.substring(0, 100) + '...',
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
            is_completed: false
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
          });

        // Update session with current question count
        await supabase
          .from('interview_sessions')
          .update({
            session_end: new Date().toISOString(),
            question_count: currentQuestionCount + 1
          })
          .eq('id', currentSessionId);
          
        console.log('✅ Conversation data stored successfully');
      }
    } catch (dbError) {
      console.error('⚠️ Failed to store conversation data:', dbError);
      // Don't fail the main request if database storage fails
    }

    return NextResponse.json({
      success: true,
      aiResponse: aiResponse,
      conversationContinues: true,
      sessionId: currentSessionId,
      questionProgress: {
        current: currentQuestionCount + 1,
        total: 5,
        isComplete: false
      }
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
