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
import { InterviewType } from '@/components/voice/web/InterviewAvatar';
import { InterviewModeConfig } from '@/app/api/voice/types';

import {
  useInterviewSession,
  useVoiceControls,
  useRateLimit,
} from '@/hooks/voice';

import { InterviewService, type TerminationReason } from '@/services/interviewService';

const getBehavioralDefaults = (): InterviewModeConfig => ({
  industry: 'Technology',
  targetRole: '',
  minYearsExperience: 0,
  maxYearsExperience: 5
});

const getTechnicalDefaults = (): InterviewModeConfig => ({
  programmingLanguage: 'JavaScript', // Default that matches TechnicalInterviewForm fallback
  focusAreas: ['Data Structures', 'Algorithms'], // Default that matches TechnicalInterviewForm fallback  
  difficulty: 'Medium'
});

const getSystemDesignDefaults = (): InterviewModeConfig => ({
  customTopics: 'Scalable systems, database design, microservices, load balancing, caching strategies, API design, distributed systems',
  questionFormat: 'Case Studies',
  difficulty: 'Hard'
});

export default function WebInterviewPageContent() {
  // Custom hooks for state management
  const { session, createSession, endSession, addToHistory, updateCurrentQuestion, setInterviewReport, setSessionActive, setSessionCompleted } = useInterviewSession();
  const { state: voiceState, setRecordingActive, setSpeakingDetected, setPlayingTTS, setProcessingAI, setAutoStartRecording, incrementAiResponseKey, setRecordingError, setTtsError, setVadSupported, resetVoiceControls } = useVoiceControls();
  const { rateLimitState, checkRateLimit, setRateLimited } = useRateLimit();
  
  // Local state for microphone toggle
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  // Local component state
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Sophia');
  // Track whether avatar images are fully loaded before rendering page
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload avatar images to avoid late rendering and layout shifts
  useEffect(() => {
    const imageUrls = ['/behavior.svg', '/techAI.svg', '/sdAI.svg', '/customAI.svg'];
    let loadedCount = 0;

    imageUrls.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        loadedCount += 1;
        if (loadedCount === imageUrls.length) {
          setImagesLoaded(true);
        }
      };
    });
  }, []);
  const [showChat, setShowChat] = useState(true);
  const [allTranscripts, setAllTranscripts] = useState<Array<{id: string, session_id: string, transcript_text: string, interaction_type: 'user_response' | 'ai_response', created_at: string, conversation_order: number}>>([]);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  
  // Interview type and custom configuration state
  const [selectedInterviewType, setSelectedInterviewType] = useState<InterviewType>('behavioral');
  
  // Filter out 'custom' from available interview types
  // Uncomment the useEffect below to prevent selecting custom interview type
  /*
  useEffect(() => {
    // If the selected type is 'custom', change it to 'behavioral'
    if (selectedInterviewType === 'custom') {
      setSelectedInterviewType('behavioral');
    }
  }, [selectedInterviewType]);
  */
  
  const [interviewConfig, setInterviewConfig] = useState<InterviewModeConfig>(getBehavioralDefaults());
  const [interviewConfigErrors, setInterviewConfigErrors] = useState<Record<string, string>>({});
  
  // Track current active interview type and config for follow-up questions
  const [activeInterviewType, setActiveInterviewType] = useState<string>('behavioral');
  const [activeConfig, setActiveConfig] = useState<InterviewModeConfig | undefined>(undefined);
  
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
  }, [session.id, session.conversationHistory]);

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

    try {
      await InterviewService.terminateInterview(session.id, reason, conversationHistoryRef.current);
    } catch (error) {
      // Silently handle termination API errors - the UI state will still be updated
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
      
      const result = await InterviewService.generateAIResponse(userText, history, sessionIdRef.current, activeInterviewType, activeConfig);
      
      // Update sessionId if returned from API
      if (result.sessionId && !session.id) {
        // Note: This would need to be handled by the session hook
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
      // Handle AI response generation errors
      
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
  }, [setProcessingAI, setInterviewReport, setSessionCompleted, setSessionActive, addToHistory, updateCurrentQuestion, incrementAiResponseKey, terminateInterviewOnError, activeInterviewType, activeConfig]);

  const handleBackToModeSelector = useCallback(() => {
    router.push('/voice');
  }, [router]);

  const handleInterviewTypeChange = useCallback((type: InterviewType) => {
    setSelectedInterviewType(type);
    setInterviewConfigErrors({});
    let defaults: InterviewModeConfig;
    switch (type) {
      case 'behavioral':
        defaults = getBehavioralDefaults();
        break;
      case 'technical':
        defaults = getTechnicalDefaults();
        break;
      case 'system-design':
        defaults = getSystemDesignDefaults();
        break;
      case 'custom':
        defaults = { customTopics: '', questionFormat: '', difficulty: '' };
        break;
      default:
        defaults = getBehavioralDefaults();
    }
    setInterviewConfig(defaults);
  }, []);

  const handleInterviewConfigChange = useCallback((config: InterviewModeConfig) => {
    setInterviewConfig(config);
    const newErrors = { ...interviewConfigErrors };
    if (config.customTopics?.trim()) delete newErrors.customTopics;
    if (config.questionFormat?.trim()) delete newErrors.questionFormat;
    if (config.difficulty?.trim()) delete newErrors.difficulty;
    setInterviewConfigErrors(newErrors);
  }, [interviewConfigErrors]);

  const validateInterviewConfig = useCallback(() => {
    if (selectedInterviewType !== 'custom') return true;
    
    const errors: Record<string, string> = {};
    if (!interviewConfig.customTopics?.trim()) {
      errors.customTopics = 'Please specify the topics you want to practice';
    }
    if (!interviewConfig.questionFormat?.trim()) {
      errors.questionFormat = 'Please select a question format';
    }
    if (!interviewConfig.difficulty?.trim()) {
      errors.difficulty = 'Please select a difficulty level';
    }
    
    setInterviewConfigErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedInterviewType, interviewConfig]);

  const handleStartInterview = useCallback(async () => {
    try {
      if (selectedInterviewType === 'custom' && !validateInterviewConfig()) {
        return;
      }

      if (voicePlayerRef.current) {
        voicePlayerRef.current.stopPlayback();
      }
      
      if (voiceRecorderRef.current) {
        voiceRecorderRef.current.forceStop();
      }
      
      setProcessingAI(false);
      setAutoStartRecording(false);
      setTtsError(null);
      
      const sessionType = selectedInterviewType === 'system-design' ? 'sd' : selectedInterviewType;
      
      const canStart = await checkRateLimit('web', sessionType as any, selectedVoice);
      
      if (canStart) {
        setActiveInterviewType(sessionType as any);
        setActiveConfig(interviewConfig);
        
        setSessionActive(true);
        
        incrementAiResponseKey();
        
        try {
          await createSession(sessionType as any, selectedVoice, interviewConfig);
        } catch (error) {
          // Don't throw here
        }
      }
    } catch (error) {
      setProcessingAI(false);
      setAutoStartRecording(false);
    }
  }, [validateInterviewConfig, setProcessingAI, setAutoStartRecording, setTtsError, selectedInterviewType, checkRateLimit, selectedVoice, setSessionActive, incrementAiResponseKey, createSession, interviewConfig]);

  const handleEndInterview = useCallback(async () => {
    try {
      if (voicePlayerRef.current) {
        voicePlayerRef.current.stopPlayback();
      }
      
      if (voiceRecorderRef.current) {
        voiceRecorderRef.current.forceStop();
      }
      
      await endSession();
      resetVoiceControls();
      incrementAiResponseKey();
      
      setActiveInterviewType('behavioral');
      setActiveConfig(undefined);
    } catch (error) {
      resetVoiceControls();
      incrementAiResponseKey();
    }
  }, [endSession, resetVoiceControls, incrementAiResponseKey]);

  const handleToggleMic = useCallback(() => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.toggleMic();
      setIsMicEnabled(prev => !prev);
    }
  }, []);

  const handleDismissRecordingError = useCallback(() => {
    setRecordingError(null);
  }, [setRecordingError]);

  const handleRecordingStateChange = useCallback((isRecording: boolean, isSpeaking: boolean) => {
    setRecordingActive(isRecording);
    setSpeakingDetected(isSpeaking);
  }, [setRecordingActive, setSpeakingDetected]);

  useEffect(() => {
    if (!loading && !user) {
      routerRef.current.push('/signin?redirect=/voice/web');
    }
  }, [user, loading]);

  if (loading || !imagesLoaded) {
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
        <div className="px-4 py-2">
          <InterviewHeader onBackToModeSelector={handleBackToModeSelector} />

          {!session.isActive && !session.isCompleted && (
            <div className="flex flex-col items-center gap-6 mb-4">
              <div className="w-full flex justify-center">
                <InterviewSelectionPanel
                  selectedType={selectedInterviewType}
                  onTypeChange={handleInterviewTypeChange}
                  isInterviewActive={session.isActive}
                  isPlayingTTS={voiceState.isPlayingTTS}
                  isRecordingActive={voiceState.isRecordingActive}
                  isSpeakingDetected={voiceState.isSpeakingDetected}
                  customConfig={interviewConfig}
                  onCustomConfigChange={handleInterviewConfigChange}
                  customConfigErrors={interviewConfigErrors}
                  isProcessingAI={voiceState.isProcessingAI}
                  rateLimited={rateLimitState.isRateLimited}
                  onStartInterview={handleStartInterview}
                />
              </div>
            </div>
          )}

          {(session.isActive || session.isCompleted) && (
            <div className="flex justify-center mb-4">
              <InterviewSelectionPanel
                selectedType={selectedInterviewType}
                onTypeChange={handleInterviewTypeChange}
                isInterviewActive={session.isActive}
                isPlayingTTS={voiceState.isPlayingTTS}
                isRecordingActive={voiceState.isRecordingActive}
                isSpeakingDetected={voiceState.isSpeakingDetected}
                customConfig={interviewConfig}
                onCustomConfigChange={handleInterviewConfigChange}
                customConfigErrors={interviewConfigErrors}
                isProcessingAI={voiceState.isProcessingAI}
                rateLimited={rateLimitState.isRateLimited}
                onStartInterview={handleStartInterview}
              />
            </div>
          )}

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
                 // Handle the error gracefully
               }
             }}
             micEnabled={isMicEnabled}
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

        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <ControlButtons
            isInterviewActive={session.isActive}
            isProcessingAI={voiceState.isProcessingAI}
            rateLimited={rateLimitState.isRateLimited}
            selectedInterviewType={selectedInterviewType}
            onStartInterview={handleStartInterview}
            onEndInterview={handleEndInterview}
            isMicEnabled={isMicEnabled}
            isSpeaking={voiceState.isSpeakingDetected}
            vadSupported={voiceState.vadSupported}
            recordingError={voiceState.recordingError}
            onToggleMic={handleToggleMic}
            onDismissRecordingError={handleDismissRecordingError}
            showChat={showChat}
            onToggleChat={() => setShowChat(!showChat)}
          />
        </div>
      </div>
    </VoicePageWithVisualizer>
  );
}
