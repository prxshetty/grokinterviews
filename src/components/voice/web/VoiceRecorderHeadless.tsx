'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { VoiceActivityDetector, createVAD, isVADSupported } from '@/utils/vadUtils';

interface VoiceRecorderHeadlessProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionReceived: (text: string) => void;
  disabled?: boolean;
  enableVAD?: boolean;
  micEnabled?: boolean; // New prop to control microphone state
  autoStart?: boolean;
  onRecordingStateChange?: (isRecording: boolean, isSpeaking: boolean) => void;
  onError?: (error: string) => void;
}

export interface VoiceRecorderHeadlessRef {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  forceStop: () => void;
  pauseVAD: () => Promise<void>;
  resumeVAD: () => Promise<void>;
  checkMicrophonePermission: () => Promise<PermissionState | 'prompt'>;
  requestMicrophonePermission: () => Promise<boolean>;
  toggleMic: () => void; // New method to toggle microphone
  isRecording: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  micEnabled: boolean; // New property to expose mic state
}

const VoiceRecorderHeadless = forwardRef<VoiceRecorderHeadlessRef, VoiceRecorderHeadlessProps>(({ 
  onRecordingComplete, 
  onTranscriptionReceived, 
  disabled = false,
  enableVAD = true,
  micEnabled = true, // Default to enabled
  autoStart = false,
  onRecordingStateChange,
  onError
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vadSupported, setVadSupported] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [internalMicEnabled, setInternalMicEnabled] = useState(micEnabled);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStartRef = useRef(autoStart);
  const isForceStoppedRef = useRef(false);
  const micEnabledRef = useRef(internalMicEnabled);
  const recordingStartTimeRef = useRef(recordingStartTime);
  const isRecordingRef = useRef(isRecording);
  const isSpeakingRef = useRef(isSpeaking);
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  // Keep refs updated with current state
  useEffect(() => {
    autoStartRef.current = autoStart;
  }, [autoStart]);
  
  useEffect(() => {
    setInternalMicEnabled(micEnabled);
  }, [micEnabled]);
  
  useEffect(() => {
    micEnabledRef.current = internalMicEnabled;
  }, [internalMicEnabled]);
  
  useEffect(() => {
    recordingStartTimeRef.current = recordingStartTime;
  }, [recordingStartTime]);
  
  useEffect(() => {
    isRecordingRef.current = isRecording;
    isSpeakingRef.current = isSpeaking;
  }, [isRecording, isSpeaking]);

  // Define permission functions
  const checkMicrophonePermission = useCallback(async () => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return permission.state;
      }
      return 'prompt';
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return 'prompt';
    }
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      const formData = new FormData();
      // Use the correct filename based on the blob's type
      const filename = audioBlob.type.includes('wav') ? 'recording.wav' : 
                      audioBlob.type.includes('webm') ? 'recording.webm' : 
                      'recording.wav'; // default to wav
      formData.append('audio', audioBlob, filename);

      console.log('📝 Sending audio for transcription...');

      const response = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const result = await response.json();
      
      if (result.success && result.text) {
        console.log('✅ Transcription received:', result.text);
        
        // Only send transcription to AI if microphone is enabled
        if (micEnabledRef.current) {
          console.log('🎤 Microphone enabled, sending transcription to AI');
          onTranscriptionReceived(result.text);
        } else {
          console.log('🔇 Microphone disabled, transcription received but not sent to AI');
        }
      } else {
        throw new Error('No transcription text received');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Transcription error:', error);
      onError?.(`Transcription failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscriptionReceived, onError, setIsProcessing]);

  // VAD callback handlers - using refs to avoid recreating VAD instance
  const handleSpeechStart = useCallback(() => {
    console.log('🗣️ VAD: Speech started');
    setIsSpeaking(true);
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    // Start recording when speech is detected, but only if mic is enabled
    if (micEnabledRef.current && !isRecordingRef.current) {
      console.log('🎤 VAD triggering recording start');
      // Use a timeout to avoid circular dependency issues
      setTimeout(() => {
        if (micEnabledRef.current && !isRecordingRef.current) {
          startRecordingRef.current?.();
        }
      }, 0);
    } else if (!micEnabledRef.current) {
      console.log('🔇 VAD detected speech but microphone is disabled');
    }
  }, []); // Empty dependency array to avoid circular dependencies

  const handleSpeechPause = useCallback(() => {
    console.log('⏸️ VAD: Speech paused - checking MediaRecorder state');
    setIsSpeaking(false);
    
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.log('⚠️ MediaRecorder not recording, ignoring speech pause');
      return;
    }
    
    const now = Date.now();
    const minRecordingDuration = 1000;
    
    if (recordingStartTimeRef.current && (now - recordingStartTimeRef.current) < minRecordingDuration) {
      console.log('⚠️ Recording too short, waiting for minimum duration...');
      return;
    }
    
    console.log('🛑 VAD stopping recording after speech pause');
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsSpeaking(false);
  }, []); // Empty dependency array

  const handleSpeechEnd = useCallback(() => {
    console.log('🤫 VAD: Speech ended after silence timeout (backup)');
    setIsSpeaking(false);
    
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.log('⚠️ MediaRecorder not recording, ignoring speech end');
      return;
    }
    
    console.log('🛑 VAD backup: Stopping recording after silence timeout');
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsSpeaking(false);
  }, []); // Empty dependency array

  const handleVADMisfire = useCallback(() => {
    console.log('⚠️ VAD: Misfire detected');
  }, []); // Empty dependency array

  // Initialize VAD on component mount
  useEffect(() => {
    const vadInstanceId = Math.random().toString(36).substring(7);
    console.log(`🔧 VAD useEffect triggered [${vadInstanceId}], enableVAD:`, enableVAD, 'isVADSupported:', isVADSupported());
    setVadSupported(isVADSupported());
    
    // Ensure any existing VAD is cleaned up first
    if (vadRef.current) {
      console.log(`🧹 Cleaning up existing VAD before creating new one [${vadInstanceId}]`);
      vadRef.current.destroy();
      vadRef.current = null;
    }
    
    if (enableVAD && isVADSupported()) {
      console.log(`🎯 Creating VAD instance [${vadInstanceId}]...`);
      vadRef.current = createVAD({
        onSpeechStart: handleSpeechStart,
        onSpeechPause: handleSpeechPause,
        onSpeechEnd: handleSpeechEnd,
        onVADMisfire: handleVADMisfire,
        positiveSpeechThreshold: 0.7,
        negativeSpeechThreshold: 0.2,
        redemptionFrames: 8,
        minSpeechFrames: 4,
        preSpeechPadFrames: 1
      });
      console.log(`✅ VAD instance created successfully [${vadInstanceId}]`);
    } else {
      console.log(`❌ VAD not enabled or not supported [${vadInstanceId}]`);
    }

    return () => {
      console.log(`🧹 Cleaning up VAD [${vadInstanceId}]...`);
      if (vadRef.current) {
        vadRef.current.destroy();
        vadRef.current = null;
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
    };
  }, [enableVAD, handleSpeechStart, handleSpeechPause, handleSpeechEnd, handleVADMisfire]); // Include all callback dependencies

  const startRecording = useCallback(async () => {
    try {
      // Check if microphone is enabled before starting recording
      if (!micEnabledRef.current) {
        console.log('🔇 Microphone disabled, cannot start recording');
        onError?.('Microphone is disabled. Please enable it to record.');
        return;
      }
      
      // Reset force stop flag for new recording
      isForceStoppedRef.current = false;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      // Force consistent WAV format for reliability
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: 'audio/wav'
      };
      
      // Fallback if WAV is not supported (rare)
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        console.warn('⚠️ WAV not supported, trying WebM');
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mediaRecorderOptions.mimeType = 'audio/webm';
        } else {
          console.warn('⚠️ Neither WAV nor WebM supported, using default');
          delete mediaRecorderOptions.mimeType;
        }
      }
      
      console.log(`🎤 Using recording format: ${mediaRecorderOptions.mimeType || 'default'}`);
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      streamRef.current = stream;
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderOptions.mimeType || 'audio/wav' 
        });
        
        setRecordingStartTime(null);
        
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        if (vadRef.current) {
          await vadRef.current.stop();
        }
        
        // Skip transcription if recording was force-stopped (manual interview termination)
        if (isForceStoppedRef.current) {
          console.log('🛑 Recording was force-stopped, skipping transcription');
          isForceStoppedRef.current = false; // Reset flag
          return;
        }
        
        if (audioBlob.size < 1000) {
          console.log('⚠️ Recording too small, skipping transcription:', audioBlob.size, 'bytes');
          onError?.('Recording too short. Please speak for at least 1 second.');
          return;
        }
        
        onRecordingComplete(audioBlob);
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000);
      
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      
      if (autoStartRef.current) {
        setHasAutoStarted(true);
      }
      
      console.log('🎤 MediaRecorder started, state:', mediaRecorder.state);
      
      if (enableVAD && vadRef.current && vadSupported) {
        try {
          await vadRef.current.start();
          console.log('🎤 Recording started with VAD enabled');
        } catch (vadError) {
          console.warn('⚠️ VAD failed to start, continuing without it:', vadError);
          console.log('🎤 Recording started (VAD disabled)');
        }
      } else {
        console.log('🎤 Recording started (VAD disabled)');
      }

    } catch (error: unknown) {
      console.error('❌ Failed to start recording:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError?.('Microphone access denied. Please click the microphone icon in your browser\'s address bar and allow microphone access, then refresh the page.');
        } else if (error.name === 'NotFoundError') {
          onError?.('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          onError?.('Microphone is being used by another application. Please close other apps using the microphone and try again.');
        } else {
          onError?.(`Microphone error: ${error.message}. Please check your microphone settings and try again.`);
        }
      } else {
        onError?.('Failed to access microphone. Please check permissions and try again.');
      }
    }
  }, [onRecordingComplete, transcribeAudio, enableVAD, vadSupported, onError, setIsRecording, setRecordingStartTime, setHasAutoStarted]);

  // Keep startRecordingRef updated with current function
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsSpeaking(false);
      
      if (vadRef.current) {
        await vadRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      console.log('🛑 Recording stopped');
    }
  }, [isRecording, setIsRecording, setIsSpeaking]);

  const forceStop = useCallback(() => {
    console.log('🛑 VoiceRecorderHeadless: Force stopping recording');
    
    // Set flag to prevent transcription on manual termination
    isForceStoppedRef.current = true;
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn('Warning: Could not stop MediaRecorder:', error);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.warn('Warning: Could not stop media track:', error);
        }
      });
      streamRef.current = null;
    }
    
    if (vadRef.current) {
      try {
        vadRef.current.stop();
      } catch (error) {
        console.warn('Warning: Could not stop VAD:', error);
      }
    }
    
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    setIsRecording(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    
    audioChunksRef.current = [];
    
    console.log('✅ VoiceRecorderHeadless: Recording stopped successfully');
  }, [isRecording, setIsRecording, setIsProcessing, setIsSpeaking]);

  const pauseVAD = useCallback(async () => {
    console.log('⏸️ VoiceRecorderHeadless: Pausing VAD');
    if (vadRef.current) {
      try {
        await vadRef.current.pause();
      } catch (error) {
        console.warn('Warning: Could not pause VAD:', error);
      }
    }
  }, []);

  const resumeVAD = useCallback(async () => {
    console.log('▶️ VoiceRecorderHeadless: Resuming VAD');
    if (vadRef.current) {
      try {
        await vadRef.current.resume();
      } catch (error) {
        console.warn('Warning: Could not resume VAD:', error);
      }
    }
  }, []);

  // Toggle microphone function
  const toggleMic = useCallback(() => {
    const newMicState = !internalMicEnabled;
    setInternalMicEnabled(newMicState);
    
    if (!newMicState) {
      // If disabling mic, stop any current recording and ensure VAD is aware
      if (isRecording) {
        console.log('🔇 Microphone disabled, stopping current recording');
        stopRecording();
      }
      // Also clear any speaking state when mic is disabled
      setIsSpeaking(false);
    }
    
    console.log(`🎤 Microphone ${newMicState ? 'enabled' : 'disabled'}`);
  }, [internalMicEnabled, isRecording, stopRecording]);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    forceStop,
    pauseVAD,
    resumeVAD,
    checkMicrophonePermission,
    requestMicrophonePermission,
    toggleMic,
    isRecording,
    isSpeaking,
    isProcessing,
    micEnabled: internalMicEnabled
  }), [startRecording, stopRecording, forceStop, pauseVAD, resumeVAD, checkMicrophonePermission, requestMicrophonePermission, toggleMic, isRecording, isSpeaking, isProcessing, internalMicEnabled]);

  // Auto-start recording when autoStart prop becomes true (only if mic is enabled)
  useEffect(() => {
    if (autoStart && !isRecording && !disabled && !isProcessing && !hasAutoStarted && micEnabledRef.current) {
      console.log('🎤 Auto-starting recording after TTS completion');
      startRecording();
    } else if (!autoStart && hasAutoStarted) {
      setHasAutoStarted(false);
    }
  }, [autoStart, isRecording, disabled, isProcessing, hasAutoStarted, startRecording, setHasAutoStarted]);

  // Notify parent component about recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording, isSpeaking);
  }, [isRecording, isSpeaking, onRecordingStateChange]);

  // This is a headless component, so it renders nothing
  return null;
});

VoiceRecorderHeadless.displayName = 'VoiceRecorderHeadless';

export default VoiceRecorderHeadless;