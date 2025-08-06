'use client';
import { cn } from '@/lib/utils';

type VoiceType = 'male' | 'female' | 'premium-male' | 'premium-female';

interface VoiceSelectionProps {
  selectedVoice: VoiceType | null;
  onVoiceChange: (voice: VoiceType) => void;
  className?: string;
}

export function VoiceSelection({ selectedVoice, onVoiceChange, className }: VoiceSelectionProps) {
  const allVoices = [
    {
      id: 'premium-male' as const,
      name: 'Gideon',
      tier: 'premium',
      image: '/images/male_sign.jpeg',
    },
    {
      id: 'premium-female' as const,
      name: 'Gianna',
      tier: 'premium',
      image: '/images/female_sign.jpeg',
    },
    {
      id: 'male' as const,
      name: 'George',
      tier: 'standard',
      image: '/images/male_default.png',
    },
    {
      id: 'female' as const,
      name: 'Gia',
      tier: 'standard',
      image: '/images/female_default.png',
    }
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-center">
        <h3 className="text-sm font-medium text-foreground mb-1">Select Your Interviewer</h3>
        <p className="text-xs text-muted-foreground">Choose the voice for your AI interviewer</p>
      </div>
      
      {/* All Voices in Single Row */}
      <div className="flex justify-center gap-2">
        {allVoices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onVoiceChange(voice.id)}
            className={cn(
              "relative flex flex-col items-center transition-all duration-200 group"
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
              <img src={voice.image} alt={voice.name} className="w-full h-full object-cover object-[center_25%]" />
              {selectedVoice === voice.id && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900",
                  voice.tier === 'premium' ? "bg-amber-500" : "bg-primary"
                )}></div>
              )}
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
              {voice.tier === 'premium' && (
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Premium
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { VoiceType };