'use client';

import React, { Dispatch, SetStateAction } from 'react';
import { VoiceOption } from '@/types/voice.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VOICE_CONFIG } from '@/types/voice.types';

interface TranscriptHeaderProps {
  interviewModeFilter: string;
  onInterviewModeFilterChange: Dispatch<SetStateAction<string>>;
  voiceFilter: VoiceOption | 'all';
  onVoiceFilterChange: Dispatch<SetStateAction<VoiceOption | 'all'>>;
}

export function TranscriptHeader({
  interviewModeFilter,
  onInterviewModeFilterChange,
  voiceFilter,
  onVoiceFilterChange,
}: TranscriptHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">
        Interview Transcripts
      </h1>
      <p className="text-lg text-muted-foreground font-light mb-6">
        Review your interview sessions, transcripts, and feedback
      </p>
      
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Interview Mode
          </label>
          <Select value={interviewModeFilter} onValueChange={onInterviewModeFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select interview mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="web">Web Interviews</SelectItem>
              <SelectItem value="phone">Phone Interviews</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Voice Interviewer
          </label>
          <Select value={voiceFilter} onValueChange={(value) => onVoiceFilterChange(value as VoiceOption | 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Voices</SelectItem>
              {Object.entries(VOICE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
