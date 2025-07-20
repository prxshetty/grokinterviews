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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512" className="w-4 h-4">
          <path fill="currentColor" d="M442 48h-90a22 22 0 0 0 0 44h36.89l-60.39 60.39c-68.19-52.86-167-48-229.54 14.57C31.12 234.81 31.12 345.19 99 413a174.21 174.21 0 0 0 246 0c62.57-62.58 67.43-161.35 14.57-229.54L420 123.11V160a22 22 0 0 0 44 0V70a22 22 0 0 0-22-22M313.92 381.92a130.13 130.13 0 0 1-183.84 0c-50.69-50.68-50.69-133.16 0-183.84s133.16-50.69 183.84 0s50.69 133.16 0 183.84"/>
        </svg>
      )
    },
    {
      id: 'premium-female' as const,
      name: 'Gianna',
      tier: 'premium',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" className="w-4 h-4">
          <path fill="currentColor" d="m19.72 4.28l-1.44 1.44L21.563 9l-2.968 2.97A8.935 8.935 0 0 0 13 10c-4.96 0-9 4.04-9 9s4.04 9 9 9s9-4.04 9-9a8.94 8.94 0 0 0-1.97-5.594l2.97-2.97l3.28 3.283l1.44-1.44L24.437 9l3.28-3.28l-1.437-1.44L23 7.563l-3.28-3.28zM13 12c3.878 0 7 3.122 7 7s-3.122 7-7 7s-7-3.122-7-7s3.122-7 7-7z"/>
        </svg>
      )
    },
    {
      id: 'male' as const,
      name: 'George',
      tier: 'standard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512" className="w-4 h-4">
          <path fill="currentColor" d="M442 48h-90a22 22 0 0 0 0 44h36.89l-60.39 60.39c-68.19-52.86-167-48-229.54 14.57C31.12 234.81 31.12 345.19 99 413a174.21 174.21 0 0 0 246 0c62.57-62.58 67.43-161.35 14.57-229.54L420 123.11V160a22 22 0 0 0 44 0V70a22 22 0 0 0-22-22M313.92 381.92a130.13 130.13 0 0 1-183.84 0c-50.69-50.68-50.69-133.16 0-183.84s133.16-50.69 183.84 0s50.69 133.16 0 183.84"/>
        </svg>
      )
    },
    {
      id: 'female' as const,
      name: 'Gia',
      tier: 'standard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" className="w-4 h-4">
          <path fill="currentColor" d="m19.72 4.28l-1.44 1.44L21.563 9l-2.968 2.97A8.935 8.935 0 0 0 13 10c-4.96 0-9 4.04-9 9s4.04 9 9 9s9-4.04 9-9a8.94 8.94 0 0 0-1.97-5.594l2.97-2.97l3.28 3.283l1.44-1.44L24.437 9l3.28-3.28l-1.437-1.44L23 7.563l-3.28-3.28zM13 12c3.878 0 7 3.122 7 7s-3.122 7-7 7s-7-3.122-7-7s3.122-7 7-7z"/>
        </svg>
      )
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
              "w-10 h-10 rounded-full border-2 flex items-center justify-center mb-1 transition-all duration-200",
              selectedVoice === voice.id
                ? voice.tier === 'premium'
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-md"
                  : "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-gray-400"
            )}>
              <div className={cn(
                "transition-colors",
                selectedVoice === voice.id
                  ? voice.tier === 'premium'
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
                {voice.icon}
              </div>
              {selectedVoice === voice.id && (
                <div className={cn(
                  "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-900",
                  voice.tier === 'premium' ? "bg-amber-500" : "bg-primary"
                )}></div>
              )}
            </div>
            
            {/* Voice Info */}
            <div className="text-center">
              <div className={cn(
                "text-xs font-medium leading-tight",
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