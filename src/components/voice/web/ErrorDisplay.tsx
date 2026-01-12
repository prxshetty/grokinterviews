

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
  if (!ttsError && !recordingError && !rateLimited) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* TTS Error Display */}
      {ttsError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-red-500">⚠️</div>
            <div>
              <h4 className="text-red-800 dark:text-red-400 font-medium">TTS Error</h4>
              <p className="text-red-700 dark:text-red-300 text-sm">{ttsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Error Display */}
      {recordingError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-red-500">⚠️</div>
              <div>
                <h4 className="text-red-800 dark:text-red-400 font-medium">Recording Error</h4>
                <p className="text-red-700 dark:text-red-300 text-sm">{recordingError}</p>
              </div>
            </div>
            {onDismissRecordingError && (
              <button
                onClick={onDismissRecordingError}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rate Limit Message */}
      {rateLimited && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-orange-500">🚫</div>
            <div>
              <h4 className="text-orange-800 dark:text-orange-400 font-medium">Interview Limit Reached</h4>
              <p className="text-orange-700 dark:text-orange-300 text-sm">{rateLimitMessage}</p>
              <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                You can practice one interview per week. This helps ensure quality feedback and prevents system overload.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;