export type VoiceOption = 'Sophia' | 'Marcus' | 'Aoede' | 'Algieba';

export interface GoogleVoiceOption {
  name: VoiceOption;
  label: string;
  value: string;
  gender: 'male' | 'female';
  premium: boolean;
  image: string;
}