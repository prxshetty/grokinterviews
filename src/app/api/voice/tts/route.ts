import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { mapVoiceToCloudTTS, getVoiceGender, CLOUD_TTS_AUDIO_CONFIG } from '@/utils/audioUtils';

// Initialize Google Cloud Text-to-Speech client with lazy initialization
let ttsClient: TextToSpeechClient | null = null;

function initializeTTSClient(): TextToSpeechClient {
  if (ttsClient) {
    return ttsClient;
  }

  // Validate required environment variables
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const projectId = process.env.GOOGLE_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Missing required Google Cloud credentials. Please set GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_PROJECT_ID environment variables.');
  }

  try {
    // Handle different private key formats that might exist in production
    let formattedPrivateKey = privateKey;
    
    // If the key doesn't start with -----BEGIN, it might be base64 encoded
    if (!privateKey.includes('-----BEGIN')) {
      try {
        formattedPrivateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      } catch {
        // If base64 decoding fails, use the key as-is
        formattedPrivateKey = privateKey;
      }
    }
    
    // Ensure proper line breaks in private key
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
    
    // Validate private key format
    if (!formattedPrivateKey.includes('-----BEGIN') || !formattedPrivateKey.includes('-----END')) {
      throw new Error('Invalid private key format');
    }

    ttsClient = new TextToSpeechClient({
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
      },
      projectId: projectId,
    });

    return ttsClient;
  } catch (error: any) {
    console.error('Failed to initialize Google Cloud TTS client:', error);
    throw new Error(`Failed to initialize Google Cloud TTS client: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { text, voice = 'Marcus' } = body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum length is 5000 characters.' },
        { status: 400 }
      );
    }

    // Initialize TTS client with error handling
    let client: TextToSpeechClient;
    try {
      client = initializeTTSClient();
    } catch (error: any) {
      console.error('TTS client initialization failed:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Map voice to Google Cloud TTS voice
    const cloudVoice = mapVoiceToCloudTTS(voice);
    const voiceGender = getVoiceGender(cloudVoice);

    // Prepare the synthesis request
    const request_config = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: cloudVoice,
        ssmlGender: voiceGender,
      },
      audioConfig: {
        audioEncoding: 'LINEAR16' as const,
        sampleRateHertz: CLOUD_TTS_AUDIO_CONFIG.SAMPLE_RATE,
      },
    };

    // Perform the text-to-speech request with timeout
    const synthesizePromise = client.synthesizeSpeech(request_config);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });

    const [response] = await Promise.race([synthesizePromise, timeoutPromise]) as any;

    if (!response || !response.audioContent) {
      console.error('No audio content received from Google Cloud TTS');
      return NextResponse.json(
        { error: 'Failed to generate audio content' },
        { status: 500 }
      );
    }

    // Convert the audio content to a Buffer
    const audioBuffer = Buffer.from(response.audioContent);
    
    // Return the audio as a response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error: any) {
    console.error('TTS Error:', error);
    
    // Handle specific Google Cloud errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Network connectivity issue. Please try again later.' },
        { status: 503 }
      );
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return NextResponse.json(
        { error: 'Service quota exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    if (error.message?.includes('authentication') || error.message?.includes('credentials')) {
      return NextResponse.json(
        { error: 'Authentication error. Please contact support.' },
        { status: 401 }
      );
    }

    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout. Please try again with shorter text.' },
        { status: 408 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal error during speech synthesis' },
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
