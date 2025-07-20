'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Volume2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  ttsProvider?: 'google' | 'groq';
  disabled?: boolean;
  className?: string;
}

// Google Cloud TTS voice options
const GOOGLE_VOICE_OPTIONS = {
  // Premium voices (Chirp3-HD)
  'Algieba': {
    name: 'Algieba',
    description: 'Premium HD quality',
    gender: 'Male',
    tier: 'Premium',
    cloudVoice: 'en-US-Chirp3-HD-Algieba'
  },
  'Aoede': {
    name: 'Aoede',
    description: 'Premium HD quality',
    gender: 'Female',
    tier: 'Premium',
    cloudVoice: 'en-US-Chirp3-HD-Aoede'
  },
  // Standard voices
  'Marcus': {
    name: 'Marcus',
    description: 'Standard quality',
    gender: 'Male',
    tier: 'Standard',
    cloudVoice: 'en-US-Standard-J'
  },
  'Sophia': {
    name: 'Sophia',
    description: 'Standard quality',
    gender: 'Female',
    tier: 'Standard',
    cloudVoice: 'en-US-Standard-C'
  }
};

// Groq TTS voice options (PlayAI voices)
const GROQ_VOICE_OPTIONS = {
  'Arista': {
    name: 'Arista',
    description: 'PlayAI Female Voice',
    gender: 'Female',
    groqVoice: 'Arista-PlayAI'
  },
  'Atlas': {
    name: 'Atlas',
    description: 'PlayAI Male Voice',
    gender: 'Male',
    groqVoice: 'Atlas-PlayAI'
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Set default voice based on provider
  const defaultVoice = ttsProvider === 'groq' ? 'Arista' : 'Sophia';
  
  // Get current voice with proper fallback and type assertion
  const getCurrentVoice = () => {
    if (ttsProvider === 'groq') {
      const groqOptions = GROQ_VOICE_OPTIONS;
      const voice = groqOptions[selectedVoice as keyof typeof groqOptions];
      return voice || groqOptions[defaultVoice as keyof typeof groqOptions];
    } else {
      const googleOptions = GOOGLE_VOICE_OPTIONS;
      const voice = googleOptions[selectedVoice as keyof typeof googleOptions];
      return voice || googleOptions[defaultVoice as keyof typeof googleOptions];
    }
  };
  
  const currentVoice = getCurrentVoice();
  
  const handleVoiceSelect = (voice: VoiceOption) => {
    onVoiceChange(voice);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Voice Selector Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-between h-11 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200",
          isOpen && "ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-600"
        )}
      >
        <div className="flex items-center space-x-3">
          <Volume2 className="h-4 w-4 text-gray-400" />
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{currentVoice.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentVoice.gender}
              {ttsProvider === 'google' && 'tier' in currentVoice && ` • ${currentVoice.tier}`}
            </div>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[100] overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {ttsProvider === 'google' && (
              <>
                {/* Premium voices section */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    Premium Voices
                  </div>
                </div>
                {Object.keys(GOOGLE_VOICE_OPTIONS).filter(voice => {
                  const voiceInfo = GOOGLE_VOICE_OPTIONS[voice as keyof typeof GOOGLE_VOICE_OPTIONS];
                  return 'tier' in voiceInfo && voiceInfo.tier === 'Premium';
                }).map((voice) => {
                  const voiceInfo = GOOGLE_VOICE_OPTIONS[voice as keyof typeof GOOGLE_VOICE_OPTIONS];
                  const isSelected = voice === selectedVoice;
                  
                  return (
                    <button
                      key={voice}
                      onClick={() => handleVoiceSelect(voice as VoiceOption)}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors duration-150",
                        "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                        isSelected && "bg-blue-50 dark:bg-blue-900/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{voiceInfo.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {voiceInfo.gender} • {voiceInfo.description}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
                
                {/* Standard voices section */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    Standard Voices
                  </div>
                </div>
                {Object.keys(GOOGLE_VOICE_OPTIONS).filter(voice => {
                  const voiceInfo = GOOGLE_VOICE_OPTIONS[voice as keyof typeof GOOGLE_VOICE_OPTIONS];
                  return 'tier' in voiceInfo && voiceInfo.tier === 'Standard';
                }).map((voice) => {
                  const voiceInfo = GOOGLE_VOICE_OPTIONS[voice as keyof typeof GOOGLE_VOICE_OPTIONS];
                  const isSelected = voice === selectedVoice;
                  
                  return (
                    <button
                      key={voice}
                      onClick={() => handleVoiceSelect(voice as VoiceOption)}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors duration-150",
                        "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                        isSelected && "bg-blue-50 dark:bg-blue-900/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{voiceInfo.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {voiceInfo.gender} • {voiceInfo.description}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            )}
            
            {/* Groq voices */}
            {ttsProvider === 'groq' && (
              <>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    Available Voices
                  </div>
                </div>
                {Object.keys(GROQ_VOICE_OPTIONS).map((voice) => {
                  const voiceInfo = GROQ_VOICE_OPTIONS[voice as keyof typeof GROQ_VOICE_OPTIONS];
                  const isSelected = voice === selectedVoice;
                  
                  return (
                    <button
                      key={voice}
                      onClick={() => handleVoiceSelect(voice as VoiceOption)}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors duration-150",
                        "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                        isSelected && "bg-blue-50 dark:bg-blue-900/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{voiceInfo.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {voiceInfo.gender} • {voiceInfo.description}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
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
  // Get voice info with proper type handling
  const getVoiceInfo = () => {
    if (ttsProvider === 'groq') {
      return GROQ_VOICE_OPTIONS[voice as keyof typeof GROQ_VOICE_OPTIONS];
    } else {
      return GOOGLE_VOICE_OPTIONS[voice as keyof typeof GOOGLE_VOICE_OPTIONS];
    }
  };
  
  const voiceInfo = getVoiceInfo();
  
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