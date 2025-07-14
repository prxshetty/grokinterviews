import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, transcriptText, interactionType, conversationOrder } = await request.json();

    if (!sessionId || !transcriptText || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, transcriptText, interactionType' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert transcript into database
    const { data, error } = await supabase
      .from('voice_transcripts')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        transcript_text: transcriptText,
        interaction_type: interactionType,
        conversation_order: conversationOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting transcript:', error);
      return NextResponse.json(
        { error: 'Failed to save transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: data
    });

  } catch (error: any) {
    console.error('❌ Transcript API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
