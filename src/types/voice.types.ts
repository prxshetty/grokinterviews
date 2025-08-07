export type VoiceOption = 'Sophia' | 'Marcus' | 'Aoede' | 'Algieba';

export interface VoiceConfig {
  technicalName: VoiceOption;
  displayName: string;
  label: string;
  tier: 'standard' | 'premium';
  image: string;
}

export const VOICE_CONFIG: Record<VoiceOption, VoiceConfig> = {
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