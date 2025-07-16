/**
 * Audio utility functions for TTS processing
 */

/**
 * Convert PCM audio data to WAV format
 * @param pcmBuffer - Raw PCM audio data buffer
 * @param options - Audio format options
 * @returns WAV formatted buffer
 */
export function convertPCMToWAV(
  pcmBuffer: Buffer,
  options: {
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
  } = {}
): Buffer {
  const {
    sampleRate = 24000,
    channels = 1,
    bitDepth = 16
  } = options;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;

  // Create WAV header
  const header = Buffer.alloc(44);
  let offset = 0;

  // RIFF chunk descriptor
  header.write('RIFF', offset); offset += 4;
  header.writeUInt32LE(fileSize, offset); offset += 4;
  header.write('WAVE', offset); offset += 4;

  // fmt sub-chunk
  header.write('fmt ', offset); offset += 4;
  header.writeUInt32LE(16, offset); offset += 4; // Sub-chunk size
  header.writeUInt16LE(1, offset); offset += 2; // Audio format (PCM)
  header.writeUInt16LE(channels, offset); offset += 2;
  header.writeUInt32LE(sampleRate, offset); offset += 4;
  header.writeUInt32LE(byteRate, offset); offset += 4;
  header.writeUInt16LE(blockAlign, offset); offset += 2;
  header.writeUInt16LE(bitDepth, offset); offset += 2;

  // data sub-chunk
  header.write('data', offset); offset += 4;
  header.writeUInt32LE(dataSize, offset);

  // Combine header and PCM data
  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Validate audio format parameters
 */
export function validateAudioParams(params: {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}): boolean {
  const { sampleRate = 24000, channels = 1, bitDepth = 16 } = params;
  
  return (
    sampleRate > 0 && sampleRate <= 48000 &&
    channels > 0 && channels <= 2 &&
    (bitDepth === 8 || bitDepth === 16 || bitDepth === 24 || bitDepth === 32)
  );
}

/**
 * Get audio duration in seconds from PCM data
 */
export function getAudioDuration(
  pcmBuffer: Buffer,
  sampleRate: number = 24000,
  channels: number = 1,
  bitDepth: number = 16
): number {
  const bytesPerSample = bitDepth / 8;
  const totalSamples = pcmBuffer.length / (channels * bytesPerSample);
  return totalSamples / sampleRate;
}

/**
 * Audio format constants for Google Cloud TTS
 */
export const CLOUD_TTS_AUDIO_CONFIG = {
  SAMPLE_RATE: 24000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  FORMAT: 'LINEAR16'
} as const;

/**
 * Available Google Cloud TTS voices
 */
export const CLOUD_TTS_VOICES = {
  // English US voices - Standard
  MALE_STANDARD: 'en-US-Standard-J',
  FEMALE_STANDARD: 'en-US-Standard-C',
  // English US voices - WaveNet (legacy)
  MALE_WAVENET: 'en-US-Wavenet-B',
  FEMALE_WAVENET: 'en-US-Wavenet-C',
  // English US voices - Neural2 (legacy)
  MALE_NEURAL: 'en-US-Neural2-A',
  FEMALE_NEURAL: 'en-US-Neural2-C',
  // English US voices - Chirp3-HD (Premium)
  MALE_CHIRP3_HD: 'en-US-Chirp3-HD-Algieba',
  FEMALE_CHIRP3_HD: 'en-US-Chirp3-HD-Aoede',
  // English GB voices
  MALE_GB: 'en-GB-Standard-B',
  FEMALE_GB: 'en-GB-Standard-A'
} as const;

export type CloudTTSVoice = typeof CLOUD_TTS_VOICES[keyof typeof CLOUD_TTS_VOICES];

/**
 * Map legacy voice names to Google Cloud TTS voices
 */
export function mapVoiceToCloudTTS(voice: string): CloudTTSVoice {
  const voiceMap: Record<string, CloudTTSVoice> = {
    // New voice mappings
    'Algieba': CLOUD_TTS_VOICES.MALE_CHIRP3_HD,
    'Aoede': CLOUD_TTS_VOICES.FEMALE_CHIRP3_HD,
    'Marcus': CLOUD_TTS_VOICES.MALE_STANDARD,
    'Sophia': CLOUD_TTS_VOICES.FEMALE_STANDARD,
    // Legacy mappings for backward compatibility
    'Fritz-PlayAI': CLOUD_TTS_VOICES.MALE_NEURAL,
    'fritz': CLOUD_TTS_VOICES.MALE_NEURAL,
    'Kore': CLOUD_TTS_VOICES.MALE_NEURAL,
    'Charon': CLOUD_TTS_VOICES.MALE_WAVENET,
    'Fenrir': CLOUD_TTS_VOICES.FEMALE_NEURAL,
    'male': CLOUD_TTS_VOICES.MALE_WAVENET,
    'female': CLOUD_TTS_VOICES.FEMALE_WAVENET,
    'neutral': CLOUD_TTS_VOICES.FEMALE_NEURAL
  };
  
  return voiceMap[voice] || voiceMap[voice.toLowerCase()] || CLOUD_TTS_VOICES.MALE_STANDARD;
}

/**
 * Get gender from Cloud TTS voice name
 */
export function getVoiceGender(voiceName: CloudTTSVoice): 'MALE' | 'FEMALE' {
  const femaleVoices: CloudTTSVoice[] = [
    CLOUD_TTS_VOICES.FEMALE_STANDARD,
    CLOUD_TTS_VOICES.FEMALE_WAVENET,
    CLOUD_TTS_VOICES.FEMALE_NEURAL,
    CLOUD_TTS_VOICES.FEMALE_GB
  ];
  
  return femaleVoices.includes(voiceName) ? 'FEMALE' : 'MALE';
}