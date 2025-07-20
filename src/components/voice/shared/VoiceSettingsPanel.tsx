import React from 'react';
import { VoiceSelector, VoiceOption } from './VoiceSelector';

interface VoiceSettingsPanelProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  ttsProvider: 'groq' | 'google';
  setTtsProvider: (provider: 'groq' | 'google') => void;
}

export function VoiceSettingsPanel({
  selectedVoice,
  onVoiceChange,
  ttsProvider,
  setTtsProvider
}: VoiceSettingsPanelProps) {
  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-sm">
      
      {/* AI Voice Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          AI Voice
        </label>
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceChange={onVoiceChange}
          ttsProvider={ttsProvider}
          className=""
        />
      </div>
      
      {/* TTS Provider Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Provider
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTtsProvider('groq')}
            className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
              ttsProvider === 'groq'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className={`text-sm font-semibold mb-1 ${
                ttsProvider === 'groq' 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                Groq
              </div>
              <div className={`text-xs ${
                ttsProvider === 'groq' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Free
              </div>
            </div>
            {ttsProvider === 'groq' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </button>
          
          <button
            onClick={() => setTtsProvider('google')}
            className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
              ttsProvider === 'google'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className={`text-sm font-semibold mb-1 ${
                ttsProvider === 'google' 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                Google
              </div>
              <div className={`text-xs ${
                ttsProvider === 'google' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Premium
              </div>
            </div>
            {ttsProvider === 'google' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {ttsProvider === 'groq' 
            ? 'Fast, free text-to-speech powered by Groq'
            : 'High-quality voices from Google Cloud'
          }
        </div>
      </div>
    </div>
  );
}