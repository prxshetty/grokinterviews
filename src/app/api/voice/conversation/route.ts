import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client (reuse existing API key management)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_0 || process.env.GROQ_API_KEY,
});

interface ConversationMessage {
  type: 'ai' | 'user';
  text: string;
  timestamp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { userResponse, conversationHistory = [] } = await request.json();

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

Current conversation context:
${conversationContext}

Latest candidate response: "${userResponse}"

Provide a natural follow-up question or move to a new behavioral interview topic. Be conversational and engaging.`;

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

    return NextResponse.json({
      success: true,
      aiResponse: aiResponse,
      conversationContinues: true,
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
