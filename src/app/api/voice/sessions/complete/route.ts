import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark the session as completed
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({ 
        is_completed: true,
        session_end: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id); // Ensure user can only complete their own sessions

    if (updateError) {
      console.error('Error marking session as completed:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark session as completed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Session marked as completed'
    });

  } catch (error) {
    console.error('Error in session complete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}