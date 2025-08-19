import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit, createRateLimitResponse } from '@/utils/rateLimiting';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Authenticate user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User fetch Error:', userError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user) {
      console.log('No user found from auth');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

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
  const supabase = await createClient();
  
  try {
    // Authenticate user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User fetch Error:', userError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user) {
      console.log('No user found from auth');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const userId = user.id;
    
    const body = await request.json();
    const {
      vapi_call_id,
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
      metadata = {},
      checkRateLimitOnly = false
    } = body;

    // Handle rate limit check requests
    if (checkRateLimitOnly) {
      // Check rate limit for phone interviews
      const rateLimitResult = await checkRateLimit('phone', userId);
      
      if (!rateLimitResult.isAllowed) {
        return createRateLimitResponse(rateLimitResult);
      }

      return NextResponse.json({ 
        allowed: true,
        remainingAttempts: rateLimitResult.remainingAttempts 
      });
    }

    // Validate vapi_call_id if provided (required for tracking)
    if (vapi_call_id && typeof vapi_call_id !== 'string') {
      return NextResponse.json(
        { error: 'VAPI Call ID must be a string' },
        { status: 400 }
      );
    }

    // Validate phoneNumber format if provided
    if (phoneNumber && typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'Phone number must be a string' },
        { status: 400 }
      );
    }

    // Check rate limit for phone interviews (for actual calls, not just checks)
    const rateLimitResult = await checkRateLimit('phone', userId);
    
    if (!rateLimitResult.isAllowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Check for existing call with same vapi_call_id to prevent duplicates
    if (vapi_call_id) {
      const { data: existingCall } = await supabase
        .from('phone_calls')
        .select('id')
        .eq('vapi_call_id', vapi_call_id)
        .single();
      
      if (existingCall) {
        return NextResponse.json({ 
          error: 'Call with this ID already exists',
          callId: existingCall.id 
        }, { status: 409 });
      }
    }

    // Insert new phone call record
    const { data, error } = await supabase
      .from('phone_calls')
      .insert({
        user_id: userId,
        vapi_call_id: vapi_call_id,
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
        metadata,
        voice_name: 'Emily' // Default voice for phone calls
      })
      .select();

    if (error) {
      console.error('Error saving phone call:', error);
      return NextResponse.json(
        { error: 'Failed to save call data', details: error.message },
        { status: 500 }
      );
    }

    // Handle case where no data is returned
    if (!data || data.length === 0) {
      console.error('No data returned after insert');
      return NextResponse.json(
        { error: 'Failed to save call data - no data returned' },
        { status: 500 }
      );
    }

    const call = data[0];
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
    const supabase = await createClient();
    
    // Authenticate user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User fetch Error:', userError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user) {
      console.log('No user found from auth');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const userId = user.id;
    const body = await request.json();
    const {
      vapi_call_id,
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

    if (!vapi_call_id) {
      return NextResponse.json(
        { error: 'VAPI Call ID is required' },
        { status: 400 }
      );
    }

    // Update phone call in database (with user_id check for security)
    const { data: callData, error } = await supabase
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
        metadata,
        voice_name: 'Emily' // Ensure voice_name is set for phone calls
      })
      .eq('vapi_call_id', vapi_call_id)
      .eq('user_id', userId) // Ensure user can only update their own calls
      .select();

    if (error) {
      console.error('Error updating phone call:', error);
      return NextResponse.json(
        { error: 'Failed to update call data', details: error.message },
        { status: 500 }
      );
    }

    // Handle case where no record was found to update
    if (!callData || callData.length === 0) {
      return NextResponse.json(
        { error: 'Phone call not found', details: `No call found with vapi_call_id: ${vapi_call_id}` },
        { status: 404 }
      );
    }

    // Handle case where multiple records were updated (shouldn't happen with unique constraint)
    if (callData.length > 1) {
      console.warn(`Multiple records updated for vapi_call_id: ${vapi_call_id}`, callData);
    }

    const call = callData[0];
    return NextResponse.json({ call });

  } catch (error) {
    console.error('Error in phone-calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}