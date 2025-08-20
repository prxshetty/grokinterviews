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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Build query for user's phone calls from database (RLS automatically filters by user_id)
    let query = supabase
      .from('phone_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (callStatus) {
      query = query.eq('call_status', callStatus);
    }

    const { data: dbCalls, error: dbError, count } = await query;

    if (dbError) {
      console.error('❌ Database query error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch call records' },
        { status: 500 }
      );
    }

    // Transform database calls and enrich with VAPI data
    const enhancedCalls: TranscriptHistoryItem[] = await Promise.all(
      (dbCalls || []).map(async (dbCall) => {
        // Start with database data
        const result: TranscriptHistoryItem = {
          id: dbCall.id,
          phoneNumber: dbCall.phone_number,
          callStatus: dbCall.call_status,
          callDuration: dbCall.call_duration,
          vapiCallId: dbCall.vapi_call_id,
          audioRecordingUrl: dbCall.audio_recording_url,
          transcriptText: dbCall.transcript_text,
          analysisSummary: dbCall.analysis_summary,
          interviewScore: dbCall.interview_score,
          strengths: dbCall.strengths,
          weaknesses: dbCall.weaknesses,
          recommendations: dbCall.recommendations,
          createdAt: dbCall.created_at,
          updatedAt: dbCall.updated_at,
          voiceName: 'Emily' // Default for phone calls
        };

        // Enrich with VAPI data if vapi_call_id exists
        if (dbCall.vapi_call_id) {
          try {
            const vapiData = await fetchVapiCallDetails(dbCall.vapi_call_id);
            if (vapiData) {
              // Update with VAPI data while preserving database data
              if (vapiData.artifact?.recordingUrl && !result.audioRecordingUrl) {
                result.audioRecordingUrl = vapiData.artifact.recordingUrl;
              }
              
              // Extract conversation flow from VAPI messages
              if (vapiData.messages) {
                result.conversationFlow = vapiData.messages.map((msg, index) => ({
                  id: `${dbCall.vapi_call_id}-${index}`,
                  interactionType: msg.role,
                  transcriptText: msg.message,
                  conversationOrder: index,
                  createdAt: new Date(msg.time * 1000).toISOString()
                }));
              }

              // Add VAPI-specific data
               const vapiDataObj: any = {
                 messages: vapiData.messages || []
               };
               if (vapiData.cost !== undefined) vapiDataObj.cost = vapiData.cost;
               if (vapiData.endedReason) vapiDataObj.endedReason = vapiData.endedReason;
               if (vapiData.analysis) vapiDataObj.analysis = vapiData.analysis;
               
               result.vapiData = vapiDataObj;
            }
          } catch (vapiError) {
            console.warn(`⚠️ Failed to fetch VAPI data for call ${dbCall.vapi_call_id}:`, vapiError);
            // Continue without VAPI data - database data is still valid
          }
        }

        return result;
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

async function fetchVapiCallsList(limit: number = 10, page: number = 1): Promise<VapiCall[]> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error('VAPI API key not configured');
  }

  // VAPI uses limit and offset for pagination
  const offset = (page - 1) * limit;
  const url = new URL(`https://api.vapi.ai/call`);
  url.searchParams.set('limit', limit.toString());
  if (offset > 0) {
    url.searchParams.set('offset', offset.toString());
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('VAPI API error details:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`VAPI API error: ${response.status} - ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  
  // VAPI returns calls in a data array or directly as an array
  return Array.isArray(data) ? data : (data.data || []);
}

async function fetchVapiCallDetails(callId: string): Promise<VapiCall | null> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error('VAPI API key not configured');
  }

  const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Call not found in VAPI
    }
    const errorData = await response.json().catch(() => ({}));
    console.error('VAPI API error details:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`VAPI API error: ${response.status} - ${errorData.message || response.statusText}`);
  }

  return await response.json();
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
