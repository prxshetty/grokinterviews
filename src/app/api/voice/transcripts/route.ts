import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Types for VAPI API responses
interface VapiCall {
  id: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  endedReason?: string;
  messages?: VapiMessage[];
  analysis?: {
    summary?: string;
    structuredData?: Record<string, any>;
    successEvaluation?: string;
  };
  artifact?: {
    messages?: VapiMessage[];
    recordingUrl?: string;
    transcript?: string;
    videoRecordingUrl?: string;
  };
}

interface VapiMessage {
  role: 'assistant' | 'user' | 'system' | 'function';
  message: string;
  time: number;
  endTime?: number;
  secondsFromStart: number;
  duration?: number;
}

interface TranscriptHistoryItem {
  id: string;
  phoneNumber: string;
  callStatus: string;
  callDuration?: number;
  vapiCallId?: string;
  audioRecordingUrl?: string;
  transcriptText?: string;
  analysisSummary?: string;
  interviewScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  createdAt: string;
  updatedAt?: string;
  voiceName?: string | null;
  // Enhanced data from VAPI
  vapiData?: {
    messages?: VapiMessage[];
    cost?: number;
    endedReason?: string;
    analysis?: any;
  };
  // Conversation flow from voice_transcripts
  conversationFlow?: Array<{
    id: string;
    interactionType: string;
    transcriptText: string;
    conversationOrder: number;
    createdAt: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const callStatus = searchParams.get('status');
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build query for phone calls
    let query = supabase
      .from('phone_calls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (callStatus) {
      query = query.eq('call_status', callStatus);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: phoneCalls, error: phoneCallsError } = await query;

    if (phoneCallsError) {
      console.error('Error fetching phone calls:', phoneCallsError);
      return NextResponse.json(
        { error: 'Failed to fetch call history' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('phone_calls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error getting count:', countError);
    }

    // Enhance each call with transcript data and VAPI data
    const enhancedCalls: TranscriptHistoryItem[] = await Promise.all(
      phoneCalls.map(async (call) => {
        // Get conversation flow from voice_transcripts
        const { data: transcripts } = await supabase
          .from('voice_transcripts')
          .select('*')
          .eq('user_id', user.id)
          .eq('session_id', call.id)
          .order('conversation_order', { ascending: true });

        // Fetch additional data from VAPI if we have a call ID
        let vapiData = null;
        if (call.vapi_call_id) {
          try {
            vapiData = await fetchVapiCallData(call.vapi_call_id);
          } catch (error) {
            console.warn(`Failed to fetch VAPI data for call ${call.vapi_call_id}:`, error);
          }
        }

        return {
          id: call.id,
          phoneNumber: call.phone_number,
          callStatus: call.call_status,
          callDuration: call.call_duration,
          vapiCallId: call.vapi_call_id,
          audioRecordingUrl: call.audio_recording_url,
          transcriptText: call.transcript_text,
          analysisSummary: call.analysis_summary,
          interviewScore: call.interview_score,
          strengths: call.strengths,
          weaknesses: call.weaknesses,
          recommendations: call.recommendations,
          createdAt: call.created_at,
          updatedAt: call.updated_at,
          voiceName: null, // voice_name will be fetched from interview_sessions if linked
          vapiData,
          conversationFlow: transcripts || []
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enhancedCalls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ Transcript history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchVapiCallData(callId: string): Promise<any> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error('VAPI API key not configured');
  }

  const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`VAPI API error: ${response.status}`);
  }

  const callData: VapiCall = await response.json();
  
  return {
    messages: callData.messages || [],
    cost: callData.cost,
    endedReason: callData.endedReason,
    analysis: callData.analysis,
    artifact: callData.artifact
  };
}

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
        conversation_order: conversationOrder || 0
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
