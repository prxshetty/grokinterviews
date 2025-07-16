'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Clock, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { vapiService, type VapiCall } from '@/services/VapiService';
import PhoneNumberInput from './PhoneNumberInput';
import { cn } from '@/lib/utils';

interface PhoneCallInterfaceProps {
  onCallStarted?: (callId: string) => void;
  onCallEnded?: (callId: string, call?: VapiCall) => void;
  onError?: (error: string) => void;
  onBackToModeSelector?: () => void;
  disabled?: boolean;
  className?: string;
}

type CallState = 'idle' | 'initiating' | 'ringing' | 'in-progress' | 'ended' | 'error';

export default function PhoneCallInterface({
  onCallStarted,
  onCallEnded,
  onError,
  onBackToModeSelector,
  disabled = false,
  className
}: PhoneCallInterfaceProps) {
  const { user, profile } = useAuth();
  
  // State management
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCall, setCurrentCall] = useState<VapiCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [configStatus, setConfigStatus] = useState<{
    hasApiKey: boolean;
    hasAssistantId: boolean;
    hasPhoneNumberId: boolean;
    isFullyConfigured: boolean;
  } | null>(null);
  
  // Use ref for configStatus to avoid unnecessary re-renders
  const configStatusRef = useRef(configStatus);
  configStatusRef.current = configStatus;

  // Use refs to store callback functions to prevent infinite loops
  const onCallEndedRef = useRef(onCallEnded);
  onCallEndedRef.current = onCallEnded;

  // Fetch VAPI configuration on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await vapiService.getConfigStatus();
        setConfigStatus(config);
      } catch (error) {
        console.error('Error fetching VAPI configuration:', error);
        setConfigStatus({
          hasApiKey: false,
          hasAssistantId: false,
          hasPhoneNumberId: false,
          isFullyConfigured: false
        });
      }
    };

    fetchConfig();
  }, []);

  // Effect for call duration timer and status polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;

    if (callState === 'in-progress') {
      // Update call duration every second
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Poll call status every 10 seconds
      statusInterval = setInterval(async () => {
        if (currentCall?.id) {
          try {
            const statusResponse = await vapiService.getCallStatus(currentCall.id);
            if (statusResponse.success && statusResponse.call) {
              const vapiCall = statusResponse.call;
              
              // Update local state based on VAPI status
              if (vapiCall.status === 'ended' && callState === 'in-progress') {
                setCallState('ended');
                
                // Update database with final call data
                try {
                  await fetch('/api/voice/phone-calls', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      vapiCallId: currentCall.id,
                      callStatus: 'ended',
                      callDuration: callDuration,
                      audioRecordingUrl: vapiCall.artifact?.recordingUrl,
                      transcriptText: vapiCall.artifact?.transcript,
                      analysisSummary: vapiCall.analysis?.summary,
                      metadata: {
                        endedAt: vapiCall.endedAt,
                        endedReason: vapiCall.endedReason,
                        cost: vapiCall.cost,
                        messageCount: vapiCall.messages?.length || 0
                      }
                    }),
                  });
                } catch (dbError) {
                  console.error('Error updating final call data:', dbError);
                }
                
                onCallEndedRef.current?.(currentCall.id, vapiCall);
              }
            }
          } catch (error) {
            console.error('Error polling call status:', error);
          }
        }
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [callState, currentCall?.id, callDuration]); // onCallEnded is now accessed via ref

  // Poll call status when call is active
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (currentCall?.id && (callState === 'initiating' || callState === 'ringing')) {
      pollInterval = setInterval(async () => {
        const response = await vapiService.getCallStatus(currentCall.id);
        
        if (response.success && response.call) {
          const updatedCall = response.call;
          setCurrentCall(updatedCall);
          
          // Update call state based on status
          switch (updatedCall.status) {
            case 'queued':
              setCallState('initiating');
              break;
            case 'ringing':
              setCallState('ringing');
              break;
            case 'in-progress':
              if (callState === 'initiating' || callState === 'ringing') {
                setCallState('in-progress');
                
                // Update database when call becomes active
                try {
                  await fetch('/api/voice/phone-calls', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      vapiCallId: currentCall.id,
                      callStatus: 'in-progress',
                      metadata: {
                        startedAt: updatedCall.startedAt,
                        vapiStatus: updatedCall.status
                      }
                    }),
                  });
                } catch (dbError) {
                  console.error('Error updating call to in-progress:', dbError);
                }
              }
              break;
            case 'ended':
              setCallState('ended');
              onCallEndedRef.current?.(updatedCall.id, updatedCall);
              break;
            default:
              break;
          }
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentCall?.id, callState]); // onCallEnded is now accessed via ref

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle phone number change
  const handlePhoneNumberChange = useCallback((value: string) => {
    setPhoneNumber(value);
    setError(null); // Clear any previous errors
  }, []);

  // Handle phone number validation change
  const handlePhoneNumberValidation = useCallback((isValid: boolean) => {
    setIsPhoneNumberValid(isValid);
  }, []);

  // Start phone call
  const handleStartCall = async () => {
    if (!isPhoneNumberValid || !phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      // Ensure we have the latest configuration status
      const currentConfig = await vapiService.getConfigStatus();
      setConfigStatus(currentConfig);
      
      if (!currentConfig.isFullyConfigured) {
        setError('Phone calling is not properly configured. Please contact support.');
        return;
      }

      setCallState('initiating');
      setError(null);
      
      const userContext = {
        userId: user?.id || '',
        userName: profile?.full_name || user?.email?.split('@')[0] || 'there',
        sessionId: `phone-${Date.now()}`
      };

      const response = await vapiService.createOutboundCall(phoneNumber, userContext);
      
      if (response.success && response.call) {
        setCurrentCall(response.call);
        setCallState('ringing');
        
        // Save initial call data to database
        try {
          const saveResponse = await fetch('/api/voice/phone-calls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.id,
              vapiCallId: response.call.id,
              phoneNumber: phoneNumber,
              callStatus: 'ringing',
              callDuration: 0,
              metadata: {
                sessionId: userContext.sessionId,
                userName: userContext.userName
              }
            }),
          });

          if (!saveResponse.ok) {
            console.error('Failed to save call data to database');
          }
        } catch (dbError) {
          console.error('Error saving call to database:', dbError);
          // Don't fail the call if database save fails
        }
        
        onCallStarted?.(response.call.id);
      } else {
        throw new Error(response.error || 'Failed to initiate call');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call';
      setError(errorMessage);
      setCallState('error');
      onError?.(errorMessage);
    }
  };

  // End phone call
  const handleEndCall = async () => {
    if (!currentCall?.id) return;

    try {
      await vapiService.endCall(currentCall.id);
      setCallState('ended');
      
      // Update call data in database
      try {
        const updateResponse = await fetch('/api/voice/phone-calls', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vapiCallId: currentCall.id,
            callStatus: 'ended',
            callDuration: callDuration,
            metadata: {
              endedAt: new Date().toISOString(),
              endedBy: 'user'
            }
          }),
        });

        if (!updateResponse.ok) {
          console.error('Failed to update call data in database');
        }
      } catch (dbError) {
        console.error('Error updating call in database:', dbError);
      }
      
      onCallEnded?.(currentCall.id, currentCall);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end call';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setCallState('idle');
    setCurrentCall(null);
    setError(null);
    setCallDuration(0);
    setPhoneNumber('');
  };

  // Get status message
  const getStatusMessage = (): string => {
    switch (callState) {
      case 'initiating':
        return 'Initiating call...';
      case 'ringing':
        return 'Calling your phone...';
      case 'in-progress':
        return 'Interview in progress';
      case 'ended':
        return 'Call ended';
      case 'error':
        return 'Call failed';
      default:
        return 'Ready to call';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (callState) {
      case 'initiating':
      case 'ringing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'in-progress':
        return <PhoneCall className="h-5 w-5 text-green-500" />;
      case 'ended':
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Phone className="h-5 w-5 text-gray-400" />;
    }
  };

  // Check if configuration warning should be shown
  const showConfigWarning = !configStatusRef.current?.isFullyConfigured;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Back Button */}
      {onBackToModeSelector && (
        <div className="flex justify-start">
          <button
            onClick={onBackToModeSelector}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Mode Selection</span>
          </button>
        </div>
      )}

      {/* Configuration Warning */}
      {showConfigWarning && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-orange-800 dark:text-orange-400 font-medium">
                Phone Calling Not Configured
              </h4>
              <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                Phone calling requires VAPI configuration. Missing:
              </p>
              <ul className="text-orange-600 dark:text-orange-400 text-xs mt-2 space-y-1">
                {!configStatusRef.current?.hasApiKey && <li>• VAPI API Key</li>}
                {!configStatusRef.current?.hasAssistantId && <li>• VAPI Assistant ID</li>}
                {!configStatusRef.current?.hasPhoneNumberId && <li>• VAPI Phone Number ID</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Call Status Display */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          {getStatusIcon()}
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {getStatusMessage()}
          </span>
        </div>

        {/* Call Duration */}
        {callState === 'in-progress' && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        )}

        {/* Call Details */}
        {currentCall && (callState === 'ringing' || callState === 'in-progress') && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Calling: {phoneNumber}
          </div>
        )}
      </div>

      {/* Phone Number Input (only show when idle or error) */}
      {(callState === 'idle' || callState === 'error') && (
        <div className="space-y-4">
          <PhoneNumberInput
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            onValidationChange={handlePhoneNumberValidation}
            disabled={disabled || showConfigWarning}
            placeholder="Enter your phone number"
            {...(error && { error })}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {callState === 'idle' || callState === 'error' ? (
          <button
            onClick={handleStartCall}
            disabled={disabled || !isPhoneNumberValid || showConfigWarning}
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              disabled || !isPhoneNumberValid || showConfigWarning
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 transform hover:scale-105"
            )}
          >
            <PhoneCall className="h-5 w-5" />
            <span>Start Phone Interview</span>
          </button>
        ) : callState === 'ended' ? (
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105"
          >
            <Phone className="h-5 w-5" />
            <span>Start New Call</span>
          </button>
        ) : (
          <button
            onClick={handleEndCall}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform hover:scale-105"
          >
            <PhoneOff className="h-5 w-5" />
            <span>End Call</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && callState !== 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {callState === 'idle' && !error && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>Enter your phone number to receive a call for your behavioral interview practice.</p>
          <p className="text-xs">The interview will last approximately 10-15 minutes.</p>
        </div>
      )}
    </div>
  );
}