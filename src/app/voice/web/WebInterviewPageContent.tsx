'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ControlButtons,
  VoicePageWithVisualizer
} from '@/components/voice';
import { VoicePageWithVisualizerRef } from '@/components/voice/web/VoicePageWithVisualizer';
import { VoiceRecorderHeadlessRef } from '@/components/voice/web/VoiceRecorderHeadless';
import { VoicePlayerRef } from '@/components/voice/shared/VoicePlayer';
import { type VoiceOption } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Import our new modular components and hooks
import {
  InterviewHeader,
  InterviewContent,
} from '@/components/voice/web';
import InterviewSelectionPanel from '@/components/voice/web/InterviewSelectionPanel';
import InterviewConfigPanel from '@/components/voice/web/InterviewConfigPanel';
import { InterviewType } from '@/components/voice/web/InterviewAvatar';
import { InterviewModeConfig } from '@/app/api/voice/types';

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
  
  // Interview type and custom configuration state
  const [selectedInterviewType, setSelectedInterviewType] = useState<InterviewType>('behavioral');
  const [customConfig, setCustomConfig] = useState<InterviewModeConfig>({
    customTopics: '',
    questionFormat: '',
    difficulty: ''
  });
  const [customConfigErrors, setCustomConfigErrors] = useState<Record<string, string>>({});
  
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
      try {
        const { isVADSupported } = await import('@/utils/vadUtils');
        setVadSupported(isVADSupported());
      } catch (error) {
        console.error('Error checking VAD support:', error);
        // Default to false if VAD check fails
        setVadSupported(false);
      }
    };
    checkVADSupport();
  }, [setVadSupported]); // setVadSupported is stable from the hook

  // Optimized transcript fetching with debouncing and caching
  const lastFetchRef = useRef<string>('');
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');
  const conversationLengthRef = useRef<number>(0);
  const conversationHistoryRef = useRef<Array<{type: 'ai' | 'user', text: string}>>([]);
  
  // Create a stable fetch function using useCallback with stable dependencies
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
  }, []); // Empty dependency array since we use refs for dynamic values
  
  // Store the function in a ref for use in timeouts
  const fetchSessionTranscriptsRef = useRef(fetchSessionTranscripts);
  fetchSessionTranscriptsRef.current = fetchSessionTranscripts;

  // Update refs when session data changes
  useEffect(() => {
    sessionIdRef.current = session.id || '';
    conversationLengthRef.current = session.conversationHistory.length;
    conversationHistoryRef.current = session.conversationHistory;
  }, [session.id, session.conversationHistory.length]);

  // Fetch transcripts when session changes (initial load only)
  useEffect(() => {
    if (session.id) {
      fetchSessionTranscriptsRef.current?.(true); // Force refresh on session change
    } else {
      setAllTranscripts([]);
      lastFetchRef.current = '';
    }
  }, [session.id]); // Removed fetchSessionTranscripts from dependency array

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
  }, [session.conversationHistory.length, session.id]); // Only depend on length, not the entire array

  // Function to automatically terminate interview when critical errors occur
  const terminateInterviewOnError = useCallback(async (reason: TerminationReason) => {
    if (!session.isActive || !session.id) {
      return; // Nothing to terminate
    }

    console.log('🛑 Terminating interview due to error:', reason);

    try {
      await InterviewService.terminateInterview(session.id, reason, conversationHistoryRef.current);
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
  }, [session.isActive, session.id, setSessionActive, setSessionCompleted, setProcessingAI, setAutoStartRecording, setRateLimited, setRecordingError]);

  // Generate AI response based on user input
  const generateAIResponse = useCallback(async (userText: string, history: Array<{type: 'ai' | 'user', text: string}>) => {
    try {
      setProcessingAI(true);
      
      const result = await InterviewService.generateAIResponse(userText, history, sessionIdRef.current, 'behavioral');
      
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
  }, [setProcessingAI, setInterviewReport, setSessionCompleted, setSessionActive, addToHistory, updateCurrentQuestion, incrementAiResponseKey, terminateInterviewOnError]);

  const handleBackToModeSelector = useCallback(() => {
    router.push('/voice');
  }, [router]);

  const handleInterviewTypeChange = useCallback((type: InterviewType) => {
    setSelectedInterviewType(type);
    // Clear custom config errors when switching types
    setCustomConfigErrors({});
  }, []);

  const handleCustomConfigChange = useCallback((config: InterviewModeConfig) => {
    setCustomConfig(config);
    // Clear errors for fields that have been filled
    const newErrors = { ...customConfigErrors };
    if (config.customTopics?.trim()) delete newErrors.customTopics;
    if (config.questionFormat?.trim()) delete newErrors.questionFormat;
    if (config.difficulty?.trim()) delete newErrors.difficulty;
    setCustomConfigErrors(newErrors);
  }, [customConfigErrors]);

  const validateCustomConfig = useCallback(() => {
    if (selectedInterviewType !== 'custom') return true;
    
    const errors: Record<string, string> = {};
    if (!customConfig.customTopics?.trim()) {
      errors.customTopics = 'Please specify the topics you want to practice';
    }
    if (!customConfig.questionFormat?.trim()) {
      errors.questionFormat = 'Please select a question format';
    }
    if (!customConfig.difficulty?.trim()) {
      errors.difficulty = 'Please select a difficulty level';
    }
    
    setCustomConfigErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedInterviewType, customConfig]);

  const handleStartInterview = useCallback(async () => {
    try {
      // Validate custom config if custom interview type is selected
      if (!validateCustomConfig()) {
        return; // Don't start if validation fails
      }

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
      
      // Map interview type to session type
      const sessionType = selectedInterviewType === 'system-design' ? 'technical' : 
                          selectedInterviewType === 'custom' ? 'behavioral' : 
                          selectedInterviewType;
      
      // Check rate limit before starting interview
      const canStart = await checkRateLimit('web', sessionType as any, selectedVoice);
      
      if (canStart) {
        setSessionActive(true);
        
        // Force VoicePlayer to re-render and auto-play the initial question
        incrementAiResponseKey();
        
        // Create a new session and add initial welcome message
        try {
          const newSessionId = await createSession(sessionType as any, selectedVoice);
          if (newSessionId) {
            await InterviewService.addInitialWelcomeMessage(newSessionId, session.currentQuestion);
          }
        } catch (error) {
          console.error('Error creating session:', error);
          // Don't throw here - let the interview continue even if session creation fails
        }
      }
    } catch (error) {
      console.error('Error in handleStartInterview:', error);
      // Reset states if something goes wrong
      setProcessingAI(false);
      setAutoStartRecording(false);
    }
  }, [validateCustomConfig, setProcessingAI, setAutoStartRecording, setTtsError, selectedInterviewType, checkRateLimit, selectedVoice, setSessionActive, incrementAiResponseKey, createSession, session.currentQuestion]);

  const handleEndInterview = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error('Error in handleEndInterview:', error);
      // Even if endSession fails, we should still reset the UI state
      resetVoiceControls();
      incrementAiResponseKey();
    }
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
      <div className="min-h-screen">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          text="Loading interview..." 
          centered={true}
        />
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
        <div className="container mx-auto px-4 py-2">
          {/* Back to Mode Selector Button */}
          <InterviewHeader onBackToModeSelector={handleBackToModeSelector} />

          {/* Pre-Interview Setup: Left-Right Layout */}
          {!session.isActive && !session.isCompleted && (
            <div className="grid lg:grid-cols-5 gap-6 mb-4">
              {/* Left Panel: Avatar Selection - 60% (3 columns) */}
              <div className="lg:col-span-3 flex justify-center">
                <InterviewSelectionPanel
                  selectedType={selectedInterviewType}
                  onTypeChange={handleInterviewTypeChange}
                  isInterviewActive={session.isActive}
                  isPlayingTTS={voiceState.isPlayingTTS}
                  isRecordingActive={voiceState.isRecordingActive}
                  isSpeakingDetected={voiceState.isSpeakingDetected}
                  customConfig={customConfig}
                  onCustomConfigChange={handleCustomConfigChange}
                  customConfigErrors={customConfigErrors}
                />
              </div>

              {/* Right Panel: Interview Configuration - 40% (2 columns) */}
              <div className="lg:col-span-2">
                <InterviewConfigPanel
                  selectedType={selectedInterviewType}
                  config={customConfig}
                  onConfigChange={handleCustomConfigChange}
                  errors={customConfigErrors}
                  isInterviewActive={session.isActive}
                  isProcessingAI={voiceState.isProcessingAI}
                  rateLimited={rateLimitState.isRateLimited}
                />
              </div>
            </div>
          )}

          {/* Active Interview: Show avatar only */}
          {(session.isActive || session.isCompleted) && (
            <div className="flex justify-center mb-4">
              <InterviewSelectionPanel
                selectedType={selectedInterviewType}
                onTypeChange={handleInterviewTypeChange}
                isInterviewActive={session.isActive}
                isPlayingTTS={voiceState.isPlayingTTS}
                isRecordingActive={voiceState.isRecordingActive}
                isSpeakingDetected={voiceState.isSpeakingDetected}
                customConfig={customConfig}
                onCustomConfigChange={handleCustomConfigChange}
                customConfigErrors={customConfigErrors}
              />
            </div>
          )}

          {/* Main Interview Content */}
          <InterviewContent
            sessionId={session.id}
            isActive={session.isActive}
            isCompleted={session.isCompleted}
            currentQuestion={session.currentQuestion}
            conversationHistory={session.conversationHistory}
            interviewReport={session.interviewReport}
            voiceState={voiceState}
            rateLimitState={rateLimitState}
            allTranscripts={allTranscripts}
            isLoadingTranscripts={isLoadingTranscripts}
            showChat={showChat}
            selectedVoice={selectedVoice}
            voicePlayerRef={voicePlayerRef}
            voiceRecorderRef={voiceRecorderRef}
            voicePageVisualizerRef={voicePageVisualizerRef}
            onTranscriptionReceived={async (text: string) => {
               try {
                 const newHistory = [...session.conversationHistory, { type: 'user' as const, text }];
                 addToHistory('user', text);
                 await generateAIResponse(text, newHistory);
               } catch (error) {
                 console.error('Error in onTranscriptionReceived:', error);
                 // Handle the error gracefully - the generateAIResponse already has its own error handling
                 // but this prevents unhandled promise rejections from bubbling up
               }
             }}
             onRecordingStateChange={handleRecordingStateChange}
             onRecordingError={setRecordingError}
             onTtsError={setTtsError}
             onDismissRecordingError={handleDismissRecordingError}
             onPlayStateChange={(isPlaying: boolean) => {
               setPlayingTTS(isPlaying);
               
               if (voiceRecorderRef.current) {
                 if (isPlaying) {
                   voiceRecorderRef.current.pauseVAD();
                 } else {
                   voiceRecorderRef.current.resumeVAD();
                 }
               }
             }}
             onAudioData={(audioData: Float32Array) => {
               voicePageVisualizerRef.current?.handleAudioData(audioData);
             }}
            onPlaybackComplete={() => {
              if (session.isActive && !session.isCompleted && !rateLimitState.isRateLimited) {
                setAutoStartRecording(true);
              }
            }}
            onTerminateInterview={terminateInterviewOnError}
            setAutoStartRecording={setAutoStartRecording}
            setSessionActive={setSessionActive}
          />
        </div>

        {/* Fixed Bottom Controls - Show for both starting and during interview */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <ControlButtons
            isInterviewActive={session.isActive}
            isProcessingAI={voiceState.isProcessingAI}
            rateLimited={rateLimitState.isRateLimited}
            selectedInterviewType={selectedInterviewType}
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