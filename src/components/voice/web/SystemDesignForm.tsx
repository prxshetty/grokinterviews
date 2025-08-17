'use client';

import React from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';

const systemTypes = [
  'Social Media Platform (Twitter/Facebook)',
  'E-commerce System (Amazon/eBay)',
  'Chat/Messaging System (WhatsApp/Slack)',
  'Video Streaming (YouTube/Netflix)',
  'Ride Sharing App (Uber/Lyft)', 
  'Food Delivery Service (DoorDash/UberEats)',
  'URL Shortener (bit.ly)',
  'Search Engine (Google)',
  'File Storage System (Dropbox/Google Drive)',
  'Custom System'
];

const scaleOptions = [
  '100K users',
  '1M users', 
  '10M users',
  '100M users',
  '1B+ users'
];

const focusAreaOptions = [
  'Architecture',
  'Scalability',
  'Database Design',
  'Caching',
  'Load Balancing',
  'Microservices',
  'API Design',
  'Security',
  'Monitoring',
  'Performance'
];

interface SystemDesignFormProps {
  config: InterviewModeConfig;
  onConfigChange: (config: InterviewModeConfig) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export default function SystemDesignForm({
  config,
  onConfigChange,
  errors,
  disabled = false
}: SystemDesignFormProps) {
  const handleInputChange = (field: keyof InterviewModeConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  const handleFocusAreaToggle = (area: string) => {
    const currentAreas = config.focusAreas || ['Architecture', 'Scalability'];
    const newAreas = currentAreas.includes(area)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area];
    handleInputChange('focusAreas', newAreas);
  };

  return (
    <div className="space-y-4">
      {/* Top Row: System Type and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            System Type *
          </label>
          <select
            value={config.systemType || 'Web Application'}
            onChange={(e) => handleInputChange('systemType', e.target.value)}
            disabled={disabled}
            className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {systemTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.systemType && (
            <p className="text-red-500 text-xs">{errors.systemType}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Scale *
          </label>
          <div className="flex space-x-3">
            {scaleOptions.map(scale => (
              <label key={scale} className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="scale"
                  value={scale}
                  checked={(config.scale || '1M users') === scale}
                  onChange={(e) => handleInputChange('scale', e.target.value)}
                  disabled={disabled}
                  className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-foreground">
                  {scale.replace(' users', '')}
                </span>
              </label>
            ))}
          </div>
          {errors.scale && (
            <p className="text-red-500 text-xs">{errors.scale}</p>
          )}
        </div>
      </div>

      {/* Focus Areas */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Focus Areas *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {focusAreaOptions.map(area => {
            const isSelected = (config.focusAreas || ['Architecture', 'Scalability']).includes(area);
            return (
              <label key={area} className="flex items-center space-x-1 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleFocusAreaToggle(area)}
                  disabled={disabled}
                  className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-foreground truncate">
                  {area}
                </span>
              </label>
            );
          })}
        </div>
        {errors.focusAreas && (
          <p className="text-red-500 text-xs">{errors.focusAreas}</p>
        )}
      </div>
    </div>
  );
}