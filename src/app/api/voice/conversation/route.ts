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

// Helper function to generate AI scoring using OpenAI
async function generateInterviewScore(
  conversationHistory: ConversationMessage[],
  sessionType: InterviewMode,
  apiKey: string,
  config?: InterviewModeConfig
): Promise<{
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  detailed_feedback: string;
}> {
  const userResponses = conversationHistory
    .filter(msg => msg.type === 'user')
    .map(msg => msg.text)
    .join('\n\n');

  const scoringPrompt = PromptService.createScoringPrompt(sessionType, config, userResponses);

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: scoringPrompt }],
    model: 'gpt-4o-mini',
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
  } catch {
    console.warn('Failed to parse AI scoring response, using fallback');
    return {
      overall_score: 7,
      strengths: ['Provided detailed responses', 'Showed enthusiasm for the role'],
      weaknesses: ['Could improve response structure', 'Needs more specific examples'],
      improvements: ['Use STAR method for behavioral questions', 'Provide quantifiable results', 'Practice storytelling techniques'],
      detailed_feedback: response || 'The candidate provided responses to the interview questions.'
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

    // --- HANDLE WELCOME MESSAGE ---
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
          model: 'gpt-4o-mini',
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

    // --- CONVERSATION LOGIC ---

    if (!userResponse || !userResponse.trim()) {
      return NextResponse.json(
        { error: 'No user response provided' },
        { status: 400 }
      );
    }



    // Auth check (for user metadata in prompts, not for DB storage)
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;

    // DEV BYPASS: Support mock admin user on localhost
    if (!user && process.env.NODE_ENV === 'development') {
      const devBypass = request.cookies.get('dev-bypass')?.value === 'true';
      if (devBypass) {
        user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'admin@admin.com',
          user_metadata: { full_name: 'Local Admin' }
        } as any;
      }
    }

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



    // Call OpenAI LLM for AI response
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please provide your next interview question or follow-up based on the candidate's response: "${userResponse}"` },
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 200,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('No response generated from AI');
    }



    // Check if interview is complete
    const newQuestionCount = currentQuestionCount + 1;
    const isComplete = newQuestionCount >= 5;

    // Generate score if complete (returned directly, not stored in DB)
    let interviewScore = null;
    if (isComplete) {


      try {
        const updatedHistory: ConversationMessage[] = [
          ...conversationHistory,
          { type: 'user' as const, text: userResponse },
          { type: 'ai' as const, text: aiResponse }
        ];

        interviewScore = await generateInterviewScore(
          updatedHistory,
          sessionType as InterviewMode,
          apiKey,
          config
        );

      } catch (error) {
        console.error('⚠️ Failed to generate score:', error);
      }
    }

    return NextResponse.json({
      success: true,
      aiResponse: aiResponse,
      conversationContinues: !isComplete,
      sessionId: sessionId, // Pass through the client-side session ID
      questionProgress: {
        current: newQuestionCount,
        total: 5,
        isComplete: isComplete
      },
      interviewComplete: isComplete,
      interviewReport: interviewScore,
      message: isComplete
        ? (interviewScore ? "Interview completed! Your detailed report is ready." : "Interview completed!")
        : undefined
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
