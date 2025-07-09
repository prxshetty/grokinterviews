import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_0 || process.env.GROQ_API_KEY,
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

    console.log('🔊 Processing text-to-speech request:', {
      textLength: text.length,
      voice: voice,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    });

    // Call Groq TTS API
    const audioResponse = await groq.audio.speech.create({
      model: 'playai-tts',
      input: text,
      voice: voice, // Use Groq PlayAI voice names
      response_format: 'wav', // Groq TTS uses wav format
    });

    console.log('✅ Text-to-speech successful');

    // Convert the response to a buffer
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

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
    console.error('❌ Text-to-speech error:', error);

    // Handle specific Groq API errors
    if (error instanceof Groq.APIError) {
      return NextResponse.json(
        { 
          error: 'Speech synthesis failed', 
          details: error.message,
          type: 'groq_api_error'
        },
        { status: 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error during speech synthesis',
        details: error.message 
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
