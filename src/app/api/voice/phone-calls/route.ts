import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build query with optional status filter
    let query = supabase
      .from('phone_calls')
      .select('*')
      .eq('user_id', userId);

    // Add status filter if provided
    if (status) {
      query = query.eq('call_status', status);
    }

    // Fetch phone call history from database
    const { data: calls, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching phone calls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch call history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ calls: calls || [] });

  } catch (error) {
    console.error('Error in phone-calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      vapiCallId,
      phoneNumber,
      callStatus = 'initiating',
      callDuration = 0,
      audioRecordingUrl,
      transcriptText,
      analysisSummary,
      interviewScore,
      strengths,
      weaknesses,
      recommendations,
      errorMessage,
      metadata = {}
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Save phone call to database
    const { data: call, error } = await supabase
      .from('phone_calls')
      .insert({
        user_id: userId,
        vapi_call_id: vapiCallId,
        phone_number: phoneNumber,
        call_status: callStatus,
        call_duration: callDuration,
        audio_recording_url: audioRecordingUrl,
        transcript_text: transcriptText,
        analysis_summary: analysisSummary,
        interview_score: interviewScore,
        strengths,
        weaknesses,
        recommendations,
        error_message: errorMessage,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving phone call:', error);
      return NextResponse.json(
        { error: 'Failed to save call data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ call });

  } catch (error) {
    console.error('Error in phone-calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vapiCallId,
      callStatus,
      callDuration,
      audioRecordingUrl,
      transcriptText,
      analysisSummary,
      interviewScore,
      strengths,
      weaknesses,
      recommendations,
      errorMessage,
      metadata
    } = body;

    if (!vapiCallId) {
      return NextResponse.json(
        { error: 'VAPI Call ID is required' },
        { status: 400 }
      );
    }

    // Update phone call in database
    const { data: call, error } = await supabase
      .from('phone_calls')
      .update({
        call_status: callStatus,
        call_duration: callDuration,
        audio_recording_url: audioRecordingUrl,
        transcript_text: transcriptText,
        analysis_summary: analysisSummary,
        interview_score: interviewScore,
        strengths,
        weaknesses,
        recommendations,
        error_message: errorMessage,
        metadata
      })
      .eq('vapi_call_id', vapiCallId)
      .select()
      .single();

    if (error) {
      console.error('Error updating phone call:', error);
      return NextResponse.json(
        { error: 'Failed to update call data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ call });

  } catch (error) {
    console.error('Error in phone-calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}