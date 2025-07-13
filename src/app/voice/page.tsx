'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { VoiceRecorder, VoiceRecorderRef } from '@/components/voice/VoiceRecorder';
import { VoicePlayer, VoicePlayerRef } from '@/components/voice/VoicePlayer';
import { VoiceSelector } from '@/components/voice/VoiceSelector';

export default function VoicePage() {
  const [currentQuestion, setCurrentQuestion] = useState(
    "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
  );
  const [userResponse, setUserResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'ai' | 'user', text: string}>>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponseKey, setAiResponseKey] = useState(0); // Force re-render of VoicePlayer
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [shouldAutoStartRecording, setShouldAutoStartRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>('');
  const [isCheckingRateLimit, setIsCheckingRateLimit] = useState(false);
  const [interviewReport, setInterviewReport] = useState<any>(null);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  
  // Refs for cleanup
  const voicePlayerRef = useRef<VoicePlayerRef | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorderRef | null>(null);
  
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check rate limit on component mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  // Check if user has already completed an interview within rate limits
  const checkRateLimit = async (): Promise<boolean> => {
    try {
      setIsCheckingRateLimit(true);
      
      const response = await fetch('/api/voice/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkRateLimit: true,
          sessionType: 'behavioral'
        }),
      });

      if (response.status === 429) {
        const errorData = await response.json();
        setRateLimited(true);
        setRateLimitMessage(errorData.message || 'You have already completed an interview this week. Please try again next week.');
        return false;
      }
      
      if (!response.ok) {
        throw new Error('Failed to check rate limit');
      }
      
      // If we get here, user is not rate limited
      setRateLimited(false);
      setRateLimitMessage('');
      return true;
      
    } catch (error: any) {
      console.error('❌ Failed to check rate limit:', error);
      // On error, allow the interview to proceed (fail open)
      return true;
    } finally {
      setIsCheckingRateLimit(false);
    }
  };

  // Generate AI response based on user input
  const generateAIResponse = async (userText: string, history: Array<{type: 'ai' | 'user', text: string}>) => {
    try {
      setIsProcessingAI(true);
      
      console.log('🤖 Generating AI response for:', userText.substring(0, 50) + '...');
      
      const response = await fetch('/api/voice/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: userText,
          conversationHistory: history,
          sessionId: sessionId,
          sessionType: 'behavioral'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI response');
      }

      const result = await response.json();
      
      if (result.success && result.aiResponse) {
        // Update sessionId if returned from API
        if (result.sessionId && !sessionId) {
          setSessionId(result.sessionId);
          console.log('📝 Session ID set:', result.sessionId);
        }
        
        // Check if interview is completed (has report)
        if (result.interviewReport) {
          console.log('🎯 Interview completed! Report received:', result.interviewReport);
          setInterviewReport(result.interviewReport);
          setIsInterviewCompleted(true);
          setIsInterviewActive(false);
          
          // Add final AI response to conversation history
          setConversationHistory(prev => [...prev, { type: 'ai' as const, text: result.aiResponse }]);
          
          // Update the current question with final response
          setCurrentQuestion(result.aiResponse);
          
          // Force VoicePlayer to re-render and auto-play final response
          setAiResponseKey(prev => prev + 1);
          
          // Set processing to false after a small delay
          setTimeout(() => {
            setIsProcessingAI(false);
          }, 100);
        } else {
          // Normal interview flow - continue with next question
          // Add AI response to conversation history first
          setConversationHistory(prev => [...prev, { type: 'ai' as const, text: result.aiResponse }]);
          
          // Update the current question with AI response
          setCurrentQuestion(result.aiResponse);
          
          // Force VoicePlayer to re-render and auto-play new question
          setAiResponseKey(prev => prev + 1);
          
          console.log('✅ AI response generated:', result.aiResponse.substring(0, 100) + '...');
          
          // Set processing to false after a small delay to ensure autoPlay triggers
          setTimeout(() => {
            setIsProcessingAI(false);
          }, 100);
        }
      } else {
        throw new Error('No AI response received');
      }

    } catch (error: any) {
      console.error('❌ Failed to generate AI response:', error);
      // Fallback to a generic follow-up question
      const fallbackQuestion = "That's interesting. Can you tell me more about a specific challenge you faced and how you overcame it?";
      setConversationHistory(prev => [...prev, { type: 'ai' as const, text: fallbackQuestion }]);
      setCurrentQuestion(fallbackQuestion);
      setAiResponseKey(prev => prev + 1);
      
      // Set processing to false after a small delay to ensure autoPlay triggers
      setTimeout(() => {
        setIsProcessingAI(false);
      }, 100);
    }
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?redirect=/voice');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Voice Interview Practice
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Practice behavioral interviews with AI-powered voice conversations using Google Cloud Text-to-Speech. 
            Get real-time feedback and improve your interview skills.
          </p>
        </div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Voice Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Choose AI Interviewer Voice
              </h3>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* TTS Error Display */}
            {ttsError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="text-red-500">⚠️</div>
                  <div>
                    <h4 className="text-red-800 dark:text-red-400 font-medium">TTS Error</h4>
                    <p className="text-red-700 dark:text-red-300 text-sm">{ttsError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limit Message */}
            {rateLimited && (
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
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

            {/* Interview Status */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                {isInterviewActive ? `Interview Active • Voice: ${selectedVoice}` : `Ready to Start • Voice: ${selectedVoice}`}
              </div>
            </div>

            {/* Voice Recorder */}
            <div className="mb-8">
              <VoiceRecorder
                ref={voiceRecorderRef}
                onRecordingComplete={(audioBlob) => {
                  console.log('Recording completed:', audioBlob);
                  setShouldAutoStartRecording(false); // Reset auto-start after recording
                }}
                onTranscriptionReceived={async (text) => {
                  setUserResponse(text);
                  const newHistory = [...conversationHistory, { type: 'user' as const, text }];
                  setConversationHistory(newHistory);
                  
                  // Automatically start interview when user first responds
                  if (!isInterviewActive) {
                    setIsInterviewActive(true);
                  }
                  
                  // Generate AI response
                  await generateAIResponse(text, newHistory);
                }}
                disabled={isProcessingAI || rateLimited} // Disable when processing AI response or rate limited
                enableVAD={true} // Enable Voice Activity Detection for auto-stop
                autoStart={shouldAutoStartRecording && !rateLimited} // Auto-start recording after TTS only if not rate limited
              />
            </div>

            {/* Interview Content */}
            <div className="space-y-6">
              {/* AI Question */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Interviewer
                    </h3>
                    {isAISpeaking && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600 dark:text-blue-400">Speaking...</span>
                      </div>
                    )}
                  </div>
                  <VoicePlayer 
                    ref={voicePlayerRef}
                    key={aiResponseKey} // Force re-render when question changes
                    text={currentQuestion} 
                    voice={selectedVoice}
                    autoPlay={isInterviewActive && !isProcessingAI && !rateLimited} // Only auto-play when interview is active, not processing AI response, and not rate limited
                    className="ml-4"
                    onPlayStateChange={setIsAISpeaking}
                    onError={(error) => setTtsError(error)}
                    onPlaybackComplete={() => {
                      if (isInterviewActive && !rateLimited) {
                        console.log('🎤 TTS completed, triggering auto-start recording');
                        setShouldAutoStartRecording(true);
                      }
                    }}
                  />
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {currentQuestion}
                </p>
              </div>

              {/* User Response Area */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Your Response
                </h3>
                {isProcessingAI ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-blue-600 dark:text-blue-400 italic">
                      AI is thinking of a follow-up question...
                    </p>
                  </div>
                ) : userResponse ? (
                  <p className="text-gray-700 dark:text-gray-300">
                    {userResponse}
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    Your response will appear here after recording...
                  </p>
                )}
              </div>
            </div>

            {/* Interview Report */}
            {isInterviewCompleted && interviewReport && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🎯 Interview Report
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Score */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {interviewReport.overall_score}/10
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                    </div>
                    
                    {/* Individual Scores */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Communication</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{interviewReport.communication_score}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Problem Solving</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{interviewReport.problem_solving_score}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Leadership</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{interviewReport.leadership_score}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Technical Skills</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{interviewReport.technical_score}/10</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feedback */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Detailed Feedback</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">✅ Strengths</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{interviewReport.strengths}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">🎯 Areas for Improvement</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{interviewReport.areas_for_improvement}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">💡 Recommendations</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{interviewReport.recommendations}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interview Conversation
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  {conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.type === 'ai'
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                          : 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          {message.type === 'ai' ? '🤖 Interviewer' : '👤 You'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {message.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Controls */}
            <div className="mt-8 flex justify-center space-x-4">
              {isInterviewCompleted ? (
                <button
                  onClick={async () => {
                    // Reset all states for new interview
                    setIsInterviewActive(false);
                    setUserResponse('');
                    setConversationHistory([]);
                    setIsProcessingAI(false);
                    setShouldAutoStartRecording(false);
                    setIsAISpeaking(false);
                    setTtsError(null);
                    setInterviewReport(null);
                    setIsInterviewCompleted(false);
                    setSessionId(null);
                    setCurrentQuestion(
                      "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
                    );
                    setAiResponseKey(prev => prev + 1);
                    
                    // Check rate limit before starting new interview
                    const canStart = await checkRateLimit();
                    
                    if (canStart) {
                      setIsInterviewActive(true);
                      // Force VoicePlayer to re-render and auto-play the initial question
                      setAiResponseKey(prev => prev + 2);
                    }
                  }}
                  disabled={isCheckingRateLimit || rateLimited}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isCheckingRateLimit || rateLimited
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isCheckingRateLimit ? 'Checking...' : rateLimited ? 'Interview Unavailable' : 'Start New Interview'}
                </button>
              ) : !isInterviewActive ? (
                <button
                  onClick={async () => {
                    // Check rate limit before starting interview
                    const canStart = await checkRateLimit();
                    
                    if (canStart) {
                      setIsInterviewActive(true);
                      // Force VoicePlayer to re-render and auto-play the initial question
                      setAiResponseKey(prev => prev + 1);
                    }
                    // If rate limited, the checkRateLimit function will set the appropriate state
                  }}
                  disabled={isCheckingRateLimit || rateLimited}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isCheckingRateLimit || rateLimited
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isCheckingRateLimit ? 'Checking...' : rateLimited ? 'Interview Unavailable' : 'Start Interview'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Stop all voice operations immediately
                    console.log('🛑 Kill switch activated - stopping all voice operations');
                    
                    // Stop VoicePlayer if playing
                    if (voicePlayerRef.current) {
                      voicePlayerRef.current.stopPlayback();
                    }
                    
                    // Stop VoiceRecorder if recording
                    if (voiceRecorderRef.current) {
                      voiceRecorderRef.current.forceStop();
                    }
                    
                    // Reset all states
                    setIsInterviewActive(false);
                    setUserResponse('');
                    setConversationHistory([]);
                    setIsProcessingAI(false);
                    setShouldAutoStartRecording(false);
                    setIsAISpeaking(false);
                    setTtsError(null);
                    setInterviewReport(null);
                    setIsInterviewCompleted(false);
                    setSessionId(null);
                    setCurrentQuestion(
                      "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
                    );
                    setAiResponseKey(prev => prev + 1);
                    
                    console.log('✅ Kill switch completed - all voice operations stopped');
                  }}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  End Interview
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                How it works:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Listen to the AI question (it will play automatically)</li>
                <li>• Click the microphone to start recording your response</li>
                <li>• ⚡ Smart recording will automatically stop when you finish speaking</li>
                <li>• Your speech will be converted to text automatically</li>
                <li>• The AI will ask follow-up questions based on your responses</li>
                <li>• Practice common behavioral interview scenarios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
