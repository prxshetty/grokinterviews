'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  
  // Use ref for configStatus to avoid unnecessary re-renders
  const configStatusRef = useRef(configStatus);
  configStatusRef.current = configStatus;

  // Use refs to store callback functions to prevent infinite loops
  const onCallEndedRef = useRef(onCallEnded);
  onCallEndedRef.current = onCallEnded;

  // Fetch VAPI configuration on component mount and cleanup stuck calls
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
      } finally {
        setIsConfigLoading(false);
      }
    };

    const cleanupStuckCalls = async () => {
      if (!user?.id) return;
      
      try {
        // Check for stuck calls in database (calls marked as 'in-progress' but actually ended)
        const response = await fetch(`/api/voice/phone-calls?userId=${user.id}&status=in-progress&limit=5`);
        if (response.ok) {
          const { calls } = await response.json();
          
          // Only check calls that are older than 2 minutes (likely stuck)
          const stuckCalls = calls.filter((call: any) => {
            const callAge = Date.now() - new Date(call.created_at).getTime();
            return callAge > 120000; // 2 minutes
          });
          
          if (stuckCalls.length > 0) {
            console.log(`Found ${stuckCalls.length} potentially stuck calls, checking VAPI status...`);
            
            // Check each stuck call with VAPI (minimal API calls)
            for (const call of stuckCalls) {
              try {
                const statusResponse = await vapiService.getCallStatus(call.vapi_call_id);
                if (statusResponse.success && statusResponse.call?.status === 'ended') {
                  console.log(`Fixing stuck call: ${call.vapi_call_id}`);
                  
                  // Calculate actual duration from VAPI data
                  const actualDuration = statusResponse.call.startedAt && statusResponse.call.endedAt 
                    ? Math.floor((new Date(statusResponse.call.endedAt).getTime() - new Date(statusResponse.call.startedAt).getTime()) / 1000)
                    : call.call_duration || 0; // Fallback to existing duration
                  
                  // Fix the stuck call in database
                  await fetch('/api/voice/phone-calls', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      vapiCallId: call.vapi_call_id,
                      callStatus: 'ended',
                      callDuration: actualDuration, // Use VAPI duration
                      audioRecordingUrl: statusResponse.call.artifact?.recordingUrl,
                      transcriptText: statusResponse.call.artifact?.transcript,
                      analysisSummary: statusResponse.call.analysis?.summary,
                      metadata: {
                        endedAt: statusResponse.call.endedAt,
                        endedReason: statusResponse.call.endedReason || 'webhook_missed',
                        cost: statusResponse.call.cost,
                        messageCount: statusResponse.call.messages?.length || 0,
                        fixedStuckCall: true,
                        fixedOnLoad: true,
                        vapiStartedAt: statusResponse.call.startedAt,
                        vapiEndedAt: statusResponse.call.endedAt
                      }
                    }),
                  });
                }
              } catch (error) {
                // Handle 404 errors (call no longer exists in VAPI)
                if (error instanceof Error && error.message.includes('404')) {
                  console.log(`Call ${call.vapi_call_id} not found in VAPI (404) - marking as ended`);
                  
                  // Update database to mark call as ended
                  await fetch('/api/voice/phone-calls', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      vapiCallId: call.vapi_call_id,
                      callStatus: 'ended',
                      callDuration: call.call_duration || 0, // Use existing duration as fallback
                      metadata: {
                        endedAt: new Date().toISOString(),
                        endedReason: 'external_termination',
                        fixedStuckCall: true,
                        fixedOnLoad: true,
                        error404Cleanup: true
                      }
                    }),
                  });
                } else {
                  console.error(`Error checking stuck call ${call.vapi_call_id}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error during stuck call cleanup:', error);
      }
    };

    fetchConfig();
    cleanupStuckCalls();
  }, [user?.id]);

  // Effect for call duration timer and status polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;

    if (callState === 'in-progress') {
      // Update call duration every second (for UI display only)
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Poll call status every 3 seconds with smart stuck call detection
      statusInterval = setInterval(async () => {
        if (currentCall?.id) {
          console.log(`Polling call status for ${currentCall.id}...`);
          try {
            const statusResponse = await vapiService.getCallStatus(currentCall.id);
            console.log('Status response:', statusResponse);
            
            if (statusResponse.success) {
              // Handle case where call was cancelled/ended externally (call is null)
              if (!statusResponse.call && callState === 'in-progress') {
                console.log('🎯 Call cancelled externally - updating UI...');
                setCallState('ended');
                
                // Update database to mark call as ended
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
                      metadata: {
                        endedAt: new Date().toISOString(),
                        endedReason: 'cancelled_externally',
                        endedBy: 'external'
                      }
                    }),
                  });
                  console.log('✅ Database updated for externally cancelled call');
                } catch (dbError) {
                  console.error('Error updating cancelled call in database:', dbError);
                }
                
                onCallEndedRef.current?.(currentCall.id, undefined);
                return; // Exit early since call is ended
              }
              
              if (statusResponse.call) {
                const vapiCall = statusResponse.call;
                console.log(`VAPI call status: ${vapiCall.status}, UI state: ${callState}`);
              
              // Update local state based on VAPI status
              if (vapiCall.status === 'ended' && callState === 'in-progress') {
                console.log('🎯 Call ended detected! Updating UI...');
                setCallState('ended');
                
                // Calculate actual duration from VAPI data
                const actualDuration = vapiCall.startedAt && vapiCall.endedAt 
                  ? Math.floor((new Date(vapiCall.endedAt).getTime() - new Date(vapiCall.startedAt).getTime()) / 1000)
                  : callDuration; // Fallback to UI duration if VAPI data unavailable
                
                console.log(`Calculated duration: ${actualDuration} seconds`);
                
                // Update database with final call data using VAPI duration
                try {
                  const updateResponse = await fetch('/api/voice/phone-calls', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      vapiCallId: currentCall.id,
                      callStatus: 'ended',
                      callDuration: actualDuration, // Use VAPI duration
                      audioRecordingUrl: vapiCall.artifact?.recordingUrl,
                      transcriptText: vapiCall.artifact?.transcript,
                      analysisSummary: vapiCall.analysis?.summary,
                      metadata: {
                        endedAt: vapiCall.endedAt,
                        endedReason: vapiCall.endedReason,
                        cost: vapiCall.cost,
                        messageCount: vapiCall.messages?.length || 0,
                        vapiStartedAt: vapiCall.startedAt,
                        vapiEndedAt: vapiCall.endedAt
                      }
                    }),
                  });
                  
                  if (updateResponse.ok) {
                    console.log('✅ Database updated successfully');
                  } else {
                    console.error('❌ Database update failed:', await updateResponse.text());
                  }
                } catch (dbError) {
                  console.error('Error updating final call data:', dbError);
                }
                
                onCallEndedRef.current?.(currentCall.id, vapiCall);
              }
              
              // BUDGET-FRIENDLY FIX: Detect stuck calls with minimal API overhead
              // Check call age from VAPI data instead of local timer
              const callStartTime = vapiCall.startedAt ? new Date(vapiCall.startedAt).getTime() : Date.now();
              const callAge = (Date.now() - callStartTime) / 1000; // Age in seconds
              
              if (callState === 'in-progress' && callAge > 300) { // 5 minutes
                // Check if VAPI call is actually ended but our UI thinks it's still active
                if (vapiCall.status === 'ended') {
                  console.warn('Detected stuck call - VAPI shows ended but UI shows in-progress');
                  
                  // Fix the stuck call immediately
                  setCallState('ended');
                  
                  // Calculate actual duration from VAPI data
                  const actualDuration = vapiCall.startedAt && vapiCall.endedAt 
                    ? Math.floor((new Date(vapiCall.endedAt).getTime() - new Date(vapiCall.startedAt).getTime()) / 1000)
                    : Math.floor(callAge); // Use call age as fallback
                  
                  // Update database to fix the inconsistency
                  try {
                    await fetch('/api/voice/phone-calls', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        vapiCallId: currentCall.id,
                        callStatus: 'ended',
                        callDuration: actualDuration, // Use VAPI duration
                        audioRecordingUrl: vapiCall.artifact?.recordingUrl,
                        transcriptText: vapiCall.artifact?.transcript,
                        analysisSummary: vapiCall.analysis?.summary,
                        metadata: {
                          endedAt: vapiCall.endedAt,
                          endedReason: vapiCall.endedReason || 'webhook_missed',
                          cost: vapiCall.cost,
                          messageCount: vapiCall.messages?.length || 0,
                          fixedStuckCall: true, // Flag for debugging
                          vapiStartedAt: vapiCall.startedAt,
                          vapiEndedAt: vapiCall.endedAt
                        }
                      }),
                    });
                    
                    console.log('Successfully fixed stuck call in database');
                  } catch (dbError) {
                    console.error('Error fixing stuck call in database:', dbError);
                  }
                  
                  onCallEndedRef.current?.(currentCall.id, vapiCall);
                }
              }
              }
            } else {
              console.warn('Status response not successful:', statusResponse);
            }
          } catch (error) {
            console.error('Error polling call status:', error);
            
            // Handle 404 errors (call no longer exists in VAPI)
            if (error instanceof Error && error.message.includes('404')) {
              console.warn('Call not found in VAPI (404) - likely ended externally, cleaning up UI state');
              setCallState('ended');
              
              // Update database to mark call as ended
              try {
                await fetch('/api/voice/phone-calls', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    vapiCallId: currentCall.id,
                    callStatus: 'ended',
                    callDuration: callDuration, // Use UI duration as fallback
                    metadata: {
                      endedAt: new Date().toISOString(),
                      endedReason: 'external_termination',
                      fixedStuckCall: true,
                      error404Cleanup: true
                    }
                  }),
                });
                
                console.log('Successfully cleaned up 404 call in database');
              } catch (dbError) {
                console.error('Error cleaning up 404 call in database:', dbError);
              }
              
              onCallEndedRef.current?.(currentCall.id, undefined);
            }
          }
        }
      }, 3000); // Poll every 3 seconds for more responsive updates
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
              vapi_call_id: response.call.id,
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
            const errorData = await saveResponse.json().catch(() => ({}));
            console.error('Failed to save call data to database:', {
              status: saveResponse.status,
              statusText: saveResponse.statusText,
              error: errorData
            });
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
            vapi_call_id: currentCall.id,
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
        return <Loader2 className="h-5 w-5 animate-spin" />;
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
  const showConfigWarning = !isConfigLoading && !configStatusRef.current?.isFullyConfigured;

  return (
    <div className={cn("space-y-6", className)}>

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
      {(callState === 'initiating' || callState === 'ringing' || callState === 'in-progress') ? (
        <div className="font-sans">
          {/* Header Section */}
          <div className="text-center mb-12">
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              You will receive the call shortly at <span className="font-medium">{phoneNumber}</span>
            </p>
          </div>

          {/* Main Status Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-100/20 to-slate-200/10 dark:from-slate-800/20 dark:to-slate-900/10 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/30 dark:border-slate-700/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-transparent" />
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center mb-6">
                  <Phone className="h-16 w-16 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="text-3xl font-light text-slate-800 dark:text-slate-200 mb-6">
                  Interview Session Active
                </div>
                
                {/* Interview Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Duration Limit</span>
                    </div>
                    <div className="text-2xl font-light text-slate-800 dark:text-slate-200">10 Minutes</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Phone className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Calling</span>
                    </div>
                    <div className="text-2xl font-light text-slate-800 dark:text-slate-200">{phoneNumber}</div>
                  </div>
                </div>

                {/* Feature List */}
                <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
                    <div className="grid md:grid-cols-2 gap-y-2 gap-x-8">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-green-500 w-4 text-center">✓</span>
                        <span className="text-left">AI-powered conversation</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-green-500 w-4 text-center">✓</span>
                        <span className="text-left">Real-time adaptation</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-green-500 w-4 text-center">✓</span>
                        <span className="text-left">Professional recording</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-green-500 w-4 text-center">✓</span>
                        <span className="text-left">Personalized questions</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-slate-100/20 dark:bg-slate-800/20 rounded-lg border border-slate-200/20 dark:border-slate-700/20">
                      <p className="text-center text-xs text-slate-600 dark:text-slate-400">
                        <strong>Coming Soon:</strong> Reports and transcripts functionality is currently being developed. 
                        Your interview will be recorded for analysis and feedback purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            {getStatusIcon()}
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {getStatusMessage()}
            </span>
          </div>
        </div>
      )}

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
      {(callState === 'idle' || callState === 'error' || callState === 'ended') && (
        <div className="flex justify-center space-x-4">
          {callState === 'idle' || callState === 'error' ? (
            <button
              onClick={handleStartCall}
              disabled={disabled || !isPhoneNumberValid || showConfigWarning}
              className={cn(
                "inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-3xl transition-all duration-300 shadow-md border touch-manipulation active:scale-95",
                disabled || !isPhoneNumberValid || showConfigWarning
                  ? "bg-gray-100/50 text-gray-400 cursor-not-allowed border-gray-200/50"
                  : "text-white bg-gray-900/80 dark:bg-white/5 hover:bg-black/90 dark:hover:bg-white/10 border-gray-700/30 dark:border-white/10"
              )}
            >
              Start Phone Interview
            </button>
          ) : callState === 'ended' ? (
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600/80 hover:bg-blue-700/90 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105"
            >
              <Phone className="h-5 w-5" />
              <span>Start New Call</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Error Display */}
      {error && callState !== 'error' && (
        <div className="p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/50 rounded-lg">
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
          <p className="text-xs">
            By proceeding, you consent to call recording and agree to our{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
              Terms of Service
            </a>.
          </p>
        </div>
      )}
    </div>
  );
}