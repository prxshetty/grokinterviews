import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, PhoneOff, Settings } from 'lucide-react';
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PhoneNumberHooksManagerProps {
  className?: string;
}

export default function PhoneNumberHooksManager({ className }: PhoneNumberHooksManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [incomingCallsEnabled, setIncomingCallsEnabled] = useState(true);
  const [customMessage, setCustomMessage] = useState(
    'Thank you for calling. Inbound calling is currently disabled. Please visit our website to schedule an interview.'
  );
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current configuration on mount
  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/voice/phone-number-hooks');
      
      if (!response.ok) {
        throw new Error('Failed to load phone number configuration');
      }

      const data = await response.json();
      setCurrentConfig(data.phoneNumber);
      
      // Check if incoming calls are disabled (has hooks)
      const hasDisableHooks = data.phoneNumber?.hooks?.some((hook: any) => 
        hook.on === 'call.ringing' && hook.do?.some((action: any) => action.type === 'say')
      );
      
      setIncomingCallsEnabled(!hasDisableHooks);
    } catch (error) {
      console.error('Error loading config:', error);
      setError('Failed to load current configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIncomingCalls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const action = incomingCallsEnabled ? 'disable_incoming' : 'enable_incoming';
      const body = action === 'disable_incoming' ? { action, customMessage } : { action };

      const response = await fetch('/api/voice/phone-number-hooks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update phone number configuration');
      }

      const data = await response.json();
      setCurrentConfig(data.phoneNumber);
      setIncomingCallsEnabled(!incomingCallsEnabled);
      setSuccess(data.message);
    } catch (error) {
      console.error('Error updating phone number hooks:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMessage = async () => {
    if (incomingCallsEnabled) {
      setError('Cannot update message while incoming calls are enabled');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/voice/phone-number-hooks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disable_incoming',
          customMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update message');
      }

      const data = await response.json();
      setCurrentConfig(data.phoneNumber);
      setSuccess('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Phone Number Settings
        </CardTitle>
        <CardDescription>
          Manage incoming call settings and configure automated responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Incoming Calls Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Incoming Calls</Label>
            <div className="text-sm text-muted-foreground">
              {incomingCallsEnabled 
                ? 'Allow incoming calls to your phone number' 
                : 'Block incoming calls with an automated message'
              }
            </div>
          </div>
          <div className="flex items-center gap-2">
            {incomingCallsEnabled ? (
              <Phone className="h-4 w-4 text-green-600" />
            ) : (
              <PhoneOff className="h-4 w-4 text-red-600" />
            )}
            <Switch
              checked={incomingCallsEnabled}
              onCheckedChange={handleToggleIncomingCalls}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Custom Message Configuration */}
        {!incomingCallsEnabled && (
          <div className="space-y-3">
            <Label htmlFor="custom-message">Automated Response Message</Label>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter the message that will be played to incoming callers"
              rows={3}
              disabled={isLoading}
            />
            <Button
              onClick={handleUpdateMessage}
              disabled={isLoading || !customMessage.trim()}
              size="sm"
            >
              {isLoading && <InlineLoadingSpinner size="sm" />}
              Update Message
            </Button>
          </div>
        )}

        {/* Current Configuration Display */}
        {currentConfig && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Configuration</Label>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <div><strong>Phone Number ID:</strong> {currentConfig.id}</div>
              <div><strong>Number:</strong> {currentConfig.number}</div>
              <div><strong>Hooks:</strong> {currentConfig.hooks?.length || 0} configured</div>
              {currentConfig.hooks?.length > 0 && (
                <div className="mt-2">
                  <strong>Active Hook:</strong>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">
                    {JSON.stringify(currentConfig.hooks[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleToggleIncomingCalls}
          disabled={isLoading}
          className="w-full"
          variant={incomingCallsEnabled ? "destructive" : "default"}
        >
          {isLoading && <InlineLoadingSpinner size="sm" />}
          {incomingCallsEnabled ? (
            <>
              <PhoneOff className="mr-2 h-4 w-4" />
              Disable Incoming Calls
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Enable Incoming Calls
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}