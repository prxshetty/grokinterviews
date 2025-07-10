import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { convertPCMToWAV, mapVoiceToGemini, GEMINI_AUDIO_CONFIG } from '@/utils/audioUtils';

// Initialize Google GenAI client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
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

    if (text.length > 4000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 4000 characters allowed.' },
        { status: 400 }
      );
    }

    // Map voice to Gemini voice name
    const geminiVoice = mapVoiceToGemini(voice);
    
    console.log('🔊 Processing text-to-speech request:', {
      textLength: text.length,
      originalVoice: voice,
      geminiVoice: geminiVoice,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    });

    // Call Gemini TTS API
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: geminiVoice
            }
          }
        }
      }
    });

    console.log('✅ Gemini TTS response received');

    // Extract audio data from response
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data received from Gemini TTS');
    }

    // Convert base64 PCM to buffer
    const pcmBuffer = Buffer.from(audioData, 'base64');
    
    // Convert PCM to WAV format
    const audioBuffer = convertPCMToWAV(pcmBuffer, {
      sampleRate: GEMINI_AUDIO_CONFIG.SAMPLE_RATE,
      channels: GEMINI_AUDIO_CONFIG.CHANNELS,
      bitDepth: GEMINI_AUDIO_CONFIG.BIT_DEPTH
    });
    
    console.log('✅ Audio conversion successful, size:', audioBuffer.length);

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
    console.error('❌ Gemini TTS error:', error);

    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          details: 'Invalid or missing Gemini API key',
          type: 'auth_error'
        },
        { status: 401 }
      );
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          details: 'Please try again later',
          type: 'rate_limit_error'
        },
        { status: 429 }
      );
    }
    
    if (error.message?.includes('model not found') || error.message?.includes('gemini-2.5-flash-preview-tts')) {
      return NextResponse.json(
        { 
          error: 'TTS model unavailable', 
          details: 'Gemini TTS model is not available',
          type: 'model_error'
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
