'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLOUD_TTS_VOICES } from '@/utils/audioUtils';

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  ttsProvider?: 'google' | 'groq';
  disabled?: boolean;
  className?: string;
}

// Google Cloud TTS voice options
const GOOGLE_VOICE_OPTIONS = {
  'Kore': {
    name: 'Kore',
    description: 'Warm and professional (Neural2)',
    gender: 'Male',
    cloudVoice: CLOUD_TTS_VOICES.MALE_NEURAL
  },
  'Charon': {
    name: 'Charon',
    description: 'Deep and authoritative (WaveNet)',
    gender: 'Male',
    cloudVoice: CLOUD_TTS_VOICES.MALE_WAVENET
  },
  'Marcus': {
    name: 'Marcus',
    description: 'Classic and reliable (Standard)',
    gender: 'Male',
    cloudVoice: CLOUD_TTS_VOICES.MALE_STANDARD
  },
  'Aoede': {
    name: 'Aoede',
    description: 'Gentle and articulate (WaveNet)',
    gender: 'Female',
    cloudVoice: CLOUD_TTS_VOICES.FEMALE_WAVENET
  },
  'Fenrir': {
    name: 'Fenrir',
    description: 'Clear and balanced (Neural2)',
    gender: 'Female',
    cloudVoice: CLOUD_TTS_VOICES.FEMALE_NEURAL
  },
  'Sophia': {
    name: 'Sophia',
    description: 'Natural and clear (Standard)',
    gender: 'Female',
    cloudVoice: CLOUD_TTS_VOICES.FEMALE_STANDARD
  }
};

// Groq TTS voice options
const GROQ_VOICE_OPTIONS = {
  'Sophia': {
    name: 'Sophia',
    description: 'Natural and expressive',
    gender: 'Female',
    groqVoice: 'sophia'
  },
  'Kore': {
    name: 'Kore',
    description: 'Warm and professional',
    gender: 'Male',
    groqVoice: 'kore'
  },
  'Aria': {
    name: 'Aria',
    description: 'Clear and articulate',
    gender: 'Female',
    groqVoice: 'aria'
  },
  'Marcus': {
    name: 'Marcus',
    description: 'Deep and authoritative',
    gender: 'Male',
    groqVoice: 'marcus'
  },
  'Luna': {
    name: 'Luna',
    description: 'Gentle and soothing',
    gender: 'Female',
    groqVoice: 'luna'
  },
  'Zara': {
    name: 'Zara',
    description: 'Confident and modern',
    gender: 'Female',
    groqVoice: 'zara'
  },
  'Oliver': {
    name: 'Oliver',
    description: 'Friendly and approachable',
    gender: 'Male',
    groqVoice: 'oliver'
  },
  'Emma': {
    name: 'Emma',
    description: 'Bright and engaging',
    gender: 'Female',
    groqVoice: 'emma'
  },
  'Liam': {
    name: 'Liam',
    description: 'Strong and reliable',
    gender: 'Male',
    groqVoice: 'liam'
  },
  'Ava': {
    name: 'Ava',
    description: 'Elegant and refined',
    gender: 'Female',
    groqVoice: 'ava'
  },
  'Noah': {
    name: 'Noah',
    description: 'Calm and steady',
    gender: 'Male',
    groqVoice: 'noah'
  },
  'Isabella': {
    name: 'Isabella',
    description: 'Sophisticated and polished',
    gender: 'Female',
    groqVoice: 'isabella'
  },
  'Ethan': {
    name: 'Ethan',
    description: 'Dynamic and energetic',
    gender: 'Male',
    groqVoice: 'ethan'
  },
  'Mia': {
    name: 'Mia',
    description: 'Youthful and vibrant',
    gender: 'Female',
    groqVoice: 'mia'
  },
  'James': {
    name: 'James',
    description: 'Classic and distinguished',
    gender: 'Male',
    groqVoice: 'james'
  },
  'Charlotte': {
    name: 'Charlotte',
    description: 'Graceful and articulate',
    gender: 'Female',
    groqVoice: 'charlotte'
  },
  'Benjamin': {
    name: 'Benjamin',
    description: 'Thoughtful and measured',
    gender: 'Male',
    groqVoice: 'benjamin'
  },
  'Amelia': {
    name: 'Amelia',
    description: 'Sweet and melodic',
    gender: 'Female',
    groqVoice: 'amelia'
  },
  'William': {
    name: 'William',
    description: 'Authoritative and clear',
    gender: 'Male',
    groqVoice: 'william'
  },
  'Harper': {
    name: 'Harper',
    description: 'Modern and confident',
    gender: 'Female',
    groqVoice: 'harper'
  },
  'Evelyn': {
    name: 'Evelyn',
    description: 'Timeless and elegant',
    gender: 'Female',
    groqVoice: 'evelyn'
  },
  'Alexander': {
    name: 'Alexander',
    description: 'Commanding and powerful',
    gender: 'Male',
    groqVoice: 'alexander'
  },
  'Abigail': {
    name: 'Abigail',
    description: 'Cheerful and bright',
    gender: 'Female',
    groqVoice: 'abigail'
  }
};

