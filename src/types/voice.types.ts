export type VoiceOption = 'Sophia' | 'Marcus' | 'Aoede' | 'Algieba';

export interface GoogleVoiceOption {
  name: VoiceOption;
  label: string;
  value: string;
  gender: 'male' | 'female';
  premium: boolean;
  image: string;
}

export const VOICE_CONFIG: Record<VoiceOption, GoogleVoiceOption> = {
  'Sophia': {
    name: 'Sophia',
    label: 'Sophia',
    value: 'Sophia',
    gender: 'female',
    premium: false,
    image: '/images/female_default.png'
  },
  'Marcus': {
    name: 'Marcus',
    label: 'Marcus',
    value: 'Marcus',
    gender: 'male',
    premium: false,
    image: '/images/male_default.png'
  },
  'Aoede': {
    name: 'Aoede',
    label: 'Aoede',
    value: 'Aoede',
    gender: 'female',
    premium: true,
    image: '/images/female_sign.jpeg'
  },
  'Algieba': {
    name: 'Algieba',
    label: 'Algieba',
    value: 'Algieba',
    gender: 'male',
    premium: true,
    image: '/images/male_sign.jpeg'
  }
};