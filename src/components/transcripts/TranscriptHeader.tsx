'use client';

import React from 'react';

// PhoneCall interface - matching the one from useInterviewData
interface PhoneCall {
  id: string;
  user_id: string;
  vapi_call_id: string;
  phone_number: string;
  call_status: string;
  call_duration: number;
  audio_recording_url?: string;
  transcript_text?: string;
  analysis_summary?: string;
  interview_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  voice_name?: string;
}

interface TranscriptHeaderProps {
  title?: string;
  description?: string;
  selectedPhoneCall?: PhoneCall | null;
}

export function TranscriptHeader({ 
  title = "Interview Transcripts",
  description = "Review your interview sessions, transcripts, and feedback",
  selectedPhoneCall: _selectedPhoneCall
}: TranscriptHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-3">
        <h1 className="text-4xl font-editorial font-light text-foreground tracking-tight">
          {title}
        </h1>

      </div>
      <p className="text-lg text-muted-foreground font-light mb-6">
        {description}
      </p>
    </div>
  );
}
