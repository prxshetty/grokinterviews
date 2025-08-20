import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const callId = resolvedParams.id;
    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this call by checking the phone_calls table
    const { data: phoneCall, error: phoneCallError } = await supabase
      .from('phone_calls')
      .select('id, user_id')
      .eq('vapi_call_id', callId)
      .eq('user_id', user.id)
      .single();

    if (phoneCallError || !phoneCall) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    // Get VAPI API key
    const vapiApiKey = process.env.VAPI_API_KEY;
    if (!vapiApiKey) {
      return NextResponse.json(
        { error: 'VAPI API key not configured' },
        { status: 500 }
      );
    }

    // Fetch call data from VAPI API
    const vapiResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!vapiResponse.ok) {
      if (vapiResponse.status === 404) {
        return NextResponse.json(
          { error: 'Call not found' },
          { status: 404 }
        );
      }
      
      const errorText = await vapiResponse.text();
      console.error('VAPI API error:', {
        status: vapiResponse.status,
        statusText: vapiResponse.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { error: `VAPI API error: ${vapiResponse.status}` },
        { status: 500 }
      );
    }

    const callData = await vapiResponse.json();
    
    // Return complete artifacts data
    const artifacts = {
      ...callData.artifact,
      // Ensure we have the new recording structure
      recording: callData.artifact?.recording || {
        stereoUrl: callData.artifact?.stereoRecordingUrl,
        videoUrl: callData.artifact?.videoRecordingUrl,
        mono: {
          combinedUrl: callData.artifact?.recordingUrl,
          assistantUrl: undefined,
          customerUrl: undefined,
        },
      },
    };

    return NextResponse.json({
      artifacts,
      callId,
      status: callData.status,
      startedAt: callData.startedAt,
      endedAt: callData.endedAt,
      cost: callData.cost,
      endedReason: callData.endedReason,
    });

  } catch (error) {
    console.error('Error fetching call artifacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}