import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface TerminationReason {
  type: 'rate_limit' | 'microphone_error' | 'network_error' | 'user_abort' | 'system_error';
  message: string;
  details?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason, conversationHistory = [] } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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

    console.log('🛑 Terminating interview session:', {
      sessionId,
      reason: reason?.type || 'unknown',
      userId: user.id
    });

    const terminationReason: TerminationReason = reason || {
      type: 'system_error',
      message: 'Interview terminated due to system error'
    };

    try {
      // Check if session exists and belongs to the user
      const { data: existingSession, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('id, user_id, is_completed, session_start')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !existingSession) {
        console.error('Session not found or access denied:', sessionError);
        return NextResponse.json(
          { error: 'Session not found or access denied' },
          { status: 404 }
        );
      }

      // Don't terminate if already completed
      if (existingSession.is_completed) {
        console.log('Session already completed, skipping termination');
        return NextResponse.json({
          success: true,
          message: 'Session was already completed'
        });
      }

      // Store termination message in transcripts
      const terminationMessage = `Interview terminated: ${terminationReason.message}`;
      
      await supabase
        .from('voice_transcripts')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          transcript_text: terminationMessage,
          interaction_type: 'ai_response',
          conversation_order: conversationHistory.length,
        });

      // Calculate session duration
      const sessionStart = new Date(existingSession.session_start);
      const sessionEnd = new Date();
      const durationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60));

      // Update session as completed with termination reason
      const { error: updateError } = await supabase
        .from('interview_sessions')
        .update({
          session_end: sessionEnd.toISOString(),
          is_completed: true,
          question_count: conversationHistory.filter((msg: any) => msg.type === 'user').length,
          // Store termination reason in a JSON field if available, or in notes
          termination_reason: terminationReason.type,
          termination_message: terminationReason.message
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating session:', updateError);
        // Continue anyway - at least we tried to mark it as terminated
      }

      console.log('✅ Interview session terminated successfully:', {
        sessionId,
        reason: terminationReason.type,
        duration: `${durationMinutes} minutes`
      });

      return NextResponse.json({
        success: true,
        message: 'Interview terminated successfully',
        sessionId,
        reason: terminationReason,
        duration: durationMinutes
      });

    } catch (dbError) {
      console.error('❌ Database error during termination:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to terminate session in database',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Interview termination error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during interview termination',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to terminate interview.' },
    { status: 405 }
  );
}