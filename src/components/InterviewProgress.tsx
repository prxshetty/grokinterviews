'use client';


import { getScoreColor } from '@/components/voice/shared/utils';

interface InterviewProgressProps {
  current: number;
  total: number;
  isComplete: boolean;
}

interface InterviewScore {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  detailed_feedback: string;
}

interface InterviewScoreDisplayProps {
  score: InterviewScore;
  onClose?: () => void;
}

export function InterviewProgress({ current, total, isComplete }: InterviewProgressProps) {
  const progressPercentage = (current / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {current} of {total}
        </span>
        <span className="text-sm text-gray-500">
          {isComplete ? 'Complete!' : `${Math.round(progressPercentage)}%`}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {isComplete && (
        <p className="text-center text-green-600 font-medium mt-2">
          🎉 Interview completed! Generating your score...
        </p>
      )}
    </div>
  );
}

export function InterviewScoreDisplay({ score, onClose }: InterviewScoreDisplayProps) {

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    if (score >= 5) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Interview Results
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className={`text-4xl font-bold ${getScoreColor(score.overall_score, false)}`}>
                {score.overall_score}/10
              </div>
              <div className="text-lg text-gray-600">
                {getScoreLabel(score.overall_score)}
              </div>
            </div>
          </div>

          {/* Strengths */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
              ✅ Strengths
            </h3>
            <ul className="space-y-2">
              {score.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center">
              🔄 Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {score.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
              💡 Recommendations
            </h3>
            <ul className="space-y-2">
              {score.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Feedback */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              📝 Detailed Feedback
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                {score.detailed_feedback}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Print Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rate limit message component
interface RateLimitMessageProps {
  message: string;
  onClose?: () => void;
}

export function RateLimitMessage({ message, onClose }: RateLimitMessageProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-yellow-400 text-xl">⏰</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Interview Limit Reached
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            {message}
          </p>
          <p className="mt-2 text-xs text-yellow-600">
            Your weekly limit resets every Monday.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-yellow-400 hover:text-yellow-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}