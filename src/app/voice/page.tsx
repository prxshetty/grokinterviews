'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Laptop, Phone, Zap, Clock, Users, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceSelection, type VoiceType } from '@/components/voice/VoiceSelection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function VoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedVoice, setSelectedVoice] = useState<VoiceType | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?redirect=/voice');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <LoadingSpinner 
        size="lg"
        centered={true}
      />
    );
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  const handleModeSelection = (mode: 'web' | 'phone') => {
    // For web mode, voice selection is required
    if (mode === 'web' && !selectedVoice) return;
    
    // For phone mode, use default voice or proceed without voice selection
    if (mode === 'phone') {
      router.push(`/voice/${mode}`);
      return;
    }
    
    // Map voice types to appropriate voice parameters for web mode
    let voiceParam: string;
    switch (selectedVoice) {
      case 'male':
        voiceParam = 'George';
        break;
      case 'female':
        voiceParam = 'Gia';
        break;
      case 'premium-male':
        voiceParam = 'Gideon';
        break;
      case 'premium-female':
        voiceParam = 'Gianna';
        break;
      default:
        voiceParam = 'Gia';
    }
    
    router.push(`/voice/${mode}?voice=${voiceParam}`);
  };

  const modes = [
    {
      id: 'web' as const,
      title: 'Web Interview',
      subtitle: 'Practice on your computer',
      icon: Laptop,
      image: '/images/webcall.webp',
      features: [
        { icon: Zap, text: 'Instant start' },
        { icon: Clock, text: 'Real-time feedback' },
        { icon: Users, text: 'Visual interface' }
      ],
      recommended: 'Best for first-time practice'
    },
    {
      id: 'phone' as const,
      title: 'Phone Interview',
      subtitle: 'Receive a real phone call',
      icon: Phone,
      image: '/images/phonecall.webp',
      features: [
        { icon: Phone, text: 'Real phone call' },
        { icon: Shield, text: 'Authentic experience' },
        { icon: Clock, text: '10-15 minutes' }
      ],
      recommended: 'Best for realistic practice'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 min-h-[600px]">
        <div className="space-y-6 w-full">
          <div className="text-center space-y-2">
            <h2 className="font-editorial text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight leading-tight">
              Choose Your Interview Mode
            </h2>
          </div>

          <div className="flex flex-col md:flex-row w-full gap-6">
            {modes.map((mode) => {
              return (
                <div
                  key={mode.id}
                  className={cn(
                    "relative border-2 rounded-xl transition-all duration-300 flex flex-col md:flex-row flex-1",
                    "h-auto md:h-[480px]",
                    "border-border bg-card"
                  )}
                >
                  {/* Image with overlay text */}
                  <div className="relative w-full md:w-1/2 h-48 md:h-full rounded-t-xl md:rounded-l-xl md:rounded-t-none overflow-hidden">
                    <Image
                      src={mode.image}
                      alt={mode.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center p-4 md:p-6">
                      <h3 className="font-editorial text-2xl md:text-3xl font-extralight mb-2 md:mb-3">
                        {mode.title}
                      </h3>
                      <p className="font-pp-editorial text-sm md:text-base opacity-90">
                        {mode.subtitle}
                      </p>
                      {mode.id === 'phone' && (
                        <div className="mt-2 px-2 py-1 border border-amber-300 text-amber-100 text-xs rounded-full">
                          US only
                        </div>
                      )}
                    </div>
                    {/* Blur transition to content */}
                    <div className="absolute bottom-0 md:top-0 md:right-0 h-8 md:h-full w-full md:w-8 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-white/20 backdrop-blur-sm"></div>
                  </div>

                  {/* Content area */}
                  <div className="relative flex-1 p-4 md:p-9 flex flex-col h-full">
                    <div className="flex-grow">
                      {/* Recommended badge */}
                      <div className="font-editorial inline-block px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-extralight rounded-full mb-4 md:mb-6 bg-muted text-muted-foreground">
                        {mode.recommended}
                      </div>

                      {/* Features */}
                      <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                        {mode.features.map((feature, index) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <div key={index} className="flex items-center space-x-2 md:space-x-3">
                              <FeatureIcon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                              <span className="text-sm md:text-base text-foreground">
                                {feature.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Voice Selection - only show for web mode */}
                      {mode.id === 'web' && (
                        <div className="mb-4">
                          <VoiceSelection
                            selectedVoice={selectedVoice}
                            onVoiceChange={setSelectedVoice}
                          />
                        </div>
                      )}
                    </div>

                    {/* Circular Arrow Button - Positioned at bottom right */}
                    <button 
                      onClick={() => handleModeSelection(mode.id)}
                      disabled={mode.id === 'web' && !selectedVoice}
                      className={cn(
                        "absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
                        (mode.id === 'phone' || selectedVoice)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 cursor-pointer"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      )}
                      title={mode.id === 'web' 
                        ? (selectedVoice ? `Start ${mode.title}` : 'Select a voice to continue')
                        : `Start ${mode.title}`
                      }
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional info */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>International phone interview support coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}