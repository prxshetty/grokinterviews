'use client';
import { cn } from '@/lib/utils';
import { VOICE_CONFIG } from '@/types/voice.types';
import Image from 'next/image';

type VoiceType = 'male' | 'female' | 'premium-male' | 'premium-female';

interface VoiceSelectionProps {
  selectedVoice: VoiceType | null;
  onVoiceChange: (voice: VoiceType) => void;
  className?: string;
}

export function VoiceSelection({ selectedVoice, onVoiceChange, className }: VoiceSelectionProps) {
  const allVoices = [
    {
      id: 'male' as const,
      name: VOICE_CONFIG.Marcus.displayName,
      tier: VOICE_CONFIG.Marcus.tier,
      image: VOICE_CONFIG.Marcus.image,
    },
    {
      id: 'female' as const,
      name: VOICE_CONFIG.Sophia.displayName,
      tier: VOICE_CONFIG.Sophia.tier,
      image: VOICE_CONFIG.Sophia.image,
    }
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-center">
        <h3 className="text-sm font-medium text-foreground mb-1">Select Your Interviewer</h3>
      </div>

      {/* All Voices in Single Row */}
      <div className="flex justify-center gap-2">
        {allVoices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onVoiceChange(voice.id)}
            className={cn(
              "relative flex flex-col items-center transition-all duration-200 group",
              selectedVoice && selectedVoice !== voice.id ? "opacity-40" : "opacity-100"
            )}
          >
            {/* Circular Icon Container */}
            <div className={cn(
              "w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-200 overflow-hidden",
              selectedVoice === voice.id
                ? voice.tier === 'premium'
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-md"
                  : "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-gray-400"
            )}>
              <Image
                src={voice.image}
                alt={voice.name}
                className="w-full h-full object-cover object-[center_25%]"
                width={64}
                height={64}
                loading="lazy"
                sizes="64px"
                draggable={false}
              />
            </div>

            {/* Voice Info */}
            <div className="text-center">
              <div className={cn(
                "text-sm font-medium leading-tight",
                selectedVoice === voice.id
                  ? voice.tier === 'premium'
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-primary"
                  : "text-foreground"
              )}>
                {voice.name}
              </div>

            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { VoiceType };