import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { mapVoiceToCloudTTS, getVoiceGender, CLOUD_TTS_AUDIO_CONFIG } from '@/utils/audioUtils';

// Initialize Google Cloud Text-to-Speech client
const ttsClient = new TextToSpeechClient({
  // Authentication will be handled by environment variables:
  // GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT + service account key
  ...(process.env.GOOGLE_CLOUD_PROJECT_ID && { projectId: process.env.GOOGLE_CLOUD_PROJECT_ID }),
  ...(process.env.GOOGLE_APPLICATION_CREDENTIALS && { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS }),
  // Alternative: use API key if available
  ...(process.env.GOOGLE_CLOUD_API_KEY && {
    apiKey: process.env.GOOGLE_CLOUD_API_KEY
  })
});

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'Fritz-PlayAI' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided for speech synthesis' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' },
        { status: 400 }
      );
    }

    // Map voice to Google Cloud TTS voice name
    const cloudTTSVoice = mapVoiceToCloudTTS(voice);
    const voiceGender = getVoiceGender(cloudTTSVoice);
    
    console.log('🔊 Processing text-to-speech request:', {
      textLength: text.length,
      originalVoice: voice,
      cloudTTSVoice: cloudTTSVoice,
      voiceGender: voiceGender,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    });

    // Prepare the request for Google Cloud TTS
    const request_payload = {
      input: { text: text },
      voice: {
        languageCode: cloudTTSVoice.startsWith('en-GB') ? 'en-GB' : 'en-US',
        name: cloudTTSVoice,
        ssmlGender: voiceGender,
      },
      audioConfig: {
        audioEncoding: CLOUD_TTS_AUDIO_CONFIG.FORMAT as any,
        sampleRateHertz: CLOUD_TTS_AUDIO_CONFIG.SAMPLE_RATE,
      },
    };

    // Call Google Cloud TTS API
    const [response] = await ttsClient.synthesizeSpeech(request_payload);

    console.log('✅ Google Cloud TTS response received');

    // Extract audio data from response
    const audioContent = response.audioContent;
    
    if (!audioContent) {
      throw new Error('No audio data received from Google Cloud TTS');
    }

    // Convert to Buffer if it's not already
    const audioBuffer = Buffer.isBuffer(audioContent) 
      ? audioContent 
      : Buffer.from(audioContent as Uint8Array);
    
    console.log('✅ Audio processing successful, size:', audioBuffer.length);

    // Return the audio as a response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('❌ Google Cloud TTS error:', error);

    // Handle specific Google Cloud API errors
    if (error.code === 'UNAUTHENTICATED' || error.message?.includes('authentication')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          details: 'Invalid or missing Google Cloud credentials',
          type: 'auth_error'
        },
        { status: 401 }
      );
    }
    
    if (error.code === 'RESOURCE_EXHAUSTED' || error.message?.includes('quota')) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          details: 'Please try again later',
          type: 'rate_limit_error'
        },
        { status: 429 }
      );
    }
    
    if (error.code === 'INVALID_ARGUMENT') {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters', 
          details: error.message,
          type: 'validation_error'
        },
        { status: 400 }
      );
    }

    if (error.code === 'UNAVAILABLE') {
      return NextResponse.json(
        { 
          error: 'TTS service unavailable', 
          details: 'Google Cloud TTS service is temporarily unavailable',
          type: 'service_error'
        },
        { status: 503 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error during speech synthesis',
        details: error.message,
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit text.' },
    { status: 405 }
  );
}
