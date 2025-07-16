'use client';

import React, { useState, useEffect, useRef } from 'react';
import InnerGlowVisualizer from './InnerGlowVisualizer';

interface VoicePageWithVisualizerProps {
  children: React.ReactNode;
  isRecording: boolean;
  isSpeaking: boolean;
  isPlayingTTS?: boolean;
}

export interface VoicePageWithVisualizerRef {
  handleAudioData: (audioData: Float32Array) => void;
}

const VoicePageWithVisualizer = React.forwardRef<VoicePageWithVisualizerRef, VoicePageWithVisualizerProps>((
  {
    children,
    isRecording,
    isSpeaking,
    isPlayingTTS = false
  },
  ref
) => {
  const [audioValues, setAudioValues] = useState<Float32Array>(new Float32Array(64).fill(0));
  const latestTtsDataRef = useRef<Float32Array | null>(null);
  const audioValuesRef = useRef<Float32Array>(new Float32Array(64).fill(0));
  
  // Update ref whenever audioValues changes
  useEffect(() => {
    audioValuesRef.current = audioValues;
  }, [audioValues]);

  // Create a callback that updates the ref without triggering re-renders
  const handleAudioData = React.useCallback((audioData: Float32Array) => {
    latestTtsDataRef.current = audioData;
  }, []);

  // Expose the callback via ref
  React.useImperativeHandle(ref, () => ({
    handleAudioData
  }), [handleAudioData]);

  // Handle audio visualization data
  useEffect(() => {
    let animationId: number;
    
    // Generate animated audio values when recording
    if (isRecording) {
      const animate = () => {
        const newValues = new Float32Array(64);
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 64; i++) {
          // Create more dynamic animation when speaking
          const baseIntensity = isSpeaking ? 1.2 : 0.6;
          const variation = isSpeaking ? 0.8 : 0.4;
          
          // Create wave-like patterns
          const wave1 = Math.sin(time * 2 + i * 0.1) * variation;
          const wave2 = Math.sin(time * 3 + i * 0.15) * (variation * 0.5);
          const wave3 = Math.sin(time * 1.5 + i * 0.08) * (variation * 0.3);
          
          newValues[i] = Math.max(0, baseIntensity + wave1 + wave2 + wave3);
        }
        
        setAudioValues(newValues);
        animationId = requestAnimationFrame(animate);
      };
      
      animate();
    }
    // Handle TTS audio visualization
    else if (isPlayingTTS) {
      const animateTTS = () => {
        const currentTtsData = latestTtsDataRef.current;
        
        if (currentTtsData) {
          // Enhance the real audio data for better visualization
          const enhancedValues = new Float32Array(64);
          const dataLength = currentTtsData.length;
          
          for (let i = 0; i < 64; i++) {
            // Map the audio data to our 64-bin visualization
            const sourceIndex = Math.floor((i / 64) * dataLength);
            const rawValue = currentTtsData[sourceIndex] || 0;
            
            // Enhance the values for better visual effect
            enhancedValues[i] = Math.min(2.0, rawValue * 3.0); // Amplify and cap
          }
          
          setAudioValues(enhancedValues);
        }
        
        animationId = requestAnimationFrame(animateTTS);
      };
      
      animateTTS();
    }
    // Fade out animation when not recording or playing
    else {
      const fadeOut = () => {
        setAudioValues(prev => {
          const newValues = new Float32Array(64);
          for (let i = 0; i < 64; i++) {
            newValues[i] = Math.max(0, prev[i] * 0.95); // Gradual fade
          }
          return newValues;
        });
        
        // Continue fading until values are near zero
        if (audioValuesRef.current.some(val => val > 0.01)) {
          animationId = requestAnimationFrame(fadeOut);
        }
      };
      
      fadeOut();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isRecording, isSpeaking, isPlayingTTS]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Visualizer */}
      {(isRecording || isPlayingTTS || audioValues.some(val => val > 0.01)) && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <InnerGlowVisualizer
            values={audioValues}
            colorTopLeft={(isSpeaking || isPlayingTTS) ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.4)"} // Blue with intensity based on speaking/playing state
             colorTopRight={(isSpeaking || isPlayingTTS) ? "rgba(96, 165, 250, 0.7)" : "rgba(96, 165, 250, 0.3)"} // Lighter blue gradient
             colorBottomLeft={(isSpeaking || isPlayingTTS) ? "rgba(96, 165, 250, 0.7)" : "rgba(96, 165, 250, 0.3)"} // Lighter blue gradient
             colorBottomRight={(isSpeaking || isPlayingTTS) ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.4)"}
            sideVisible={12}
            deformation={25}
            blur={30}
          />
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

VoicePageWithVisualizer.displayName = 'VoicePageWithVisualizer';

export default VoicePageWithVisualizer;