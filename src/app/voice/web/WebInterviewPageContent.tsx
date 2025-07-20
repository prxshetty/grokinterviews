'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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


export default function WebInterviewPageContent() {
  const [currentQuestion, setCurrentQuestion] = useState(
    "Welcome to your behavioral interview practice session! I'll ask you some common behavioral questions to help you prepare. Let's start with: Tell me about yourself and your background."
  );

  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'ai' | 'user', text: string}>>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponseKey, setAiResponseKey] = useState(0); // Force re-render of VoicePlayer

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Sophia'); // Default to Google voice
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
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [vadSupported, setVadSupported] = useState(false);
  
  // Chat visibility state
  const [showChat, setShowChat] = useState(true);

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
  
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get voice from URL parameter and map to appropriate Google voice option
  const getInitialVoice = useCallback((): VoiceOption => {
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
  }, [searchParams]);

  // Initialize voice selection based on URL parameter
  useEffect(() => {
    setSelectedVoice(getInitialVoice());
  }, [getInitialVoice]);

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



  const handleBackToModeSelector = () => {
    router.push('/voice');
  };

  const handleStartInterview = async () => {
    // Stop all ongoing audio operations first
    if (voicePlayerRef.current) {
      voicePlayerRef.current.stopPlayback();
    }
    
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
      
      // Create a new session and add initial welcome message
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
          
          // Add initial welcome message to transcripts
          await addInitialWelcomeMessage(newSessionId);
        }
      } catch {
        // Error creating session
      }
    }
  };

  const handleEndInterview = () => {
    // Stop all voice operations immediately
    if (voicePlayerRef.current) {
      voicePlayerRef.current.stopPlayback();
    }
    
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

  // Function to automatically terminate interview when critical errors occur
  const terminateInterviewOnError = async (reason: {
    type: 'rate_limit' | 'microphone_error' | 'network_error' | 'user_abort' | 'system_error';
    message: string;
    details?: string;
  }) => {
    if (!isInterviewActive || !sessionId) {
      return; // Nothing to terminate
    }

    console.log('🛑 Terminating interview due to error:', reason);

    try {
      // Call termination API
      const response = await fetch('/api/voice/terminate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          reason,
          conversationHistory
        }),
      });

      if (response.ok) {
        console.log('✅ Interview terminated successfully in database');
      } else {
        console.error('❌ Failed to terminate interview in database');
      }
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
    setIsInterviewActive(false);
    setIsInterviewCompleted(true);
    setIsProcessingAI(false);
    setShouldAutoStartRecording(false);
    
    // Show appropriate error message
    if (reason.type === 'rate_limit') {
      setRateLimited(true);
      setRateLimitMessage(reason.message);
    } else {
      setRecordingError(`Interview terminated: ${reason.message}`);
    }
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
      }
    } catch {
      // Error adding initial welcome message
    }
  };

  // Auto-refresh transcripts when conversation history changes
  useEffect(() => {
    if (sessionId && conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage && lastMessage.type === 'user') {
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
        const errorMessage = errorData.error || 'Failed to generate AI response';
        
        // Check for rate limit errors
        if (response.status === 429 || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('quota')) {
          terminateInterviewOnError({
            type: 'rate_limit',
            message: 'Interview terminated due to API rate limits',
            details: errorMessage
          });
          return;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success && result.aiResponse) {
        // Update sessionId if returned from API
        if (result.sessionId && !sessionId) {
          setSessionId(result.sessionId);
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
          setIsInterviewCompleted(true);
          setIsInterviewActive(false);
          
          // Add final AI response to conversation history
          setConversationHistory(prev => [...prev, { type: 'ai' as const, text: result.aiResponse }]);
          
          // Update the current question with final response
          setCurrentQuestion(result.aiResponse);
          
          // Force VoicePlayer to re-render and auto-play final response
          setAiResponseKey(prev => prev + 1);
          
          setTimeout(() => {
            setIsProcessingAI(false);
          }, 100);
        } else {
          // Normal interview flow - continue with next question
          setConversationHistory(prev => [...prev, { type: 'ai' as const, text: result.aiResponse }]);
          
          // Update the current question with AI response
          setCurrentQuestion(result.aiResponse);
          
          // Force VoicePlayer to re-render and auto-play new question
          setAiResponseKey(prev => prev + 1);
          
          setTimeout(() => {
            setIsProcessingAI(false);
          }, 100);
        }
      } else {
        throw new Error('No AI response received');
      }

    } catch (error) {
      console.error('Error in generateAIResponse:', error);
      
      // Check for network errors that should terminate the interview
      const errorMessage = error?.toString().toLowerCase() || '';
      
      if (errorMessage.includes('network') || 
          errorMessage.includes('fetch') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout')) {
        terminateInterviewOnError({
          type: 'network_error',
          message: 'Interview terminated due to network connectivity issues',
          details: error?.toString() || 'Unknown network error'
        });
        return;
      }
      
      // For other errors, continue with fallback question
      const fallbackQuestion = "That's interesting. Can you tell me more about a specific challenge you faced and how you overcame it?";
      setConversationHistory(prev => [...prev, { type: 'ai' as const, text: fallbackQuestion }]);
      setCurrentQuestion(fallbackQuestion);
      setAiResponseKey(prev => prev + 1);
      
      setTimeout(() => {
        setIsProcessingAI(false);
      }, 100);
    }
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?redirect=/voice/web');
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
          {/* Back to Mode Selector Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToModeSelector}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Switch Interview Mode</span>
            </button>
          </div>

          {/* AI Avatar - Always visible, enlarges when interview is active */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Main Avatar with Responsive Animations */}
              <div className={`relative transition-all duration-700 ease-in-out ${
                isInterviewActive 
                  ? isPlayingTTS 
                    ? 'scale-150' 
                    : isRecordingActive 
                      ? 'scale-130' 
                      : 'scale-125'
                  : 'scale-100'
              }`}>
                <img 
                  src="/behavior.svg" 
                  alt="AI Behavioral Interview Assistant" 
                  className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain transition-all duration-300 ${
                    isInterviewActive 
                      ? isPlayingTTS 
                        ? '' 
                        : isRecordingActive && isSpeakingDetected 
                          ? '' 
                          : isRecordingActive 
                            ? '' 
                            : 'animate-pulse opacity-50'
                      : 'animate-pulse'
                  }`}
                  style={{
                    animationDuration: isInterviewActive && !isPlayingTTS && !isRecordingActive ? '3s' : undefined
                  }}
                />
              </div>
              
              {/* Dynamic Glow Effect - Only visible during interview */}
              {isInterviewActive && (
                <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  isPlayingTTS 
                    ? 'bg-blue-400/30 blur-xl scale-125' 
                    : isRecordingActive 
                      ? '' 
                      : 'bg-gray-400/20 blur-lg scale-100 animate-pulse'
                }`} 
                style={{
                  animationDuration: !isPlayingTTS && !isRecordingActive ? '3s' : undefined
                }}
                />
              )}
              
              {/* Status Indicators - Only visible during interview */}
              {isInterviewActive && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    isPlayingTTS 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                      : isRecordingActive 
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {isPlayingTTS 
                      ? 'Speaking...' 
                      : isRecordingActive 
                        ? 'Listening' 
                        : 'Thinking...'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Header Text Content - Hidden when interview is active */}
          <div className={`text-center transition-all duration-700 ease-in-out transform ${
            isInterviewActive 
              ? 'opacity-0 -translate-y-8 pointer-events-none h-0 overflow-hidden' 
              : 'opacity-100 translate-y-0 mb-6'
          }`}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-normal text-black dark:text-white mb-6">
              Behavioral Interview Practice
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
              Master behavioral interviews with our AI-powered assistant. Practice answering 
              real behavioral questions and receive detailed feedback on your responses.
            </p>
            
            {/* Interview Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mb-3">🎯</div>
                <h3 className="font-semibold text-foreground mb-2">5 Targeted Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Answer carefully crafted behavioral questions focusing on teamwork, 
                  problem-solving, and leadership scenarios.
                </p>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mb-3">📝</div>
                <h3 className="font-semibold text-foreground mb-2">Real-time Transcription</h3>
                <p className="text-sm text-muted-foreground">
                  See your responses transcribed in real-time as you speak, 
                  helping you track your communication clarity.
                </p>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mb-3">📊</div>
                <h3 className="font-semibold text-foreground mb-2">Detailed Report</h3>
                <p className="text-sm text-muted-foreground">
                  Receive comprehensive feedback with scores, strengths, 
                  weaknesses, and actionable improvement suggestions.
                </p>
              </div>
            </div>
          </div>

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
                setShouldAutoStartRecording(false);
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
              disabled={isProcessingAI || rateLimited}
              enableVAD={true}
              autoStart={shouldAutoStartRecording && !rateLimited}
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
                  autoPlay={(isInterviewActive || isInterviewCompleted) && !isProcessingAI && !rateLimited}
                  onPlayStateChange={(isPlaying) => {
                    setIsPlayingTTS(isPlaying);
                    
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
                    
                    if (isRateLimitError && isInterviewActive) {
                      terminateInterviewOnError({
                        type: 'rate_limit',
                        message: 'Interview terminated due to TTS service rate limits',
                        details: error
                      });
                    }
                  }}
                  onPlaybackComplete={() => {
                    if (isInterviewActive && !isInterviewCompleted && !rateLimited) {
                      setShouldAutoStartRecording(true);
                    }
                  }}
                />
              </div>

              {/* Recent Transcript Display */}
              <RecentTranscriptDisplay 
                allTranscripts={allTranscripts}
                isLoadingTranscripts={isLoadingTranscripts}
                isInterviewActive={isInterviewActive}
                showChat={showChat}
              />
            </div>

            {/* Interview Report */}
            {isInterviewCompleted && interviewReport && (
              <div className="mt-8">
                <InterviewReport report={interviewReport} />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Controls */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <ControlButtons
            isInterviewActive={isInterviewActive}
            isProcessingAI={isProcessingAI}
            rateLimited={rateLimited}
            onStartInterview={handleStartInterview}
            onEndInterview={handleEndInterview}
            isRecording={isRecordingActive}
            isSpeaking={isSpeakingDetected}
            isRecordingProcessing={voiceRecorderRef.current?.isProcessing || false}
            enableVAD={true}
            vadSupported={vadSupported}
            recordingError={recordingError}
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