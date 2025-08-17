import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

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

    // Fetch interview score with session details
    const { data: scoreData, error: scoreError } = await supabase
      .from('interview_scores')
      .select(`
        *,
        interview_sessions!inner(
          id,
          user_id,
          session_type,
          session_start,
          session_end,
          question_count,
          is_completed
        )
      `)
      .eq('session_id', sessionId)
      .eq('interview_sessions.user_id', user.id)
      .single();

    if (scoreError || !scoreData) {
      return NextResponse.json(
        { error: 'Interview score not found or not accessible' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      score: {
        overall_score: scoreData.overall_score,
        strengths: scoreData.strengths,
        weaknesses: scoreData.weaknesses,
        improvements: scoreData.improvements,
        detailed_feedback: scoreData.detailed_feedback,
        created_at: scoreData.created_at
      },
      session: {
        id: scoreData.interview_sessions.id,
        session_type: scoreData.interview_sessions.session_type,
        session_start: scoreData.interview_sessions.session_start,
        session_end: scoreData.interview_sessions.session_end,
        question_count: scoreData.interview_sessions.question_count
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching interview score:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Get user's interview history with scores
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's completed interviews with scores
    const { data: interviews, error } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        session_type,
        session_start,
        session_end,
        question_count,
        week_identifier,
        interview_scores(
          overall_score,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .order('session_start', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      interviews: interviews || []
    });

  } catch (error: any) {
    console.error('❌ Error fetching interview history:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}