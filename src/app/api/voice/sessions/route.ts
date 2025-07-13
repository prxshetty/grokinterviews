import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (sessionId) {
      // Get specific session with transcripts
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      const { data: transcripts, error: transcriptsError } = await supabase
        .from('voice_transcripts')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('conversation_order', { ascending: true });

      if (transcriptsError) {
        console.error('Error fetching transcripts:', transcriptsError);
        return NextResponse.json(
          { error: 'Failed to fetch transcripts' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session,
        transcripts: transcripts || []
      });
    } else {
      // Get all sessions for user
      const { data: sessions, error: sessionsError } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          voice_transcripts(count)
        `)
        .eq('user_id', user.id)
        .order('session_start', { ascending: false })
        .limit(limit);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return NextResponse.json(
          { error: 'Failed to fetch sessions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        sessions: sessions || []
      });
    }

  } catch (error: any) {
    console.error('❌ Error fetching voice sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Delete session (transcripts will be deleted by CASCADE)
    const { error: deleteError } = await supabase
      .from('interview_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting voice session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}