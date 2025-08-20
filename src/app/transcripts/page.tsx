'use client';

import React from 'react';
import { TranscriptHeader, TranscriptList, TranscriptDisplay } from '@/components/transcripts';
import { useInterviewData } from '@/components/voice/shared/useInterviewData';
import { useAuth } from '@/components/AuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';


export default function TranscriptsPage() {
  const { profile } = useAuth();
  const {
    loading,
    voiceFilter,
    setVoiceFilter,
    groupedInterviews,
    selectedSession,
    selectedPhoneCall,
    selectedScore,
    loadingScore,
    activeTab,
    setActiveTab,
    handleSelectInterview,
  } = useInterviewData();

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-28 md:pt-32">
          <LoadingSpinner 
            size="lg" 
            color="primary" 
            text="Loading interview transcripts..." 
            centered={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-28 md:pt-32">
        <TranscriptHeader selectedPhoneCall={selectedPhoneCall} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interview List */}
          <div className="lg:col-span-1">
            <TranscriptList
              groupedInterviews={groupedInterviews}
              selectedSession={selectedSession}
              selectedPhoneCall={selectedPhoneCall}
              onSelectInterview={handleSelectInterview}
              voiceFilter={voiceFilter}
              onVoiceFilterChange={setVoiceFilter}
              
            />
          </div>

          {/* Transcript Display */}
          <div className="lg:col-span-2">
            <TranscriptDisplay
              selectedSession={selectedSession}
              selectedPhoneCall={selectedPhoneCall}
              selectedScore={selectedScore}
              loadingScore={loadingScore}
              activeTab={activeTab}
              profile={profile}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}