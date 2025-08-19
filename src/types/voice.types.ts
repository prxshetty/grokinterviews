export type WebVoiceOption = 'Sophia' | 'Marcus' | 'Aoede' | 'Algieba';
export type PhoneVoiceOption = 'Emily';
export type VoiceOption = WebVoiceOption | PhoneVoiceOption;

export interface VoiceConfig {
  technicalName: VoiceOption;
  displayName: string;
  label: string;
  tier: 'standard' | 'premium';
  image: string;
}

export const WEB_VOICE_CONFIG: Record<WebVoiceOption, VoiceConfig> = {
  'Sophia': {
    technicalName: 'Sophia',
    displayName: 'Gia',
    label: 'Sophia',
    tier: 'standard',
    image: '/images/female_default.png'
  },
  'Marcus': {
    technicalName: 'Marcus',
    displayName: 'George',
    label: 'Marcus',
    tier: 'standard',
    image: '/images/male_default.png'
  },
  'Aoede': {
    technicalName: 'Aoede',
    displayName: 'Gianna',
    label: 'Aoede',
    tier: 'premium',
    image: '/images/female_sign.jpeg'
  },
  'Algieba': {
    technicalName: 'Algieba',
    displayName: 'Gideon',
    label: 'Algieba',
    tier: 'premium',
    image: '/images/male_sign.jpeg'
  }
};

export const PHONE_VOICE_CONFIG: Record<PhoneVoiceOption, VoiceConfig> = {
  'Emily': {
    technicalName: 'Emily',
    displayName: 'Emily',
    label: 'Emily',
    tier: 'standard',
    image: '/images/female_phone.png'
  }
};

// Combined configuration for backward compatibility
export const VOICE_CONFIG: Record<VoiceOption, VoiceConfig> = {
  ...WEB_VOICE_CONFIG,
  ...PHONE_VOICE_CONFIG
};