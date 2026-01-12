import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Voice mapping from internal names to OpenAI TTS voices
const VOICE_MAP: Record<string, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
  'Sophia': 'nova',      // Female, warm
  'Marcus': 'onyx',      // Male, deep
  'Aoede': 'shimmer',    // Female, expressive
  'Algieba': 'echo',     // Male, clear
  'Emily': 'alloy',      // Female, neutral
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'Marcus', apiKey } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Please configure your OpenAI API key in Account Settings.', requires_ai_config: true },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum length is 4096 characters.' },
        { status: 400 }
      );
    }

    // Map internal voice to OpenAI voice
    const openaiVoice = VOICE_MAP[voice] || 'onyx';



    const openai = new OpenAI({ apiKey });

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: openaiVoice,
      input: text,
      response_format: 'mp3',
    });

    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());



    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: unknown) {
    console.error('TTS Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('invalid_api_key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your OpenAI API key in Account Settings.', type: 'auth_error' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.', type: 'rate_limit' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal error during speech synthesis', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit text.' },
    { status: 405 }
  );
}
