'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { LoadingSpinner } from '@/components/ui';
import { AiSettingsSection } from '@/components/account/ai-settings/ai-settings-section';

function AccountPageContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-32 sm:pt-36 md:pt-40">
        <LoadingSpinner size="xl" text="Loading Settings..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pt-6 sm:pt-12 md:pt-16">
        <div className="flex flex-col">
          <div className="w-full flex-shrink-0 mb-6 sm:mb-8">
            <h2 className="text-3xl font-editorial font-light sm:text-3xl text-gray-900 dark:text-white mb-4 sm:mb-6">
              AI Settings
            </h2>
          </div>

          <div className="w-full">
            <AiSettingsSection />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen pt-32 sm:pt-36 md:pt-40">
          <LoadingSpinner size="xl" text="Loading Settings..." fullScreen={false} />
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}

export default AccountPage;
