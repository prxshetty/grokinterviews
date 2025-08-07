'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceOption, VOICE_CONFIG } from '@/types/voice.types';

interface TranscriptHeaderProps {
  interviewModeFilter: string;
  onInterviewModeFilterChange: (value: string) => void;
  voiceFilter: VoiceOption | 'all';
  onVoiceFilterChange: (value: VoiceOption | 'all') => void;
}

export function TranscriptHeader({
  interviewModeFilter,
  onInterviewModeFilterChange,
  voiceFilter,
  onVoiceFilterChange
}: TranscriptHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">
          Interview Transcripts
        </h1>
        <p className="text-lg text-muted-foreground font-light">
          Review your interview sessions, transcripts, and feedback
        </p>
      </div>
      
      {/* Filters */}
      <div className="mt-2 flex gap-3">
        <Select value={interviewModeFilter} onValueChange={onInterviewModeFilterChange}>
          <SelectTrigger className="w-48 h-12 rounded-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <SelectValue placeholder="Interview mode" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-0 shadow-lg">
            <SelectItem value="all">All Interviews</SelectItem>
            <SelectItem value="web">Web Interviews</SelectItem>
            <SelectItem value="phone">Phone Interviews</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={voiceFilter} onValueChange={onVoiceFilterChange}>
          <SelectTrigger className="w-48 h-12 rounded-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <SelectValue placeholder="AI Voice" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-0 shadow-lg">
            <SelectItem value="all">All Voices</SelectItem>
            {Object.values(VOICE_CONFIG).map((voice) => (
              <SelectItem key={voice.technicalName} value={voice.technicalName}>
                {voice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}