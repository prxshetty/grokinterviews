import { useState, useCallback } from 'react';

export interface VoiceControlsState {
  isRecordingActive: boolean;
  isSpeakingDetected: boolean;
  isPlayingTTS: boolean;
  isProcessingAI: boolean;
  shouldAutoStartRecording: boolean;
  aiResponseKey: number;
  recordingError: string | null;
  ttsError: string | null;
  vadSupported: boolean;
}

export interface UseVoiceControlsReturn {
  state: VoiceControlsState;
  setRecordingActive: (active: boolean) => void;
  setSpeakingDetected: (detected: boolean) => void;
  setPlayingTTS: (playing: boolean) => void;
  setProcessingAI: (processing: boolean) => void;
  setAutoStartRecording: (autoStart: boolean) => void;
  incrementAiResponseKey: () => void;
  setRecordingError: (error: string | null) => void;
  setTtsError: (error: string | null) => void;
  setVadSupported: (supported: boolean) => void;
  resetVoiceControls: () => void;
}

export const useVoiceControls = (): UseVoiceControlsReturn => {
  const [state, setState] = useState<VoiceControlsState>({
    isRecordingActive: false,
    isSpeakingDetected: false,
    isPlayingTTS: false,
    isProcessingAI: false,
    shouldAutoStartRecording: false,
    aiResponseKey: 0,
    recordingError: null,
    ttsError: null,
    vadSupported: false,
  });

  const setRecordingActive = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, isRecordingActive: active }));
  }, []);

  const setSpeakingDetected = useCallback((detected: boolean) => {
    setState(prev => ({ ...prev, isSpeakingDetected: detected }));
  }, []);

  const setPlayingTTS = useCallback((playing: boolean) => {
    setState(prev => ({ ...prev, isPlayingTTS: playing }));
  }, []);

  const setProcessingAI = useCallback((processing: boolean) => {
    setState(prev => ({ ...prev, isProcessingAI: processing }));
  }, []);

  const setAutoStartRecording = useCallback((autoStart: boolean) => {
    setState(prev => ({ ...prev, shouldAutoStartRecording: autoStart }));
  }, []);

  const incrementAiResponseKey = useCallback(() => {
    setState(prev => ({ ...prev, aiResponseKey: prev.aiResponseKey + 1 }));
  }, []);

  const setRecordingError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, recordingError: error }));
  }, []);

  const setTtsError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, ttsError: error }));
  }, []);

  const setVadSupported = useCallback((supported: boolean) => {
    setState(prev => ({ ...prev, vadSupported: supported }));
  }, []);

  const resetVoiceControls = useCallback(() => {
    setState({
      isRecordingActive: false,
      isSpeakingDetected: false,
      isPlayingTTS: false,
      isProcessingAI: false,
      shouldAutoStartRecording: false,
      aiResponseKey: 0,
      recordingError: null,
      ttsError: null,
      vadSupported: false,
    });
  }, []);

  return {
    state,
    setRecordingActive,
    setSpeakingDetected,
    setPlayingTTS,
    setProcessingAI,
    setAutoStartRecording,
    incrementAiResponseKey,
    setRecordingError,
    setTtsError,
    setVadSupported,
    resetVoiceControls,
  };
};