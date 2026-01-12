import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Audio file validation function
function validateAudioFile(uint8Array: Uint8Array, fileType: string): boolean {
  if (uint8Array.length < 16) {
    return false;
  }

  const header = Array.from(uint8Array.slice(0, 16));

  // WebM files start with 0x1A 0x45 0xDF 0xA3
  if (fileType.includes('webm')) {
    return header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3;
  }

  // WAV files start with "RIFF" and have "WAVE" at offset 8
  if (fileType.includes('wav')) {
    return header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 && // RIFF
      header[8] === 0x57 && header[9] === 0x41 && header[10] === 0x56 && header[11] === 0x45; // WAVE
  }

  // MP3 files start with ID3 tag (0x49 0x44 0x33) or MP3 frame sync (0xFF 0xFB or 0xFF 0xFA)
  if (fileType.includes('mp3') || fileType.includes('mpeg')) {
    return (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || // ID3
      (header[0] === 0xFF && (header[1] === 0xFB || header[1] === 0xFA)); // MP3 frame
  }

  // MP4 files have "ftyp" at offset 4
  if (fileType.includes('mp4')) {
    return header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70; // ftyp
  }

  // OGG files start with "OggS"
  if (fileType.includes('ogg')) {
    return header[0] === 0x4F && header[1] === 0x67 && header[2] === 0x67 && header[3] === 0x53; // OggS
  }

  // If we can't validate the specific format, do a basic check for non-zero data
  const nonZeroBytes = header.filter(byte => byte !== 0).length;
  return nonZeroBytes > 8;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Please configure your OpenAI API key in Account Settings.', requires_ai_config: true },
        { status: 400 }
      );
    }

    // Validate file type and size
    const supportedTypes = ['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg'];
    const fileType = audioFile.type.split(';')[0] || 'unknown';

    if (!fileType.startsWith('audio/') && !supportedTypes.some(type => fileType === type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${fileType}. Supported types: ${supportedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check file size (OpenAI Whisper has a 25MB limit)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    if (audioFile.size < 100) {
      return NextResponse.json(
        { error: 'File too small. Please provide a valid audio recording.' },
        { status: 400 }
      );
    }



    const audioBuffer = await audioFile.arrayBuffer();
    const uint8Array = new Uint8Array(audioBuffer);
    const isValidAudio = validateAudioFile(uint8Array, fileType);

    if (!isValidAudio) {


      return NextResponse.json(
        {
          error: 'Invalid or corrupted audio file. Please try recording again.',
          details: 'The uploaded file does not appear to be a valid audio file.'
        },
        { status: 400 }
      );
    }

    // Create a proper filename with supported extension
    let fileName = audioFile.name;
    let mimeType: string = fileType;

    if (!fileName.includes('.')) {
      if (fileType.includes('wav')) {
        fileName += '.wav';
        mimeType = 'audio/wav';
      } else if (fileType.includes('webm')) {
        fileName += '.webm';
        mimeType = 'audio/webm';
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



    // Initialize OpenAI client with user's API key
    const openai = new OpenAI({ apiKey });

    const cleanMimeType = mimeType.split(';')[0] || 'audio/wav';

    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], fileName, { type: cleanMimeType }),
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    });



    return NextResponse.json({
      success: true,
      text: transcription.text,
    });

  } catch (error: unknown) {
    console.error('❌ Speech-to-text error:', error);

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
      {
        error: 'Internal server error during speech recognition',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit audio.' },
    { status: 405 }
  );
}
