'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { VoiceRecorder, VoiceRecorderRef } from '@/components/voice/VoiceRecorder';
import { VoicePlayer, VoicePlayerRef } from '@/components/voice/VoicePlayer';
import { VoiceSelector, VoiceOption } from '@/components/voice/VoiceSelector';

export default function VoicePage() {
  const [currentQuestion, setCurrentQuestion] = useState(
    "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
  );

  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'ai' | 'user', text: string}>>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponseKey, setAiResponseKey] = useState(0); // Force re-render of VoicePlayer

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Sophia');
  const [ttsProvider, setTtsProvider] = useState<'google' | 'groq'>('groq'); // Default to Groq (free)
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [shouldAutoStartRecording, setShouldAutoStartRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>('');
  const [isCheckingRateLimit, setIsCheckingRateLimit] = useState(false);
  const [interviewReport, setInterviewReport] = useState<any>(null);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [showTranscriptsPane, setShowTranscriptsPane] = useState(false);
  const [allTranscripts, setAllTranscripts] = useState<Array<{id: string, session_id: string, transcript_text: string, interaction_type: 'user' | 'ai', created_at: string, conversation_order: number}>>([]);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  
  // Refs for cleanup
  const voicePlayerRef = useRef<VoicePlayerRef | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorderRef | null>(null);
  
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check rate limit on component mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  // Function to fetch transcripts for current session only
  const fetchSessionTranscripts = useCallback(async () => {
    if (!sessionId) {
      setAllTranscripts([]);
      return;
    }
    
    try {
      setIsLoadingTranscripts(true);
      const response = await fetch(`/api/voice/sessions?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session transcripts');
      }
      
      const data = await response.json();
      
      // Get transcripts for the current session only
      const sessionTranscripts = data.transcripts || [];
      
      // Sort by conversation_order or created_at ascending (chronological order)
      sessionTranscripts.sort((a: any, b: any) => {
        if (a.conversation_order && b.conversation_order) {
          return a.conversation_order - b.conversation_order;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      setAllTranscripts(sessionTranscripts);
    } catch (error) {
      console.error('Error fetching session transcripts:', error);
      setAllTranscripts([]);
    } finally {
      setIsLoadingTranscripts(false);
    }
  }, [sessionId]);

  // Function to toggle transcripts pane
  const toggleTranscriptsPane = () => {
    if (!showTranscriptsPane) {
      fetchSessionTranscripts();
    }
    setShowTranscriptsPane(!showTranscriptsPane);
  };

  // Function to add initial welcome message to transcripts
  const addInitialWelcomeMessage = async (newSessionId: string) => {
    try {
      const response = await fetch('/api/voice/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          transcriptText: currentQuestion,
          interactionType: 'ai_response',
          conversationOrder: 0
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to add initial welcome message to transcripts');
      } else {
        console.log('✅ Initial welcome message added to transcripts');
      }
    } catch (error) {
      console.error('Error adding initial welcome message:', error);
    }
  };

  // Update transcripts when sessionId changes
  useEffect(() => {
    if (sessionId && showTranscriptsPane) {
      fetchSessionTranscripts();
    }
  }, [sessionId, showTranscriptsPane, fetchSessionTranscripts]);

  // Auto-refresh chat when conversation history changes
  useEffect(() => {
    if (sessionId && showTranscriptsPane && conversationHistory.length > 0) {
      // Delay to allow backend to save the transcript
      const timer = setTimeout(() => {
        fetchSessionTranscripts();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [conversationHistory, sessionId, showTranscriptsPane, fetchSessionTranscripts]);

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
        // In the generateAIResponse function, around line 212-214
        if (result.interviewReport) {
        console.log('🎯 Interview completed! Report received:', result.interviewReport);
        
        // Parse the interview report if it's a string
        let parsedReport = result.interviewReport;
        if (typeof result.interviewReport === 'string') {
        try {
        parsedReport = JSON.parse(result.interviewReport);
        } catch (error) {
        console.error('Failed to parse interview report:', error);
        parsedReport = result.interviewReport; // Use as-is if parsing fails
        }
        }
        
        setInterviewReport(parsedReport);
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
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Voice Interview Practice
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Practice behavioral interviews with AI-powered voice conversations using Groq TTS (free) or Google Cloud TTS (premium). 
            Get real-time feedback and improve your interview skills.
          </p>
        </div>

        {/* Main Interface */}
        <div className="flex gap-6">
          {/* Main Content */}
          <div className={`transition-all duration-300 ${showTranscriptsPane ? 'w-3/5' : 'w-full max-w-4xl mx-auto'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              {/* Voice Selection */}
              <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Choose AI Interviewer Voice
              </h3>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                ttsProvider={ttsProvider}
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* TTS Provider Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Choose TTS Provider
              </h3>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setTtsProvider('groq')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    ttsProvider === 'groq'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>🚀</span>
                    <div className="text-left">
                      <div className="font-semibold">Groq TTS</div>
                      <div className="text-xs opacity-75">Free • Fast • 23 Voices</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setTtsProvider('google')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    ttsProvider === 'google'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>🎯</span>
                    <div className="text-left">
                      <div className="font-semibold">Google Cloud TTS</div>
                      <div className="text-xs opacity-75">Premium • High Quality</div>
                    </div>
                  </div>
                </button>
              </div>
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
              {/* Hidden VoicePlayer for audio functionality */}
              <div className="hidden">
                <VoicePlayer 
                  ref={voicePlayerRef}
                  key={aiResponseKey}
                  text={currentQuestion} 
                  voice={selectedVoice}
                  ttsProvider={ttsProvider}
                  autoPlay={(isInterviewActive || isInterviewCompleted) && !isProcessingAI && !rateLimited}
                  onPlayStateChange={(isPlaying) => {
                    // Pause VAD when TTS is playing to prevent false speech detection
                    if (voiceRecorderRef.current) {
                      if (isPlaying) {
                        console.log('🔇 TTS started - pausing VAD to prevent false detection');
                        voiceRecorderRef.current.pauseVAD();
                      } else {
                        console.log('🎤 TTS stopped - resuming VAD');
                        voiceRecorderRef.current.resumeVAD();
                      }
                    }
                  }}
                  onError={(error) => {
                    console.error('🚨 TTS Error:', error);
                    setTtsError(error);
                    
                    // Check if this is a rate limit error and terminate interview immediately
                    const errorMessage = error?.toString() || '';
                    const isRateLimitError = errorMessage.includes('rate limit') || 
                                           errorMessage.includes('429') || 
                                           errorMessage.includes('Rate limit exceeded');
                    
                    if (isRateLimitError && isInterviewActive) {
                      console.log('🛑 Rate limit detected - terminating interview immediately');
                      
                      // Immediately terminate the interview
                      setIsInterviewActive(false);
                      setIsInterviewCompleted(true);
                      setRateLimited(true);
                      setRateLimitMessage('Interview terminated due to TTS rate limit. Please try again later.');
                      
                      // Force stop all audio operations
                      if (voiceRecorderRef.current) {
                        voiceRecorderRef.current.forceStop();
                      }
                      if (voicePlayerRef.current) {
                        voicePlayerRef.current.stopPlayback();
                      }
                      
                      // Complete the session in database with rate limit reason
                      if (sessionId) {
                        fetch('/api/voice/sessions', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            sessionId,
                            action: 'complete',
                            reason: 'tts_rate_limit'
                          }),
                        }).catch(err => console.error('Error completing session:', err));
                      }
                    }
                  }}
                  onPlaybackComplete={() => {
                    if (isInterviewActive && !isInterviewCompleted && !rateLimited) {
                      console.log('🎤 TTS completed, triggering auto-start recording');
                      setShouldAutoStartRecording(true);
                    } else if (isInterviewCompleted) {
                      console.log('🎉 Final closing message TTS completed - interview finished');
                    }
                  }}
                />
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
                    
                    {/* Summary */}
                    <div className="space-y-3">
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Interview Summary</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {interviewReport.detailed_feedback || 'No detailed feedback available.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feedback */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Detailed Feedback</h4>
                    <div className="space-y-4">
                      {/* Strengths */}
                      {interviewReport.strengths && interviewReport.strengths.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">✅ Strengths</h5>
                          <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                            {interviewReport.strengths.map((strength: any, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Weaknesses */}
                      {interviewReport.weaknesses && interviewReport.weaknesses.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">🎯 Areas for Improvement</h5>
                          <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                            {interviewReport.weaknesses.map((weakness: any, index: number) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Improvements/Recommendations */}
                      {interviewReport.improvements && interviewReport.improvements.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">💡 Recommendations</h5>
                          <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                            {interviewReport.improvements.map((improvement: any, index: number) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Interview Controls - Fixed at bottom center */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center space-x-4 z-50">
              {isInterviewCompleted ? (
                <button
                  onClick={async () => {
                    // Reset all states for new interview
                    setIsInterviewActive(false);
                    setConversationHistory([]);
                    setIsProcessingAI(false);
                    setShouldAutoStartRecording(false);
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
                      
                      // Create a new session and add initial welcome message (without triggering additional TTS)
                      try {
                        const response = await fetch('/api/voice/sessions', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            sessionType: 'behavioral'
                          }),
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          const newSessionId = result.session.id;
                          setSessionId(newSessionId);
                          console.log('✅ New session created:', newSessionId);
                          
                          // Add initial welcome message to transcripts (silently, without triggering TTS)
                          await addInitialWelcomeMessage(newSessionId);
                        }
                      } catch (error) {
                        console.error('Error creating session:', error);
                      }
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
                <>
                  {/* Microphone Permission Button */}
                  <button
                    onClick={async () => {
                      if (voiceRecorderRef.current) {
                        const hasPermission = await voiceRecorderRef.current.requestMicrophonePermission();
                        if (hasPermission) {
                          alert('✅ Microphone access granted! You can now start the interview.');
                        } else {
                          alert('❌ Microphone access denied. Please allow microphone access in your browser settings to use voice features.');
                        }
                      }
                    }}
                    className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>🎤</span>
                    <span>Test Microphone</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      // Stop all ongoing audio operations first
                      console.log('🔄 Starting new interview - stopping all ongoing operations');
                      
                      // Stop VoicePlayer if playing
                      if (voicePlayerRef.current) {
                        voicePlayerRef.current.stopPlayback();
                      }
                      
                      // Stop VoiceRecorder if recording
                      if (voiceRecorderRef.current) {
                        voiceRecorderRef.current.forceStop();
                      }
                      
                      // Reset states
                      setIsProcessingAI(false);
                      setShouldAutoStartRecording(false);
                      setTtsError(null);
                      
                      // Check rate limit before starting interview
                      const canStart = await checkRateLimit();
                      
                      if (canStart) {
                        setIsInterviewActive(true);
                        
                        // Force VoicePlayer to re-render and auto-play the initial question
                        setAiResponseKey(prev => prev + 1);
                        
                        // Create a new session and add initial welcome message (without triggering additional TTS)
                        try {
                          const response = await fetch('/api/voice/sessions', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              sessionType: 'behavioral'
                            }),
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            const newSessionId = result.session.id;
                            setSessionId(newSessionId);
                            console.log('✅ New session created:', newSessionId);
                            
                            // Add initial welcome message to transcripts (silently, without triggering TTS)
                            await addInitialWelcomeMessage(newSessionId);
                          }
                        } catch (error) {
                          console.error('Error creating session:', error);
                        }
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
                </>
              ) : (
                <>
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
                      setConversationHistory([]);
                      setIsProcessingAI(false);
                      setShouldAutoStartRecording(false);
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
                </>
              )}
              
              {/* Chat Button */}
              <button
                onClick={toggleTranscriptsPane}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  showTranscriptsPane
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>💬</span>
                  <span>{showTranscriptsPane ? 'Hide Chat' : 'View Chat'}</span>
                </div>
              </button>
            </div>
        
        {/* Chat Interface Right Pane */}
        {showTranscriptsPane && (
          <div className="w-2/5 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col h-[calc(100vh-100px)]">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Interview Chat
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sessionId ? `Session: ${sessionId.slice(-8)}` : 'No active session'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTranscriptsPane(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingTranscripts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading conversation...</span>
                </div>
              ) : allTranscripts.length > 0 ? (
                allTranscripts.map((transcript: any, index: number) => (
                  <div
                    key={transcript.id || index}
                    className={`flex ${
                      transcript.interaction_type === 'ai_response' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        transcript.interaction_type === 'ai_response'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                          : 'bg-blue-600 text-white rounded-br-sm'
                      }`}
                    >
                      {/* Message Header */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium opacity-75">
                          {transcript.interaction_type === 'ai_response' ? '🤖 Interviewer' : '👤 You'}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(transcript.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Message Content */}
                      <p className="text-sm leading-relaxed">
                        {transcript.transcript_text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No conversation yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {sessionId 
                      ? 'Your conversation will appear here as you chat with the interviewer.'
                      : 'Start an interview to see your conversation history.'
                    }
                  </p>
                </div>
              )}
            </div>
            
            {/* Chat Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>
                  {isInterviewActive 
                    ? (isProcessingAI ? 'AI is thinking...' : 'Interview in progress')
                    : 'Interview not active'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
