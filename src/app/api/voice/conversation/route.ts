import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { PromptService } from '../services/promptService';
import { InterviewMode, InterviewModeConfig, PromptContext } from '../types';
import { VOICE_CONFIG, VoiceOption } from '@/types/voice.types';

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

// Helper function to generate AI scoring using OpenAI
async function generateInterviewScore(
  conversationHistory: ConversationMessage[],
  sessionType: InterviewMode,
  apiKey: string,
  config?: InterviewModeConfig
): Promise<any> {
  const userResponses = conversationHistory
    .filter(msg => msg.type === 'user')
    .map(msg => msg.text)
    .join('\n\n');

  const scoringPrompt = PromptService.createScoringPrompt(sessionType, config, userResponses);

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: scoringPrompt }],
    model: 'gpt-4o-mini', // Use a capable but cost-effective model for scoring
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' }
  });

  const response = completion.choices[0]?.message?.content?.trim();
  if (!response) throw new Error('No scoring response generated');

  try {
    const parsed = JSON.parse(response);
    return {
      overall_score: parsed.overall_score || 7,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Provided detailed responses', 'Showed enthusiasm'],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Could improve structure', 'Needs more specific examples'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Use STAR method', 'Provide quantifiable results', 'Practice storytelling'],
      detailed_feedback: parsed.detailed_feedback || response
    };
  } catch (parseError) {
    console.warn('Failed to parse AI scoring response, using fallback:', parseError);
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
    const body = await request.json();
    const {
      type, // 'welcome' or undefined (conversation)
      userResponse,
      conversationHistory = [],
      sessionId,
      sessionType = 'behavioral',
      config,
      voiceName,
      apiKey
    } = body;

    // Validate API Key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Please configure your OpenAI API key in Account Settings.', requires_ai_config: true },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // --- HANDLE WELCOME MESSAGE EXTENSION ---
    if (type === 'welcome') {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userName: string | undefined;
        if (user?.user_metadata?.full_name) {
          userName = user.user_metadata.full_name;
        } else if (user?.user_metadata?.name) {
          userName = user.user_metadata.name;
        }

        let interviewerName: string | undefined;
        if (voiceName) {
          const voiceConfig = VOICE_CONFIG[voiceName as VoiceOption];
          interviewerName = voiceConfig?.displayName || voiceName;
        }

        const welcomePrompt = PromptService.createWelcomePrompt(userName, sessionType as InterviewMode, interviewerName);

        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: welcomePrompt }],
          model: 'gpt-4o-mini', // Fast model for welcome message
          temperature: 0.7,
          max_tokens: 200,
        });

        const welcomeMessage = completion.choices[0]?.message?.content?.trim();

        if (!welcomeMessage) {
          throw new Error('No welcome message generated from AI');
        }

        return NextResponse.json({
          success: true,
          welcomeMessage,
          sessionType,
          config
        });
      } catch (welcomeError: any) {
        console.error('❌ Welcome message generation error:', welcomeError);
        return NextResponse.json(
          { error: 'Welcome message generation failed', details: welcomeError.message },
          { status: 500 }
        );
      }
    }

    // --- CONVERSATION LOGIC (Original POST functionality) ---

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

    const currentQuestionCount = conversationHistory.filter((msg: ConversationMessage) => msg.type === 'user').length;

    const isLastQuestion = currentQuestionCount >= 3;

    const conversationContext = conversationHistory
      .map((msg: ConversationMessage) =>
        `${msg.type === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.text}`
      )
      .join('\n');

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

    // Call OpenAI LLM for AI response
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please provide your next interview question or follow-up based on the candidate's response: "${userResponse}"` },
      ],
      model: 'gpt-4o-mini', // Use fast model for conversation
      temperature: 0.7,
      max_tokens: 200,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('No response generated from AI');
    }

    console.log('✅ AI response generated:', {
      sessionType,
      responseTime: Date.now() - startTime,
    });

    // Store conversation data to database
    let currentSessionId = sessionId;
    // ... DB storage logic ...
    // Note: Reusing existing logic but keeping it cleaner
    const currentWeek = getCurrentWeekIdentifier();

    try {
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

        if (sessionError) console.error('Error creating session:', sessionError);
        else currentSessionId = sessionData.id;
      }

      if (currentSessionId) {
        await supabase.from('voice_transcripts').insert({
          user_id: user.id,
          session_id: currentSessionId,
          transcript_text: userResponse,
          interaction_type: 'user_response',
          conversation_order: conversationHistory.length
        });

        await supabase.from('voice_transcripts').insert({
          user_id: user.id,
          session_id: currentSessionId,
          transcript_text: aiResponse,
          interaction_type: 'ai_response',
          conversation_order: conversationHistory.length + 1
        });

        const newQuestionCount = currentQuestionCount + 1;
        const shouldComplete = newQuestionCount >= 5;

        await supabase.from('interview_sessions').update({
          session_end: shouldComplete ? new Date().toISOString() : null,
          question_count: newQuestionCount,
          is_completed: shouldComplete
        }).eq('id', currentSessionId);

        // If this completes the interview, generate score
        if (shouldComplete) {
          console.log('🎯 Interview completed after', newQuestionCount, 'questions');

          try {
            const updatedHistory = [...conversationHistory,
            { type: 'user' as const, text: userResponse },
            { type: 'ai' as const, text: aiResponse }
            ];

            const score = await generateInterviewScore(updatedHistory, sessionType as InterviewMode, apiKey, config);

            // Check if score already exists for this session
            const { data: existingScore } = await supabase
              .from('interview_scores')
              .select('id')
              .eq('session_id', currentSessionId)
              .single();

            if (!existingScore) {
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

              console.log('✅ Interview score generated and stored');
            }
          } catch (error) {
            console.error('⚠️ Failed to generate score:', error);
          }
        }
      }
    } catch (dbError) {
      console.error('⚠️ Failed to store conversation data:', dbError);
    }

    // Check if interview was completed
    const newQuestionCount = currentQuestionCount + 1;
    const isComplete = newQuestionCount >= 5;

    // Get the final score to return if completed
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

    if (error?.status === 401 || error?.error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your OpenAI API key.', type: 'auth_error' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for conversation/welcome messages.' },
    { status: 405 }
  );
}
