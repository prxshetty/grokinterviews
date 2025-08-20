import { NextRequest, NextResponse } from 'next/server';
import { VAPI_CONFIG, VAPI_ENDPOINTS } from '@/config/vapi.config';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.VAPI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'VAPI API key not configured' },
        { status: 500 }
      );
    }

    if (!VAPI_CONFIG.defaultAssistant.assistantId) {
      return NextResponse.json(
        { error: 'VAPI Assistant ID not configured' },
        { status: 500 }
      );
    }

    if (!VAPI_CONFIG.phoneNumber.phoneNumberId) {
      return NextResponse.json(
        { error: 'VAPI Phone Number ID not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { phoneNumber, userContext } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate and format phone number to E.164 format
    const cleanPhoneNumber = validateAndFormatPhoneNumber(phoneNumber);

    const requestBody = {
      assistantId: VAPI_CONFIG.defaultAssistant.assistantId,
      phoneNumberId: VAPI_CONFIG.phoneNumber.phoneNumberId,
      customer: {
        number: cleanPhoneNumber,
        name: userContext?.userName || 'Interview Candidate'
      },
      assistantOverrides: {
        variableValues: {
          userId: userContext?.userId,
          sessionId: userContext?.sessionId,
          userName: userContext?.userName
        },
        firstMessage: `Hello ${userContext?.userName || 'there'}! This is your behavioral interview assistant. I'm here to help you practice for your upcoming interviews. Are you ready to begin?`
      }
    };

    const response = await fetch(`${VAPI_CONFIG.baseUrl}${VAPI_ENDPOINTS.calls}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `HTTP error! status: ${response.status}` },
        { status: response.status }
      );
    }

    const call = await response.json();

    return NextResponse.json({
      success: true,
      call: {
        ...call,
        // Ensure monitor object is included for call control
        monitor: call.monitor
      }
    });

  } catch (error) {
    console.error('Error creating outbound call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const apiKey = process.env.VAPI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'VAPI API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this call
    const { data: phoneCall, error: dbError } = await supabase
      .from('phone_calls')
      .select('id')
      .eq('vapi_call_id', callId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !phoneCall) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    const response = await fetch(`${VAPI_CONFIG.baseUrl}${VAPI_ENDPOINTS.calls}/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 404 specifically - call might have ended or been cancelled
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: true, 
            call: null,
            error: 'Call not found - likely ended or cancelled externally'
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.message || `HTTP error! status: ${response.status}` },
        { status: response.status }
      );
    }

    const call = await response.json();

    return NextResponse.json({
      success: true,
      call
    });

  } catch (error) {
    console.error('Error getting call status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const apiKey = process.env.VAPI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'VAPI API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this call
    const { data: phoneCall, error: dbError } = await supabase
      .from('phone_calls')
      .select('id')
      .eq('vapi_call_id', callId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !phoneCall) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    // First, get the call details to obtain the controlUrl
    const getCallResponse = await fetch(`${VAPI_CONFIG.baseUrl}${VAPI_ENDPOINTS.calls}/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getCallResponse.ok) {
      const errorData = await getCallResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `Failed to get call details: ${getCallResponse.status}` },
        { status: getCallResponse.status }
      );
    }

    const call = await getCallResponse.json();

    // Check if the call is still active and has a controlUrl
    if (!call.monitor?.controlUrl) {
      return NextResponse.json(
        { error: 'Call is not active or controlUrl not available' },
        { status: 400 }
      );
    }

    // Use the controlUrl to end the call
    const endCallResponse = await fetch(call.monitor.controlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'end-call'
      }),
    });

    if (!endCallResponse.ok) {
      const errorData = await endCallResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `Failed to end call: ${endCallResponse.status}` },
        { status: endCallResponse.status }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error ending call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

function validateAndFormatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid US number (10 digits) or international (starts with country code)
  if (digitsOnly.length === 10) {
    // US number, add +1 country code
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // US number with country code
    return `+${digitsOnly}`;
  } else if (digitsOnly.length > 7) {
    // International number
    return `+${digitsOnly}`;
  } else {
    throw new Error('Invalid phone number format. Please enter a valid phone number.');
  }
}