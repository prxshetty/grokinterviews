import { VoiceConfig, WEB_VOICE_CONFIG, PHONE_VOICE_CONFIG, WebVoiceOption, PhoneVoiceOption } from '@/types/voice.types';

/**
 * Get voice configuration based on voice name and interview type
 * @param voiceName - The voice name from the interview data
 * @param interviewType - The type of interview ('web' or 'phone')
 * @returns VoiceConfig object or null if not found
 */
export function getVoiceConfig(voiceName?: string, interviewType?: 'web' | 'phone'): VoiceConfig | null {
  if (!voiceName) return null;
  
  if (interviewType === 'phone') {
    return voiceName in PHONE_VOICE_CONFIG ? PHONE_VOICE_CONFIG[voiceName as PhoneVoiceOption] : null;
  } else {
    return voiceName in WEB_VOICE_CONFIG ? WEB_VOICE_CONFIG[voiceName as WebVoiceOption] : null;
  }
}

/**
 * Get voice avatar URL with fallback logic
 * @param voiceName - The voice name from the interview data
 * @param interviewType - The type of interview ('web' or 'phone')
 * @returns Avatar image URL with appropriate fallback
 */
export function getVoiceAvatarUrl(voiceName?: string, interviewType?: 'web' | 'phone'): string {
  const voiceConfig = getVoiceConfig(voiceName, interviewType);
  
  if (voiceConfig) {
    return voiceConfig.image;
  }
  
  // Fallback logic based on interview type
  return interviewType === 'phone' ? '/images/female_phone.png' : '/images/female_default.png';
}

/**
 * Get voice display name with fallback
 * @param voiceName - The voice name from the interview data
 * @param interviewType - The type of interview ('web' or 'phone')
 * @returns Display name with fallback to 'AI Interviewer'
 */
export function getVoiceDisplayName(voiceName?: string, interviewType?: 'web' | 'phone'): string {
  const voiceConfig = getVoiceConfig(voiceName, interviewType);
  return voiceConfig ? voiceConfig.displayName : 'AI Interviewer';
}

/**
 * Check if a voice is premium tier
 * @param voiceName - The voice name from the interview data
 * @param interviewType - The type of interview ('web' or 'phone')
 * @returns true if voice is premium tier, false otherwise
 */
export function isVoicePremium(voiceName?: string, interviewType?: 'web' | 'phone'): boolean {
  const voiceConfig = getVoiceConfig(voiceName, interviewType);
  return voiceConfig?.tier === 'premium';
}

/**
 * Get all available voice options for a specific interview type
 * @param interviewType - The type of interview ('web' or 'phone')
 * @returns Array of VoiceConfig objects
 */
export function getAvailableVoices(interviewType: 'web' | 'phone'): VoiceConfig[] {
  if (interviewType === 'phone') {
    return Object.values(PHONE_VOICE_CONFIG);
  } else {
    return Object.values(WEB_VOICE_CONFIG);
  }
}