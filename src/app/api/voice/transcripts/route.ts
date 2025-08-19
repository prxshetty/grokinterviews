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

    // Fetch calls directly from VAPI
    const vapiCalls = await fetchVapiCallsList(limit, page);
    
    // Transform VAPI calls to our expected format
    const enhancedCalls: TranscriptHistoryItem[] = vapiCalls.map((call: VapiCall) => {
      // Extract transcript from messages or artifact
      const transcript = call.artifact?.transcript || 
        call.messages?.map(msg => `${msg.role}: ${msg.message}`).join('\n') || '';
      
      // Extract conversation flow from messages
      const conversationFlow = call.messages?.map((msg, index) => ({
        id: `${call.id}-${index}`,
        interactionType: msg.role,
        transcriptText: msg.message,
        conversationOrder: index,
        createdAt: new Date(msg.time * 1000).toISOString()
      })) || [];

      // Calculate call duration
       const callDuration = call.startedAt && call.endedAt 
         ? Math.floor((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
         : undefined;

       // Extract analysis data
       const analysis = call.analysis;
       const structuredData = analysis?.structuredData || {};

       // Build vapiData object with only defined properties
        const vapiData: any = {
          messages: call.messages || []
        };
        if (call.cost !== undefined) vapiData.cost = call.cost;
        if (call.endedReason) vapiData.endedReason = call.endedReason;
        if (call.analysis) vapiData.analysis = call.analysis;

        const result: TranscriptHistoryItem = {
          id: call.id,
          phoneNumber: 'N/A', // VAPI doesn't expose phone numbers in list calls
          callStatus: call.status,
          vapiCallId: call.id,
          transcriptText: transcript,
          createdAt: call.startedAt || new Date().toISOString(),
          vapiData,
          conversationFlow
        };

       // Add optional properties only if they have values
       if (callDuration !== undefined) result.callDuration = callDuration;
       if (call.artifact?.recordingUrl) result.audioRecordingUrl = call.artifact.recordingUrl;
       if (analysis?.summary) result.analysisSummary = analysis.summary;
       if (structuredData.interviewScore) result.interviewScore = structuredData.interviewScore;
       if (structuredData.strengths?.length) result.strengths = structuredData.strengths;
       if (structuredData.weaknesses?.length) result.weaknesses = structuredData.weaknesses;
       if (structuredData.recommendations?.length) result.recommendations = structuredData.recommendations;
       if (call.endedAt) result.updatedAt = call.endedAt;
       // Set voice name - use from structured data if available, otherwise default to Emily for phone calls
       result.voiceName = structuredData.voiceName || 'Emily';

       return result;
    });

    // Apply status filter if provided
    const filteredCalls = callStatus 
      ? enhancedCalls.filter(call => call.callStatus === callStatus)
      : enhancedCalls;

    return NextResponse.json({
      success: true,
      data: filteredCalls,
      pagination: {
        page,
        limit,
        total: filteredCalls.length,
        totalPages: Math.ceil(filteredCalls.length / limit)
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
