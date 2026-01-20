'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { LoadingSpinner } from '@/components/ui';
import { ModelSettings } from '@/components/account/model-settings';
import { PreferenceSettings } from '@/components/account/preference-settings';
import { Cpu, Settings2 } from 'lucide-react';

function AccountPageContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'model' | 'preferences'>('model');

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

  const tabs = [
    { id: 'model', label: 'Model', icon: Cpu },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
  ] as const;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pt-6 sm:pt-12 md:pt-16">
        <div className="flex flex-col mb-8">
          <h2 className="text-3xl font-editorial font-light sm:text-3xl text-gray-900 dark:text-white">
            Settings
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your AI model configuration and preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar Navigation */}
          <nav className="w-full lg:w-64 flex-shrink-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap ${isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-md scale-[1.02]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-black/60 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 ring-1 ring-gray-200/50 dark:ring-white/5">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'model' ? (
                  <ModelSettings />
                ) : (
                  <PreferenceSettings />
                )}
              </div>
            </div>
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
