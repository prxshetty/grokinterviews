'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  VoicePlayer, 
  InterviewReport,
  ControlButtons,
  RecentTranscriptDisplay,
  VoicePageWithVisualizer,
  VoiceRecorderHeadless
} from '@/components/voice';
import { VoicePageWithVisualizerRef } from '@/components/voice/web/VoicePageWithVisualizer';
import { VoiceRecorderHeadlessRef } from '@/components/voice/web/VoiceRecorderHeadless';
import { VoicePlayerRef } from '@/components/voice/shared/VoicePlayer';
import { VoiceOption } from '@/components/voice/shared/VoiceSelector';

// Import our new modular components and hooks
import {
  InterviewHeader,
  InterviewAvatar,
  InterviewFeatures,
  ErrorDisplay,
} from '@/components/voice/web';

import {
  useInterviewSession,
  useVoiceControls,
  useRateLimit,
} from '@/hooks/voice';

import { InterviewService, type TerminationReason } from '@/services/interviewService';

export default function WebInterviewPageContent() {
  // Custom hooks for state management
  const { session, createSession, endSession, addToHistory, updateCurrentQuestion, setInterviewReport, setSessionActive, setSessionCompleted } = useInterviewSession();
  const { state: voiceState, setRecordingActive, setSpeakingDetected, setPlayingTTS, setProcessingAI, setAutoStartRecording, incrementAiResponseKey, setRecordingError, setTtsError, setVadSupported, resetVoiceControls } = useVoiceControls();
  const { rateLimitState, checkRateLimit, setRateLimited } = useRateLimit();

  // Local component state
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Sophia');
  const [showChat, setShowChat] = useState(true);
  const [allTranscripts, setAllTranscripts] = useState<Array<{id: string, session_id: string, transcript_text: string, interaction_type: 'user_response' | 'ai_response', created_at: string, conversation_order: number}>>([]);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  
  // Refs for cleanup
  const voicePlayerRef = useRef<VoicePlayerRef | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorderHeadlessRef | null>(null);
  const voicePageVisualizerRef = useRef<VoicePageWithVisualizerRef>(null);
  
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use ref to store router to avoid dependency issues
  const routerRef = useRef(router);
  routerRef.current = router;

  // Initialize voice selection based on URL parameter
  useEffect(() => {
    const getInitialVoice = (): VoiceOption => {
      const voiceParam = searchParams.get('voice');
      if (voiceParam === 'Gideon') {
        return 'Algieba'; // Premium male voice
      } else if (voiceParam === 'Gianna') {
        return 'Aoede'; // Premium female voice
      } else if (voiceParam === 'George') {
        return 'Marcus'; // Standard male voice
      } else if (voiceParam === 'Gia') {
        return 'Sophia'; // Standard female voice
      }
      // Default to female voice
      return 'Sophia';
    };
    
    setSelectedVoice(getInitialVoice());
  }, [searchParams]);

  // Initialize VAD support check
  useEffect(() => {
    const checkVADSupport = async () => {
      const { isVADSupported } = await import('@/utils/vadUtils');
      setVadSupported(isVADSupported());
    };
    checkVADSupport();
  }, [setVadSupported]); // setVadSupported is stable from the hook

  // Optimized transcript fetching with debouncing and caching
  const lastFetchRef = useRef<string>('');
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');
  const conversationLengthRef = useRef<number>(0);
  
  // Store stable reference to the fetch function to avoid dependency issues
  const fetchSessionTranscriptsRef = useRef<((forceRefresh?: boolean) => Promise<void>) | null>(null);
  
  // Create the fetch function with stable dependencies
  const fetchSessionTranscripts = useCallback(async (forceRefresh = false) => {
    const currentSessionId = sessionIdRef.current;
    const currentConversationLength = conversationLengthRef.current;
    
    if (!currentSessionId) {
      setAllTranscripts([]);
      return;
    }
    
    // Prevent duplicate fetches for the same session
    const fetchKey = `${currentSessionId}-${currentConversationLength}`;
    if (!forceRefresh && lastFetchRef.current === fetchKey) {
      return;
    }
    
    try {
      setIsLoadingTranscripts(true);
      const sessionTranscripts = await InterviewService.fetchSessionTranscripts(currentSessionId);
      setAllTranscripts(sessionTranscripts);
      lastFetchRef.current = fetchKey;
    } catch (error) {
      console.error('Error fetching session transcripts:', error);
      setAllTranscripts([]);
    } finally {
      setIsLoadingTranscripts(false);
    }
  }, [setAllTranscripts, setIsLoadingTranscripts]);

  // Update refs when session data changes
  useEffect(() => {
    sessionIdRef.current = session.id || '';
    conversationLengthRef.current = session.conversationHistory.length;
    fetchSessionTranscriptsRef.current = fetchSessionTranscripts;
  }, [session.id, session.conversationHistory.length, fetchSessionTranscripts]);

  // Fetch transcripts when session changes (initial load only)
  useEffect(() => {
    if (session.id) {
      fetchSessionTranscripts(true); // Force refresh on session change
    } else {
      setAllTranscripts([]);
      lastFetchRef.current = '';
    }
  }, [session.id, fetchSessionTranscripts]);

  // Debounced transcript refresh when conversation history changes
  useEffect(() => {
    if (session.id && session.conversationHistory.length > 0) {
      const lastMessage = session.conversationHistory[session.conversationHistory.length - 1];
      
      // Only fetch after AI responses (when transcripts are actually stored)
      if (lastMessage && lastMessage.type === 'ai') {
        // Clear existing timeout
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        
        // Debounce the fetch to prevent rapid successive calls
        fetchTimeoutRef.current = setTimeout(() => {
          if (fetchSessionTranscriptsRef.current) {
            fetchSessionTranscriptsRef.current();
          }
        }, 1500); // Increased delay to ensure DB write completion
      }
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [session.conversationHistory, session.id]); // Added full conversationHistory since we access the array content

  // Function to automatically terminate interview when critical errors occur
  const terminateInterviewOnError = useCallback(async (reason: TerminationReason) => {
    if (!session.isActive || !session.id) {
      return; // Nothing to terminate
    }

    console.log('🛑 Terminating interview due to error:', reason);

    try {
      await InterviewService.terminateInterview(session.id, reason, session.conversationHistory);
    } catch (error) {
      console.error('❌ Error calling termination API:', error);
    }

    // Force stop all audio operations immediately
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.forceStop();
    }
    if (voicePlayerRef.current) {
      voicePlayerRef.current.stopPlayback();
    }

    // Update UI state
    setSessionActive(false);
    setSessionCompleted(true);
    setProcessingAI(false);
    setAutoStartRecording(false);
    
    // Show appropriate error message
    if (reason.type === 'rate_limit') {
      setRateLimited(true, reason.message);
    } else {
      setRecordingError(`Interview terminated: ${reason.message}`);
    }
  }, [session.isActive, session.id, session.conversationHistory, setSessionActive, setSessionCompleted, setProcessingAI, setAutoStartRecording, setRateLimited, setRecordingError]);

  // Generate AI response based on user input
  const generateAIResponse = useCallback(async (userText: string, history: Array<{type: 'ai' | 'user', text: string}>) => {
    try {
      setProcessingAI(true);
      
      const result = await InterviewService.generateAIResponse(userText, history, session.id, 'behavioral');
      
      // Update sessionId if returned from API
      if (result.sessionId && !session.id) {
        // Note: This would need to be handled by the session hook
        console.log('New session ID received:', result.sessionId);
      }
      
      // Check if interview is completed (has report)
      if (result.interviewReport) {
        let parsedReport = result.interviewReport;
        if (typeof result.interviewReport === 'string') {
          try {
            parsedReport = JSON.parse(result.interviewReport);
          } catch {
            parsedReport = result.interviewReport;
          }
        }
        
        setInterviewReport(parsedReport);
        setSessionCompleted(true);
        setSessionActive(false);
        
        // Add final AI response to conversation history
        addToHistory('ai', result.aiResponse!);
        
        // Update the current question with final response
        updateCurrentQuestion(result.aiResponse!);
        
        // Force VoicePlayer to re-render and auto-play final response
        incrementAiResponseKey();
        
        setTimeout(() => {
          setProcessingAI(false);
        }, 100);
      } else {
        // Normal interview flow - continue with next question
        addToHistory('ai', result.aiResponse!);
        
        // Update the current question with AI response
        updateCurrentQuestion(result.aiResponse!);
        
        // Force VoicePlayer to re-render and auto-play new question
        incrementAiResponseKey();
        
        setTimeout(() => {
          setProcessingAI(false);
        }, 100);
      }

    } catch (error) {
      console.error('Error in generateAIResponse:', error);
      
      const errorMessage = error?.toString() || '';
      
      // Check for rate limit errors
      if (errorMessage.includes('RATE_LIMIT:')) {
        terminateInterviewOnError({
          type: 'rate_limit',
          message: 'Interview terminated due to API rate limits',
          details: errorMessage
        });
        return;
      }
      
      // Check for network errors that should terminate the interview
      if (errorMessage.toLowerCase().includes('network') || 
          errorMessage.toLowerCase().includes('fetch') ||
          errorMessage.toLowerCase().includes('connection') ||
          errorMessage.toLowerCase().includes('timeout')) {
        terminateInterviewOnError({
          type: 'network_error',
          message: 'Interview terminated due to network connectivity issues',
          details: errorMessage
        });
        return;
      }
      
      // For other errors, continue with fallback question
      const fallbackQuestion = "That's interesting. Can you tell me more about a specific challenge you faced and how you overcame it?";
      addToHistory('ai', fallbackQuestion);
      updateCurrentQuestion(fallbackQuestion);
      incrementAiResponseKey();
      
      setTimeout(() => {
        setProcessingAI(false);
      }, 100);
    }
  }, [session.id, setProcessingAI, setInterviewReport, setSessionCompleted, setSessionActive, addToHistory, updateCurrentQuestion, incrementAiResponseKey, terminateInterviewOnError]);

  const handleBackToModeSelector = useCallback(() => {
    router.push('/voice');
  }, [router]);

  const handleStartInterview = useCallback(async () => {
    // Stop all ongoing audio operations first
    if (voicePlayerRef.current) {
      voicePlayerRef.current.stopPlayback();
    }
    
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.forceStop();
    }
    
    // Reset states
    setProcessingAI(false);
    setAutoStartRecording(false);
    setTtsError(null);
    
    // Check rate limit before starting interview
    const canStart = await checkRateLimit('web', 'behavioral', selectedVoice);
    
    if (canStart) {
      setSessionActive(true);
      
      // Force VoicePlayer to re-render and auto-play the initial question
      incrementAiResponseKey();
      
      // Create a new session and add initial welcome message
      try {
        const newSessionId = await createSession('behavioral');
        if (newSessionId) {
          await InterviewService.addInitialWelcomeMessage(newSessionId, session.currentQuestion);
        }
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
  }, [setProcessingAI, setAutoStartRecording, setTtsError, checkRateLimit, selectedVoice, setSessionActive, incrementAiResponseKey, createSession, session.currentQuestion]);

  const handleEndInterview = useCallback(async () => {
    // Stop all voice operations immediately
    if (voicePlayerRef.current) {
      voicePlayerRef.current.stopPlayback();
    }
    
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.forceStop();
    }
    
    // Reset all states and mark session as completed
    await endSession();
    resetVoiceControls();
    incrementAiResponseKey();
  }, [endSession, resetVoiceControls, incrementAiResponseKey]);

  // Recording handler functions
  const handleStartRecording = useCallback(async () => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.startRecording();
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.stopRecording();
    }
  }, []);

  const handleDismissRecordingError = useCallback(() => {
    setRecordingError(null);
  }, [setRecordingError]);

  // Memoize the recording state change handler to prevent infinite re-renders
  const handleRecordingStateChange = useCallback((isRecording: boolean, isSpeaking: boolean) => {
    setRecordingActive(isRecording);
    setSpeakingDetected(isSpeaking);
  }, [setRecordingActive, setSpeakingDetected]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      routerRef.current.push('/signin?redirect=/voice/web');
    }
  }, [user, loading]); // Router is now accessed via ref

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
      isRecording={voiceState.isRecordingActive} 
      isSpeaking={voiceState.isSpeakingDetected}
      isPlayingTTS={voiceState.isPlayingTTS}
    >
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Back to Mode Selector Button */}
          <InterviewHeader onBackToModeSelector={handleBackToModeSelector} />

          {/* AI Avatar - Always visible, enlarges when interview is active */}
          <InterviewAvatar
            isInterviewActive={session.isActive}
            isPlayingTTS={voiceState.isPlayingTTS}
            isRecordingActive={voiceState.isRecordingActive}
            isSpeakingDetected={voiceState.isSpeakingDetected}
          />

          {/* Interview Features - Only show when interview is not active */}
          {!session.isActive && !session.isCompleted && (
            <InterviewFeatures />
          )}

          {/* Main Content */}
          <div className="w-full max-w-4xl mx-auto">
            {/* Error Display */}
            <ErrorDisplay
              ttsError={voiceState.ttsError}
              recordingError={voiceState.recordingError}
              rateLimited={rateLimitState.isRateLimited}
              rateLimitMessage={rateLimitState.rateLimitMessage}
              onDismissRecordingError={handleDismissRecordingError}
            />

            {/* Headless Voice Recorder */}
            <VoiceRecorderHeadless
              ref={voiceRecorderRef}
              onRecordingComplete={(_audioBlob) => {
                setAutoStartRecording(false);
              }}
              onTranscriptionReceived={async (text) => {
                const newHistory = [...session.conversationHistory, { type: 'user' as const, text }];
                addToHistory('user', text);
                
                // Automatically start interview when user first responds
                if (!session.isActive) {
                  setSessionActive(true);
                }
                
                // Generate AI response
                await generateAIResponse(text, newHistory);
              }}
              onRecordingStateChange={handleRecordingStateChange}
              onError={(error) => {
                setRecordingError(error);
                
                // Check for critical errors that should terminate the interview
                const errorMessage = error?.toString().toLowerCase() || '';
                
                if (errorMessage.includes('microphone') || 
                    errorMessage.includes('permission') || 
                    errorMessage.includes('not allowed') ||
                    errorMessage.includes('access denied')) {
                  terminateInterviewOnError({
                    type: 'microphone_error',
                    message: 'Interview terminated due to microphone access issues',
                    details: error
                  });
                } else if (errorMessage.includes('network') || 
                          errorMessage.includes('connection') ||
                          errorMessage.includes('timeout')) {
                  terminateInterviewOnError({
                    type: 'network_error',
                    message: 'Interview terminated due to network connectivity issues',
                    details: error
                  });
                } else if (errorMessage.includes('rate limit') || 
                          errorMessage.includes('429') ||
                          errorMessage.includes('quota')) {
                  terminateInterviewOnError({
                    type: 'rate_limit',
                    message: 'Interview terminated due to service rate limits',
                    details: error
                  });
                }
              }}
              disabled={voiceState.isProcessingAI || rateLimitState.isRateLimited}
              enableVAD={true}
              autoStart={voiceState.shouldAutoStartRecording && !rateLimitState.isRateLimited}
            />

            {/* Interview Content */}
            <div className="space-y-6">
              {/* Hidden VoicePlayer for audio functionality */}
              <div className="hidden">
                <VoicePlayer 
                  ref={voicePlayerRef}
                  key={voiceState.aiResponseKey}
                  text={session.currentQuestion} 
                  voice={selectedVoice}
                  autoPlay={(session.isActive || session.isCompleted) && !voiceState.isProcessingAI && !rateLimitState.isRateLimited}
                  onPlayStateChange={(isPlaying) => {
                    setPlayingTTS(isPlaying);
                    
                    if (voiceRecorderRef.current) {
                      if (isPlaying) {
                        voiceRecorderRef.current.pauseVAD();
                      } else {
                        voiceRecorderRef.current.resumeVAD();
                      }
                    }
                  }}
                  onAudioData={(audioData) => {
                    voicePageVisualizerRef.current?.handleAudioData(audioData);
                  }}
                  onError={(error) => {
                    setTtsError(error);
                    
                    const errorMessage = error?.toString() || '';
                    const isRateLimitError = errorMessage.includes('rate limit') || 
                                           errorMessage.includes('429') || 
                                           errorMessage.includes('Rate limit exceeded');
                    
                    if (isRateLimitError && session.isActive) {
                      terminateInterviewOnError({
                        type: 'rate_limit',
                        message: 'Interview terminated due to TTS service rate limits',
                        details: error
                      });
                    }
                  }}
                  onPlaybackComplete={() => {
                    if (session.isActive && !session.isCompleted && !rateLimitState.isRateLimited) {
                      setAutoStartRecording(true);
                    }
                  }}
                />
              </div>

              {/* Recent Transcript Display */}
              <RecentTranscriptDisplay 
                allTranscripts={allTranscripts}
                isLoadingTranscripts={isLoadingTranscripts}
                isInterviewActive={session.isActive}
                showChat={showChat}
              />
            </div>

            {/* Interview Report */}
            {session.isCompleted && session.interviewReport && (
              <div className="mt-8">
                <InterviewReport report={session.interviewReport} />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Controls */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <ControlButtons
            isInterviewActive={session.isActive}
            isProcessingAI={voiceState.isProcessingAI}
            rateLimited={rateLimitState.isRateLimited}
            onStartInterview={handleStartInterview}
            onEndInterview={handleEndInterview}
            isRecording={voiceState.isRecordingActive}
            isSpeaking={voiceState.isSpeakingDetected}
            isRecordingProcessing={voiceRecorderRef.current?.isProcessing || false}
            enableVAD={true}
            vadSupported={voiceState.vadSupported}
            recordingError={voiceState.recordingError}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onDismissRecordingError={handleDismissRecordingError}
            showChat={showChat}
            onToggleChat={() => setShowChat(!showChat)}
          />
        </div>
      </div>
    </VoicePageWithVisualizer>
  );
}