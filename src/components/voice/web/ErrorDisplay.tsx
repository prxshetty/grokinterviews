import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface ErrorDisplayProps {
  ttsError?: string | null;
  recordingError?: string | null;
  rateLimited?: boolean;
  rateLimitMessage?: string;
  onDismissRecordingError?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  ttsError,
  recordingError,
  rateLimited,
  rateLimitMessage,
  onDismissRecordingError,
}) => {
  // TTS Error Toast
  useEffect(() => {
    if (ttsError) {
      toast.error('TTS Error', {
        description: ttsError,
        duration: 5000,
      });
    }
  }, [ttsError]);

  // Recording Error Toast
  useEffect(() => {
    if (recordingError) {
      toast.error('Recording Error', {
        description: recordingError,
        duration: 5000,
        ...(onDismissRecordingError && { onDismiss: () => onDismissRecordingError() }),
        ...(onDismissRecordingError && { onAutoClose: () => onDismissRecordingError() }),
      });
    }
  }, [recordingError, onDismissRecordingError]);

  // Rate Limit Toast
  useEffect(() => {
    if (rateLimited) {
      toast.error('Interview Limit Reached', {
        description: rateLimitMessage || 'You can practice one interview per week.',
        duration: 8000,
      });
    }
  }, [rateLimited, rateLimitMessage]);

  // This component doesn't render anything visually itself anymore
  return null;
};

export default ErrorDisplay;