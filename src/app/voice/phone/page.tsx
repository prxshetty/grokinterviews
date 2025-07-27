'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { PhoneCallInterface } from '@/components/voice';

export default function PhoneInterviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleBackToModeSelector = () => {
    router.push('/voice');
  };

  const handleCallEnded = () => {
    // Handle call ended - could redirect to transcripts or show feedback
    router.push('/transcripts');
  };

  // Redirect to sign-in if not authenticated
  if (!loading && !user) {
    router.push('/signin?redirect=/voice/phone');
    return null;
  }

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

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Mode Selector Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToModeSelector}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>← Switch Interview Mode</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-black dark:text-white mb-6">
            Phone Interview Practice
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Practice behavioral interviews over the phone with AI-powered feedback. 
            Get a realistic phone interview experience with professional call handling.
          </p>
        </div>

        {/* Phone Call Interface */}
        <div className="max-w-4xl mx-auto space-y-8">
          <PhoneCallInterface 
            onBackToModeSelector={handleBackToModeSelector}
            onCallEnded={handleCallEnded}
          />
        </div>
      </div>
    </div>
  );
}