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

    // Validate file type and size
    const supportedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    const fileType = audioFile.type.split(';')[0] || 'unknown'; // Remove codec info like 'audio/webm;codecs=opus'
    
    if (!fileType.startsWith('audio/') && !supportedTypes.some(type => fileType === type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${fileType}. Supported types: ${supportedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check file size (Groq has a 25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Check minimum file size (avoid empty files)
    if (audioFile.size < 100) {
      return NextResponse.json(
        { error: 'File too small. Please provide a valid audio recording.' },
        { status: 400 }
      );
    }

    console.log('🎤 Processing speech-to-text request:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
    });

    // Convert File to ArrayBuffer and then to File for Groq API
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Create a proper filename with supported extension
    let fileName = audioFile.name;
    let mimeType: string = fileType;
    
    if (!fileName.includes('.')) {
      // Add extension based on MIME type
      if (fileType.includes('webm')) {
        fileName += '.webm';
        mimeType = 'audio/webm';
      } else if (fileType.includes('wav')) {
        fileName += '.wav';
        mimeType = 'audio/wav';
      } else if (fileType.includes('mp3') || fileType.includes('mpeg')) {
        fileName += '.mp3';
        mimeType = 'audio/mpeg';
      } else if (fileType.includes('mp4')) {
        fileName += '.mp4';
        mimeType = 'audio/mp4';
      } else if (fileType.includes('ogg')) {
        fileName += '.ogg';
        mimeType = 'audio/ogg';
      } else {
        fileName += '.wav';
        mimeType = 'audio/wav';
      }
    }

    console.log('📁 Prepared file for Groq:', {
      fileName,
      mimeType,
      originalType: audioFile.type,
      size: audioBuffer.byteLength
    });

    // Call Groq Whisper API - WebM is officially supported according to docs
    let transcription: any = null;
    
    // Try whisper-large-v3 first (recommended), then fallback to distil
    const models = ['whisper-large-v3', 'distil-whisper-large-v3-en'];
    
    for (const model of models) {
      try {
        console.log(`🔄 Trying model: ${model}`);
        
        // Create file with clean MIME type (remove codec info)
        const cleanMimeType = mimeType.split(';')[0] || 'audio/webm';
        
        transcription = await groq.audio.transcriptions.create({
          file: new File([audioBuffer], fileName, { type: cleanMimeType }),
          model: model,
          language: 'en',
          response_format: 'json',
          temperature: 0.0,
        });
        
        console.log(`✅ Success with model: ${model}`);
        break;
        
      } catch (modelError: any) {
        console.log(`❌ Model ${model} failed:`, modelError.message);
        
        // If this is the last model, we'll handle the error below
        if (model === models[models.length - 1]) {
          console.log('❌ All models failed, will throw error');
          throw modelError;
        }
      }
    }

    if (!transcription) {
      throw new Error('All transcription models failed');
    }

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
