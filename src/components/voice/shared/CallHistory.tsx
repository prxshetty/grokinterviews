'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, Clock, Calendar, Download, Play, Pause } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';

interface CallHistoryItem {
  id: string;
  callId: string;
  phoneNumber: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  cost?: number;
  recordingUrl?: string;
  transcript?: string;
  analysis?: {
    summary?: string;
    structuredData?: Record<string, any>;
    successEvaluation?: string;
  };
  createdAt: string;
}

interface CallHistoryProps {
  className?: string;
  refreshTrigger?: number; // When this changes, refresh the call history
  maxItems?: number;
}

export default function CallHistory({
  className,
  refreshTrigger,
  maxItems = 10
}: CallHistoryProps) {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  // Use ref to store maxItems to prevent infinite loops
  const maxItemsRef = useRef(maxItems);
  maxItemsRef.current = maxItems;

  // Fetch call history
  useEffect(() => {
    const fetchCallHistory = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/voice/phone-calls?userId=${user.id}&limit=${maxItemsRef.current}`);

        if (!response.ok) {
          throw new Error('Failed to fetch call history');
        }

        const data = await response.json();

        // Map database fields to component interface
        const mappedCalls = (data.calls || []).map((call: any) => ({
          id: call.id,
          callId: call.vapi_call_id,
          phoneNumber: call.phone_number,
          status: call.call_status,
          startedAt: call.created_at,
          endedAt: call.metadata?.endedAt,
          duration: call.call_duration,
          cost: call.cost,
          recordingUrl: call.audio_recording_url,
          transcript: call.transcript_text,
          analysis: {
            summary: call.analysis_summary,
            structuredData: call.metadata,
            successEvaluation: call.interview_score
          },
          createdAt: call.created_at
        }));

        setCallHistory(mappedCalls);
      } catch (err) {
        console.error('Error fetching call history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load call history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallHistory();
  }, [user?.id, refreshTrigger]); // maxItems is now accessed via ref



  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Handle audio playback
  const handlePlayAudio = async (callId: string, recordingUrl: string) => {
    try {
      if (playingAudio === callId) {
        // Pause current audio
        const audio = audioElements.get(callId);
        if (audio) {
          audio.pause();
          setPlayingAudio(null);
        }
        return;
      }

      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = audioElements.get(playingAudio);
        if (currentAudio) {
          currentAudio.pause();
        }
      }

      // Get or create audio element
      let audio = audioElements.get(callId);
      if (!audio) {
        audio = new Audio(recordingUrl);
        audio.addEventListener('ended', () => setPlayingAudio(null));
        audio.addEventListener('error', () => {
          setPlayingAudio(null);
          setError('Failed to load audio recording');
        });
        setAudioElements(prev => new Map(prev).set(callId, audio!));
      }

      setPlayingAudio(callId);
      await audio.play();
    } catch {
      // Handle audio playback error
      setError('Failed to play audio recording');
      setPlayingAudio(null);
    }
  };

  // Download transcript
  const handleDownloadTranscript = (call: CallHistoryItem) => {
    if (!call.transcript) return;

    const blob = new Blob([call.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${call.callId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ended':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'ringing':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [audioElements]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call History</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call History</h3>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (callHistory.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call History</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No phone interviews yet</p>
          <p className="text-sm">Your completed phone interviews will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call History</h3>

      <div className="space-y-3">
        {callHistory.map((call) => (
          <div
            key={call.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                {/* Call info */}
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {call.phoneNumber}
                  </span>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    getStatusColor(call.status)
                  )}>
                    {call.status}
                  </span>
                </div>

                {/* Date and duration */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(call.startedAt)}</span>
                  </div>
                  {call.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(call.duration)}</span>
                    </div>
                  )}
                </div>

                {/* Analysis summary */}
                {call.analysis?.summary && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {call.analysis.summary}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {/* Audio playback */}
                {call.recordingUrl && (
                  <button
                    onClick={() => handlePlayAudio(call.callId, call.recordingUrl!)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title={playingAudio === call.callId ? "Pause recording" : "Play recording"}
                  >
                    {playingAudio === call.callId ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Download transcript */}
                {call.transcript && (
                  <button
                    onClick={() => handleDownloadTranscript(call)}
                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Download transcript"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}