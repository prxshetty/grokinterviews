'use client';

import React from 'react';
import { TranscriptHeader, InterviewList, TranscriptDisplay } from '@/components/transcripts';
import { useInterviewData } from '@/components/voice/shared/useInterviewData';
import { useAuth } from '@/components/AuthProvider';

export default function TranscriptsPage() {
  const { profile } = useAuth();
  const {
    loading,
    interviewModeFilter,
    setInterviewModeFilter,
    filteredInterviews,
    groupedInterviews,
    selectedSession,
    selectedPhoneCall,
    selectedScore,
    loadingScore,
    activeTab,
    setActiveTab,
    isExporting,
    handleSelectInterview,
    deleteSession,
    exportSession,
    exportPhoneTranscript
  } = useInterviewData();

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-28 md:pt-32">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interview transcripts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-28 md:pt-32">
        <TranscriptHeader 
          interviewModeFilter={interviewModeFilter}
          onInterviewModeFilterChange={setInterviewModeFilter}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interview List */}
          <div className="lg:col-span-1">
            <InterviewList
              filteredInterviews={filteredInterviews}
              groupedInterviews={groupedInterviews}
              selectedSession={selectedSession}
              selectedPhoneCall={selectedPhoneCall}
              onSelectInterview={handleSelectInterview}
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
              isExporting={isExporting}
              profile={profile}
              onTabChange={setActiveTab}
              onExportSession={exportSession}
              onExportPhoneTranscript={exportPhoneTranscript}
              onDeleteSession={deleteSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
}