'use client';

import { HeroSection } from '@/components/ui/hero-section-1';
import CompanyList from '@/components/home/CompanyList';
import PreviewStack from '@/components/home/preview-stack';
import VoiceHeroSection from '@/components/ui/VoiceHeroSection';
import WaveSection from '@/components/home/WaveSection';

export default function Home() {
  return (
    <div className="w-full relative font-sans animate-fade-in">
      {/* Hero Section */}
      <div>
        <HeroSection />
      </div>

      <div className="mt-20 md:mt-32 lg:mt-40 pb-16 md:pb-24 relative z-10 bg-transparent">
        <PreviewStack
          title={
            <>
              <span className="italic font-extralight">Maestro</span> of interviews
            </>
          }
          subtitle="So many features that interviews would be a breeze."
        />
      </div>

      {/* Company List Section */}
      <div className="mt-32 sm:mt-20 md:mt-24 lg:mt-28 w-full">
        <CompanyList />
      </div>

      {/* Voice Hero Section */}
      <div className="mt-16 sm:mt-16 md:mt-20 lg:mt-24 mb-12 sm:mb-16 md:mb-20">
        <VoiceHeroSection title="Voice Interview" description="Access to 3 voice interview options, complete control over your interview experience." />
      </div>

      {/* Wave Section */}
      <WaveSection />
    </div>
  );
}
