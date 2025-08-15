import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_0 || process.env.GROQ_API_KEY,
});

// Audio file validation function
function validateAudioFile(uint8Array: Uint8Array, fileType: string): boolean {
  // Check if file has minimum size
  if (uint8Array.length < 16) {
    return false;
  }
  
  // Check for common audio file signatures
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
  return nonZeroBytes > 8; // At least half the header should be non-zero
}

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

    // Validate file type and size - prioritize WAV for consistency
    const supportedTypes = ['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg'];
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
    
    // Basic audio file validation - check for common audio file signatures
    const uint8Array = new Uint8Array(audioBuffer);
    const isValidAudio = validateAudioFile(uint8Array, fileType);
    
    if (!isValidAudio) {
      console.log('❌ Invalid audio file detected:', {
        fileName: audioFile.name,
        fileType,
        size: audioBuffer.byteLength,
        firstBytes: Array.from(uint8Array.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      });
      
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
      // Add extension based on MIME type - prioritize WAV
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
        const cleanMimeType = mimeType.split(';')[0] || 'audio/wav';
        
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
        console.log(`❌ Model ${model} failed:`, modelError.status, modelError.message);
        
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
      // Check if this is a file validation error
      if (error.status === 400 && error.message?.includes('could not process file')) {
        return NextResponse.json(
          { 
            error: 'Invalid or corrupted audio file', 
            details: 'The uploaded audio file appears to be corrupted or in an unsupported format. Please try recording again.',
            type: 'invalid_audio_file'
          },
          { status: 400 }
        );
      }
      
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