export type GoogleVoiceOption = keyof typeof GOOGLE_VOICE_OPTIONS;
export type GroqVoiceOption = keyof typeof GROQ_VOICE_OPTIONS;
export type VoiceOption = GoogleVoiceOption | GroqVoiceOption;

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  ttsProvider = 'google',
  disabled = false,
  className 
}: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get the appropriate voice options based on TTS provider
  const voiceOptions = ttsProvider === 'groq' ? GROQ_VOICE_OPTIONS : GOOGLE_VOICE_OPTIONS;
  const defaultVoice = 'Sophia';
  
  const currentVoice = voiceOptions[selectedVoice as keyof typeof voiceOptions] || voiceOptions[defaultVoice as keyof typeof voiceOptions];
  
  const handleVoiceSelect = (voice: VoiceOption) => {
    onVoiceChange(voice);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Voice Selector Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-between h-10 px-3",
          isOpen && "ring-2 ring-blue-500 ring-offset-2"
        )}
      >
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-gray-500" />
          <div className="text-left">
            <div className="text-sm font-medium">{currentVoice.name}</div>
            <div className="text-xs text-gray-500">{currentVoice.gender}</div>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-1">
            {Object.keys(voiceOptions).map((voice) => {
              const voiceInfo = voiceOptions[voice as keyof typeof voiceOptions];
              const isSelected = voice === selectedVoice;
              
              return (
                <button
                  key={voice}
                  onClick={() => handleVoiceSelect(voice as VoiceOption)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{voiceInfo.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {voiceInfo.gender} • {voiceInfo.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {ttsProvider === 'groq' 
                ? `Powered by Groq TTS • ${Object.keys(voiceOptions).length} voices available`
                : 'Powered by Google Cloud Text-to-Speech'
              }
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Simple voice preview component
 */
interface VoicePreviewProps {
  voice: VoiceOption;
  onPreview: (voice: VoiceOption) => void;
  ttsProvider?: 'google' | 'groq';
  isPlaying?: boolean;
  disabled?: boolean;
}

export function VoicePreview({ 
  voice, 
  onPreview, 
  ttsProvider = 'google',
  isPlaying = false, 
  disabled = false 
}: VoicePreviewProps) {
  const voiceOptions = ttsProvider === 'groq' ? GROQ_VOICE_OPTIONS : GOOGLE_VOICE_OPTIONS;
  const voiceInfo = voiceOptions[voice as keyof typeof voiceOptions];
  
  if (!voiceInfo) return null;
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onPreview(voice)}
      disabled={disabled}
      className={cn(
        "h-8 px-2 text-xs",
        isPlaying && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
      )}
    >
      <Volume2 className="h-3 w-3 mr-1" />
      Preview {voiceInfo.name}
    </Button>
  );
}