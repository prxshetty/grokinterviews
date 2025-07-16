'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  VoicePlayer, 
  InterviewReport,
  ControlButtons
} from '@/components/voice';
import RecentTranscriptDisplay from '@/components/voice/RecentTranscriptDisplay';
import VoicePageWithVisualizer, { VoicePageWithVisualizerRef } from '@/components/voice/VoicePageWithVisualizer';
import VoiceRecorderHeadless, { VoiceRecorderHeadlessRef } from '@/components/voice/VoiceRecorderHeadless';
import { VoicePlayerRef } from '@/components/voice/VoicePlayer';
import { VoiceOption } from '@/components/voice/VoiceSelector';
import InterviewModeSelector, { InterviewMode } from '@/components/voice/InterviewModeSelector';
import PhoneCallInterface from '@/components/voice/PhoneCallInterface';
import CallHistory from '@/components/voice/CallHistory';

export default function VoicePage() {
  // Interview mode state
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('web');
  const [showModeSelector, setShowModeSelector] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState(
    "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
  );

  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'ai' | 'user', text: string}>>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponseKey, setAiResponseKey] = useState(0); // Force re-render of VoicePlayer

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Arista'); // Default to Arista for Groq
  const [ttsProvider, setTtsProvider] = useState<'google' | 'groq'>('groq'); // Default to Groq (free)
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [shouldAutoStartRecording, setShouldAutoStartRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>('');
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [isSpeakingDetected, setIsSpeakingDetected] = useState(false);
  const [interviewReport, setInterviewReport] = useState<{
    overall_score: number;
    summary?: string;
    detailed_feedback?: string;
    strengths: string[];
    weaknesses: string[];
    recommendations?: string[];
    improvements?: string[];
  } | null>(null);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  
  // Recording-related states
  // isRecordingProcessing is now accessed via voiceRecorderRef.current?.isProcessing
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [vadSupported, setVadSupported] = useState(false);
  const [callHistoryRefreshTrigger, setCallHistoryRefreshTrigger] = useState(0);

  // Initialize VAD support check
  useEffect(() => {
    const checkVADSupport = async () => {
      const { isVADSupported } = await import('@/utils/vadUtils');
      setVadSupported(isVADSupported());
    };
    checkVADSupport();
  }, []);

  const [allTranscripts, setAllTranscripts] = useState<Array<{id: string, session_id: string, transcript_text: string, interaction_type: 'user_response' | 'ai_response', created_at: string, conversation_order: number}>>([]);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  
  // Refs for cleanup
  const voicePlayerRef = useRef<VoicePlayerRef | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorderHeadlessRef | null>(null);
  const voicePageVisualizerRef = useRef<VoicePageWithVisualizerRef>(null);
  
  const { user, profile, loading } = useAuth();
  const router = useRouter();

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
      sessionTranscripts.sort((a: {conversation_order?: number; created_at: string}, b: {conversation_order?: number; created_at: string}) => {
        if (a.conversation_order && b.conversation_order) {
          return a.conversation_order - b.conversation_order;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      setAllTranscripts(sessionTranscripts);
    } catch {
        // Error fetching session transcripts
        setAllTranscripts([]);
    } finally {
      setIsLoadingTranscripts(false);
    }
  }, [sessionId]);

  // Check if user has already completed an interview within rate limits
  const checkRateLimit = useCallback(async (): Promise<boolean> => {
    try {
      
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
      
    } catch {
      // Failed to check rate limit
      // On error, allow the interview to proceed (fail open)
      return true;
    }
  }, []);

  // Check rate limit on component mount
  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]);

  // Fetch transcripts when session changes
  useEffect(() => {
    if (sessionId) {
      fetchSessionTranscripts();
    }
  }, [sessionId, fetchSessionTranscripts]);

  // Auto-switch voice when TTS provider changes
  useEffect(() => {
    if (ttsProvider === 'groq') {
      setSelectedVoice('Arista'); // Default female voice for Groq
    } else if (ttsProvider === 'google') {
      setSelectedVoice('Sophia'); // Default female voice for Google
    }
  }, [ttsProvider]);

  // Handler functions for control buttons
  const handleModeSelection = (mode: InterviewMode) => {
    setInterviewMode(mode);
    setShowModeSelector(false);
  };

  const handleBackToModeSelector = () => {
    setShowModeSelector(true);
    setIsInterviewActive(false);
    setIsInterviewCompleted(false);
    setInterviewReport(null);
  };

  // Handle phone call completion
  const handleCallEnded = useCallback((callId: string) => {
    console.log('Call ended:', callId);
    // Trigger call history refresh
    setCallHistoryRefreshTrigger(prev => prev + 1);
  }, []);

  const handleStartInterview = async () => {
    // Stop all ongoing audio operations first
    // Starting new interview - stopping all ongoing operations
    
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
          // New session created
          
          // Add initial welcome message to transcripts (silently, without triggering TTS)
          await addInitialWelcomeMessage(newSessionId);
        }
      } catch {
        // Error creating session
      }
    }
  };

  const handleEndInterview = () => {
    // Stop all voice operations immediately
    // Kill switch activated - stopping all voice operations
    
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
    
    // Kill switch completed - all voice operations stopped
  };



  // Recording handler functions
  const handleStartRecording = async () => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.startRecording();
    }
  };

  const handleStopRecording = async () => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.stopRecording();
    }
  };

  const handleDismissRecordingError = () => {
    setRecordingError(null);
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
        // Failed to add initial welcome message to transcripts
      } else {
        // Initial welcome message added to transcripts
      }
    } catch {
      // Error adding initial welcome message
    }
  };

  // Auto-refresh transcripts when conversation history changes (only for user responses)
  useEffect(() => {
    if (sessionId && conversationHistory.length > 0) {
      // Only refresh transcripts after user responses, not AI responses
      // This prevents redundant loading after we already have the AI response
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage && lastMessage.type === 'user') {
        // Delay to allow backend to save the transcript
        const timer = setTimeout(() => {
          fetchSessionTranscripts();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [conversationHistory, sessionId, fetchSessionTranscripts]);



  // Generate AI response based on user input
  const generateAIResponse = async (userText: string, history: Array<{type: 'ai' | 'user', text: string}>) => {
    try {
      setIsProcessingAI(true);
      
      // Generating AI response
      
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
          // Session ID set
        }
        
        // Check if interview is completed (has report)
        // In the generateAIResponse function, around line 212-214
        if (result.interviewReport) {
        // Interview completed! Report received
        
        // Parse the interview report if it's a string
        let parsedReport = result.interviewReport;
        if (typeof result.interviewReport === 'string') {
        try {
        parsedReport = JSON.parse(result.interviewReport);
        } catch {
        // Failed to parse interview report
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
          
          // AI response generated
          
          // Set processing to false after a small delay to ensure autoPlay triggers
          setTimeout(() => {
            setIsProcessingAI(false);
          }, 100);
        }
      } else {
        throw new Error('No AI response received');
      }

    } catch {
      // Failed to generate AI response
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
    <VoicePageWithVisualizer 
      ref={voicePageVisualizerRef}
      isRecording={isRecordingActive} 
      isSpeaking={isSpeakingDetected}
      isPlayingTTS={isPlayingTTS}
    >
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Interview Mode Selector */}
          {showModeSelector && (
            <div className="max-w-4xl mx-auto">
              <InterviewModeSelector
                selectedMode={interviewMode}
                onModeChange={handleModeSelection}
                disabled={rateLimited}
                className="mb-8"
              />
            </div>
          )}

          {/* Phone Call Interface */}
          {!showModeSelector && interviewMode === 'phone' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <PhoneCallInterface 
                onBackToModeSelector={handleBackToModeSelector}
                onCallEnded={handleCallEnded}
              />
              
              {/* Call History */}
              <div className="mt-8">
                <CallHistory refreshTrigger={callHistoryRefreshTrigger} />
              </div>
            </div>
          )}

          {/* Web Interview Interface */}
          {!showModeSelector && interviewMode === 'web' && (
            <>
              {/* Personalized Header - Hidden when interview is active */}
              <div className={`text-center mb-12 transition-all duration-700 ease-in-out transform ${
                isInterviewActive 
                  ? 'opacity-0 -translate-y-4 pointer-events-none h-0 mb-0 overflow-hidden' 
                  : 'opacity-100 translate-y-0 pointer-events-auto'
              }`}>
                <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                  Hey {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}, ready for quick assessment?
                </h1>
                <button
                  onClick={handleBackToModeSelector}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  ← Switch to Phone Interview
                </button>
              </div>

        {/* AI Processing Indicator - Larger when interview is active */}
        <div className={`flex justify-center transition-all duration-700 ease-out ${
          isInterviewActive ? 'mb-8' : 'mb-16'
        }`}>
          <div className={`relative transition-all duration-700 ease-out transform ${
            isInterviewActive ? 'h-64 w-64 scale-105' : 'h-48 w-48 scale-100'
          }`}>
            <div 
              className={`absolute inset-0 rounded-full transition-all duration-500 ease-in-out bg-cover bg-center bg-no-repeat transform ${
                isProcessingAI 
                  ? "opacity-95 scale-115 animate-pulse" 
                  : isInterviewActive
                  ? "opacity-90 scale-110"
                  : "opacity-70 scale-100"
              }`}
              style={{
                backgroundImage: `url('/behavior.svg')`,
                backgroundColor: 'transparent',
                filter: isProcessingAI 
                  ? 'hue-rotate(240deg) brightness(1.3) saturate(1.2)' // Blue tint when processing
                  : isInterviewActive
                  ? 'brightness(1.2) saturate(1.1) contrast(1.05)' // Enhanced when active
                  : 'brightness(1.0)' // Normal when idle
              }}
            />
          </div>
        </div>

        {/* Recent Transcript Display */}
        <RecentTranscriptDisplay
          allTranscripts={allTranscripts}
          isInterviewActive={isInterviewActive}
          isLoadingTranscripts={isLoadingTranscripts}
        />

        {/* Main Interface */}
        <div className="flex gap-6 min-h-[calc(100vh-300px)] items-start">
          {/* Main Content */}
          <div className="w-full max-w-4xl mx-auto">
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

            {/* Headless Voice Recorder */}
            <VoiceRecorderHeadless
              ref={voiceRecorderRef}
              onRecordingComplete={(_audioBlob) => {
                // Recording completed
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
              onRecordingStateChange={(isRecording, isSpeaking) => {
                setIsRecordingActive(isRecording);
                setIsSpeakingDetected(isSpeaking);
              }}
              onError={(error) => {
                setRecordingError(error);
              }}
              disabled={isProcessingAI || rateLimited} // Disable when processing AI response or rate limited
              enableVAD={true} // Enable Voice Activity Detection for auto-stop
              autoStart={shouldAutoStartRecording && !rateLimited} // Auto-start recording after TTS only if not rate limited
            />

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
                    // Update TTS playing state for visualizer
                    setIsPlayingTTS(isPlaying);
                    
                    // Pause VAD when TTS is playing to prevent false speech detection
                    if (voiceRecorderRef.current) {
                      if (isPlaying) {
                        // TTS started - pausing VAD to prevent false detection
                        voiceRecorderRef.current.pauseVAD();
                      } else {
                        // TTS stopped - resuming VAD
                        voiceRecorderRef.current.resumeVAD();
                      }
                    }
                  }}
                  onAudioData={(audioData) => {
                    // Pass audio data to visualizer via ref to avoid re-renders
                    voicePageVisualizerRef.current?.handleAudioData(audioData);
                  }}
                  onError={(error) => {
                    // TTS Error
                    setTtsError(error);
                    
                    // Check if this is a rate limit error and terminate interview immediately
                    const errorMessage = error?.toString() || '';
                    const isRateLimitError = errorMessage.includes('rate limit') || 
                                           errorMessage.includes('429') || 
                                           errorMessage.includes('Rate limit exceeded');
                    
                    if (isRateLimitError && isInterviewActive) {
                      // Rate limit detected - terminating interview immediately
                      
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
                        }).catch(_err => {
      // Error completing session
    });
                      }
                    }
                  }}
                  onPlaybackComplete={() => {
                    if (isInterviewActive && !isInterviewCompleted && !rateLimited) {
                      // TTS completed, triggering auto-start recording
                      setShouldAutoStartRecording(true);
                    } else if (isInterviewCompleted) {
                      // Final closing message TTS completed - interview finished
                    }
                  }}
                />
              </div>
            </div>

            {/* Interview Report */}
            {isInterviewCompleted && interviewReport && (
              <div className="mt-8">
                <InterviewReport report={interviewReport} />
              </div>
            )}
          </div>
          

        </div>

        {/* Fixed Bottom Controls with Integrated Settings */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <ControlButtons
            isInterviewActive={isInterviewActive}
            isProcessingAI={isProcessingAI}
            rateLimited={rateLimited}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            ttsProvider={ttsProvider}
            setTtsProvider={setTtsProvider}
            onStartInterview={handleStartInterview}
            onEndInterview={handleEndInterview}
            // Recording-related props
            isRecording={isRecordingActive}
            isSpeaking={isSpeakingDetected}
            isRecordingProcessing={voiceRecorderRef.current?.isProcessing || false}
            enableVAD={true}
            vadSupported={vadSupported}
            recordingError={recordingError}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onDismissRecordingError={handleDismissRecordingError}
          />
        </div>
              </>
            )}

        </div>
      </div>
    </VoicePageWithVisualizer>
  );
}
