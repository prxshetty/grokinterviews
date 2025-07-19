import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY,
});

// Groq voice options mapping
const GROQ_VOICE_OPTIONS: { [key: string]: string } = {
  // English voices
  'Arista': 'Arista-PlayAI',
  'Atlas': 'Atlas-PlayAI',
  'Basil': 'Basil-PlayAI',
  'Briggs': 'Briggs-PlayAI',
  'Calum': 'Calum-PlayAI',
  'Celeste': 'Celeste-PlayAI',
  'Cheyenne': 'Cheyenne-PlayAI',
  'Chip': 'Chip-PlayAI',
  'Cillian': 'Cillian-PlayAI',
  'Deedee': 'Deedee-PlayAI',
  'Fritz': 'Fritz-PlayAI',
  'Gail': 'Gail-PlayAI',
  'Indigo': 'Indigo-PlayAI',
  'Mamaw': 'Mamaw-PlayAI',
  'Mason': 'Mason-PlayAI',
  'Mikail': 'Mikail-PlayAI',
  'Mitch': 'Mitch-PlayAI',
  'Quinn': 'Quinn-PlayAI',
  'Thunder': 'Thunder-PlayAI',
  // Arabic voices
  'Ahmad': 'Ahmad-PlayAI',
  'Amira': 'Amira-PlayAI',
  'Khalid': 'Khalid-PlayAI',
  'Nasser': 'Nasser-PlayAI',
};

// Voice mapping for compatibility with existing app voices
const mapVoiceToGroq = (voiceName: string): string => {
  const voiceMapping: { [key: string]: string } = {
    // New voice mappings
    'Arista': 'Arista-PlayAI',
    'Atlas': 'Atlas-PlayAI',
    // Legacy compatibility mappings
    'Sophia': 'Celeste-PlayAI',
    'Kore': 'Fritz-PlayAI',
    'Emma': 'Cheyenne-PlayAI',
    'James': 'Atlas-PlayAI',
    'Oliver': 'Calum-PlayAI',
    'Ava': 'Gail-PlayAI',
  };

  return voiceMapping[voiceName] || GROQ_VOICE_OPTIONS[voiceName] || 'Arista-PlayAI';
};

export async function POST(request: NextRequest) {
  try {
    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY_0 && !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const { text, voice = 'Fritz', language = 'en' } = await request.json();

    // Validate input
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }

    // Map voice to Groq voice format using compatibility mapping
    const groqVoice = mapVoiceToGroq(voice);
    
    // Determine model based on language
    const model = language === 'ar' ? 'playai-tts-arabic' : 'playai-tts';

    try {
      // Generate speech using Groq TTS
      const response = await groq.audio.speech.create({
        model: model,
        voice: groqVoice,
        input: text,
        response_format: 'wav'
      });

      // Convert response to buffer
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    } catch (groqError: any) {
      console.error('Groq TTS error:', groqError);
      
      // Handle specific Groq API errors
      if (groqError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Groq API key' },
          { status: 401 }
        );
      }
      
      if (groqError.status === 429) {
        return NextResponse.json(
          { error: 'Groq API rate limit exceeded' },
          { status: 429 }
        );
      }
      
      if (groqError.status === 400) {
        return NextResponse.json(
          { error: 'Invalid request to Groq API' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Groq TTS service error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('TTS Groq route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available voices
export async function GET() {
  return NextResponse.json({
    provider: 'Groq',
    models: {
      english: 'playai-tts',
      arabic: 'playai-tts-arabic'
    },
    voices: Object.keys(GROQ_VOICE_OPTIONS),
    voiceMapping: GROQ_VOICE_OPTIONS,
    compatibilityMapping: {
      // New voice mappings
      'Arista': 'Arista-PlayAI',
      'Atlas': 'Atlas-PlayAI',
      // Legacy compatibility mappings
      'Sophia': 'Celeste-PlayAI',
      'Kore': 'Fritz-PlayAI',
      'Emma': 'Cheyenne-PlayAI',
      'James': 'Atlas-PlayAI',
      'Oliver': 'Calum-PlayAI',
      'Ava': 'Gail-PlayAI',
    },
    defaultVoice: 'Arista-PlayAI',
    maxTextLength: 10000
  });
}