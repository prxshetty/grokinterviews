import React from 'react';
import { VoiceSelector, VoiceOption } from './VoiceSelector';

interface VoiceSettingsPanelProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
}

export function VoiceSettingsPanel({
  selectedVoice,
  onVoiceChange
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
          className=""
        />
      </div>
      
      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          High-quality voices powered by Google Cloud
        </div>
      </div>
    </div>
  );
}