import React from 'react';
import { Settings } from 'lucide-react';
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
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center flex items-center justify-center space-x-2">
        <Settings className="w-4 h-4" />
        <span>Voice Settings</span>
      </h3>
      
      {/* AI Voice Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          AI Voice
        </h4>
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceChange={onVoiceChange}
          ttsProvider={ttsProvider}
          className=""
        />
      </div>
      
      {/* TTS Provider Section */}
      <div>
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          TTS Provider
        </h4>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setTtsProvider('groq')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              ttsProvider === 'groq'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="text-left">
                <div className="font-semibold">Groq</div>
                <div className="text-xs opacity-75">Free</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setTtsProvider('google')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              ttsProvider === 'google'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="text-left">
                <div className="font-semibold">Google</div>
                <div className="text-xs opacity-75">Premium</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}