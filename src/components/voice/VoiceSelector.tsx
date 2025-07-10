'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GEMINI_VOICES, type GeminiVoice } from '@/utils/audioUtils';

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  disabled?: boolean;
  className?: string;
}

const VOICE_DESCRIPTIONS: Record<GeminiVoice, { name: string; description: string; gender: string }> = {
  [GEMINI_VOICES.KORE]: {
    name: 'Kore',
    description: 'Warm and professional',
    gender: 'Neutral'
  },
  [GEMINI_VOICES.CHARON]: {
    name: 'Charon',
    description: 'Deep and authoritative',
    gender: 'Male'
  },
  [GEMINI_VOICES.FENRIR]: {
    name: 'Fenrir',
    description: 'Clear and balanced',
    gender: 'Neutral'
  },
  [GEMINI_VOICES.AOEDE]: {
    name: 'Aoede',
    description: 'Gentle and articulate',
    gender: 'Female'
  }
};

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  disabled = false,
  className 
}: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentVoice = VOICE_DESCRIPTIONS[selectedVoice as GeminiVoice] || VOICE_DESCRIPTIONS[GEMINI_VOICES.KORE];
  
  const handleVoiceSelect = (voice: GeminiVoice) => {
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
            {Object.values(GEMINI_VOICES).map((voice) => {
              const voiceInfo = VOICE_DESCRIPTIONS[voice];
              const isSelected = voice === selectedVoice;
              
              return (
                <button
                  key={voice}
                  onClick={() => handleVoiceSelect(voice)}
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
              Powered by Google Gemini TTS
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
  voice: GeminiVoice;
  onPreview: (voice: GeminiVoice) => void;
  isPlaying?: boolean;
  disabled?: boolean;
}

export function VoicePreview({ 
  voice, 
  onPreview, 
  isPlaying = false, 
  disabled = false 
}: VoicePreviewProps) {
  const voiceInfo = VOICE_DESCRIPTIONS[voice];
  
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