import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// VAPI webhook event types
interface VapiWebhookEvent {
  type: 'call-start' | 'call-end' | 'call-update' | 'transcript' | 'function-call' | 'hang' | 'speech-start' | 'speech-end';
  call: {
    id: string;
    status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
    type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
    phoneCallProvider?: 'twilio' | 'vonage' | 'vapi';
    phoneCallTransport?: 'pstn' | 'sip';
    startedAt?: string;
    endedAt?: string;
    cost?: number;
    endedReason?: string;
    messages?: Array<{
      role: 'assistant' | 'user' | 'system' | 'function';
      message: string;
      time: number;
      endTime?: number;
      secondsFromStart: number;
      duration?: number;
    }>;
    analysis?: {
      summary?: string;
      structuredData?: Record<string, any>;
      successEvaluation?: string;
    };
    artifact?: {
      messages?: any[];
      recordingUrl?: string;
      transcript?: string;
      videoRecordingUrl?: string;
    };
  };
  message?: {
    role: 'assistant' | 'user' | 'system' | 'function';
    message: string;
    time: number;
    endTime?: number;
    secondsFromStart: number;
    duration?: number;
  };
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const event: VapiWebhookEvent = await request.json();
    
    console.log('VAPI Webhook Event:', event.type, event.call.id);

    // Handle different event types
    switch (event.type) {
      case 'call-start':
        await handleCallStart(event);
        break;
      case 'call-end':
        await handleCallEnd(event);
        break;
      case 'call-update':
        await handleCallUpdate(event);
        break;
      case 'transcript':
        await handleTranscript(event);
        break;
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing VAPI webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleCallStart(event: VapiWebhookEvent) {
  try {
    const { call } = event;
    
    // Update call status to in-progress
    const { error } = await supabase
      .from('phone_calls')
      .update({
        call_status: 'in-progress',
        metadata: {
          startedAt: call.startedAt,
          vapiStatus: call.status,
          callType: call.type,
          provider: call.phoneCallProvider,
          transport: call.phoneCallTransport
        }
      })
      .eq('vapi_call_id', call.id);

    if (error) {
      console.error('Error updating call start:', error);
    }
  } catch (error) {
    console.error('Error handling call start:', error);
  }
}

async function handleCallEnd(event: VapiWebhookEvent) {
  try {
    const { call } = event;
    
    // Calculate duration if we have start and end times
    let duration = 0;
    if (call.startedAt && call.endedAt) {
      const startTime = new Date(call.startedAt).getTime();
      const endTime = new Date(call.endedAt).getTime();
      duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds
    }

    // Extract transcript from messages
    let transcript = '';
    if (call.messages && call.messages.length > 0) {
      transcript = call.messages
        .map(msg => `${msg.role}: ${msg.message}`)
        .join('\n');
    }

    // Extract transcript from artifact if available
    if (call.artifact?.transcript) {
      transcript = call.artifact.transcript;
    }

    // Update call with final data
    const { error } = await supabase
      .from('phone_calls')
      .update({
        call_status: 'ended',
        call_duration: duration,
        audio_recording_url: call.artifact?.recordingUrl,
        transcript_text: transcript,
        analysis_summary: call.analysis?.summary,
        metadata: {
          endedAt: call.endedAt,
          endedReason: call.endedReason,
          cost: call.cost,
          vapiStatus: call.status,
          analysis: call.analysis,
          messageCount: call.messages?.length || 0
        }
      })
      .eq('vapi_call_id', call.id);

    if (error) {
      console.error('Error updating call end:', error);
    }
  } catch (error) {
    console.error('Error handling call end:', error);
  }
}

async function handleCallUpdate(event: VapiWebhookEvent) {
  try {
    const { call } = event;
    
    // Update call status
    const { error } = await supabase
      .from('phone_calls')
      .update({
        call_status: call.status === 'in-progress' ? 'in-progress' : 
                    call.status === 'ringing' ? 'ringing' : 
                    call.status === 'ended' ? 'ended' : 'idle',
        metadata: {
          vapiStatus: call.status,
          lastUpdate: event.timestamp
        }
      })
      .eq('vapi_call_id', call.id);

    if (error) {
      console.error('Error updating call status:', error);
    }
  } catch (error) {
    console.error('Error handling call update:', error);
  }
}

async function handleTranscript(event: VapiWebhookEvent) {
  try {
    const { call, message } = event;
    
    if (!message) return;

    // Get current transcript
    const { data: currentCall } = await supabase
      .from('phone_calls')
      .select('transcript_text')
      .eq('vapi_call_id', call.id)
      .single();

    // Append new message to transcript
    const currentTranscript = currentCall?.transcript_text || '';
    const newTranscript = currentTranscript + 
      (currentTranscript ? '\n' : '') + 
      `${message.role}: ${message.message}`;

    // Update transcript
    const { error } = await supabase
      .from('phone_calls')
      .update({
        transcript_text: newTranscript
      })
      .eq('vapi_call_id', call.id);

    if (error) {
      console.error('Error updating transcript:', error);
    }
  } catch (error) {
    console.error('Error handling transcript:', error);
  }
}