import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface StoreConversationRequest {
  sessionId?: string;
  userResponse?: string;
  aiResponse?: string;
  interactionType: 'user_response' | 'ai_response';
  transcriptText: string;
  conversationOrder: number;
  sessionType?: 'behavioral' | 'technical' | 'general';
  audioFileSize?: number;
  audioDurationSeconds?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: StoreConversationRequest = await request.json();
    const {
      sessionId,
      aiResponse,
      interactionType,
      transcriptText,
      conversationOrder,
      sessionType = 'behavioral',
      audioFileSize,
      audioDurationSeconds
    } = body;

    // Validate required fields
    if (!transcriptText || !interactionType || conversationOrder === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: transcriptText, interactionType, conversationOrder' },
        { status: 400 }
      );
    }

    let currentSessionId = sessionId;

    // If no sessionId provided, create a new session
    if (!currentSessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          session_type: sessionType,
          session_start: new Date().toISOString(),
          total_interactions: 0
        })
        .select('session_id')
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return NextResponse.json(
          { error: 'Failed to create interview session' },
          { status: 500 }
        );
      }

      currentSessionId = sessionData.session_id;
    }

    // Store the transcript
    const { error: transcriptError } = await supabase
      .from('voice_transcripts')
      .insert({
        user_id: user.id,
        session_id: currentSessionId,
        transcript_text: transcriptText,
        interaction_type: interactionType,
        ai_response: aiResponse || null,
        conversation_order: conversationOrder,
        audio_file_size: audioFileSize || null,
        audio_duration_seconds: audioDurationSeconds || null
      });

    if (transcriptError) {
      console.error('Error storing transcript:', transcriptError);
      return NextResponse.json(
        { error: 'Failed to store transcript' },
        { status: 500 }
      );
    }

    // Update session statistics (this will be handled by the database trigger)
    // But we can also manually update if needed
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({
        session_end: new Date().toISOString()
      })
      .eq('session_id', currentSessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      // Don't fail the request for this, just log it
    }

    console.log('✅ Successfully stored conversation data:', {
      sessionId: currentSessionId,
      interactionType,
      transcriptLength: transcriptText.length,
      conversationOrder
    });

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      message: 'Conversation data stored successfully'
    });

  } catch (error: any) {
    console.error('❌ Error storing conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to store conversation data.' },
    { status: 405 }
  );
}