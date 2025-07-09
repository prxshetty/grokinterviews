import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_0 || process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please provide an audio file.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for Groq API
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    console.log('🎤 Processing speech-to-text request:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
    });

    // Call Groq Whisper API for speech-to-text
    const transcription = await groq.audio.transcriptions.create({
      file: new File([audioBuffer], audioFile.name, { type: audioFile.type }),
      model: 'distil-whisper-large-v3-en',
      language: 'en',
      response_format: 'json',
      temperature: 0.0, // For more consistent transcription
    });

    console.log('✅ Transcription successful:', {
      text: transcription.text,
    });

    return NextResponse.json({
      success: true,
      text: transcription.text,
    });

  } catch (error: any) {
    console.error('❌ Speech-to-text error:', error);

    // Handle specific Groq API errors
    if (error instanceof Groq.APIError) {
      return NextResponse.json(
        { 
          error: 'Speech recognition failed', 
          details: error.message,
          type: 'groq_api_error'
        },
        { status: 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error during speech recognition',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit audio.' },
    { status: 405 }
  );
}
