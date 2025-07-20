'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { Laptop, Phone, Zap, Clock, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?redirect=/voice');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  const handleModeSelection = (mode: 'web' | 'phone') => {
    router.push(`/voice/${mode}`);
  };

  const modes = [
    {
      id: 'web' as const,
      title: 'Web Interview',
      subtitle: 'Practice on your computer',
      icon: Laptop,
      image: '/images/webcall.jpg',
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
      image: '/images/phonecall.jpg',
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
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6 w-full">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-normal text-black dark:text-white">
              Choose Your Interview Mode
            </h2>
            <p className="text-muted-foreground lg:text-lg">
              Select how you'd like to practice your behavioral interview
            </p>
          </div>

          <div className="flex flex-col md:flex-row w-full gap-6">
            {modes.map((mode) => {
              return (
                <div
                  key={mode.id}
                  className={cn(
                    "relative border-2 rounded-xl cursor-pointer transition-all duration-300 transform flex flex-col md:flex-row flex-1",
                    "h-auto md:h-[480px]",
                    "hover:scale-[1.02] hover:shadow-lg",
                    "border-border bg-card hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                  onClick={() => handleModeSelection(mode.id)}
                >
                  {/* Image with overlay text */}
                  <div className="relative w-full md:w-1/2 h-48 md:h-full rounded-t-xl md:rounded-l-xl md:rounded-t-none overflow-hidden">
                    <Image
                      src={mode.image}
                      alt={mode.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center p-4 md:p-6">
                      <h3 className="text-2xl md:text-3xl font-semibold mb-2 md:mb-3">
                        {mode.title}
                      </h3>
                      <p className="text-sm md:text-base opacity-90">
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
                  <div className="flex-1 p-4 md:p-9 flex flex-col justify-between">
                    <div>
                      {/* Recommended badge */}
                      <div className="inline-block px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium rounded-full mb-4 md:mb-6 bg-muted text-muted-foreground">
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
                    </div>

                    {/* Call to action */}
                    <div className="min-h-[100px] md:min-h-[150px] flex items-center justify-center">
                      <button className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                        Start {mode.title}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional info */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Both modes provide the same high-quality behavioral interview practice.</p>
            <p>You can switch between modes anytime to try different experiences.</p>
            <p>International phone interview support coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}