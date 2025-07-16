import { VAPI_CONFIG, VAPI_ENDPOINTS } from '@/config/vapi.config';

// Types for VAPI API
export interface VapiCall {
  id: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
  phoneCallProvider?: 'twilio' | 'vonage' | 'vapi';
  phoneCallTransport?: 'pstn' | 'sip';
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  endedReason?: string;
  messages?: VapiMessage[];
  analysis?: VapiAnalysis;
  artifact?: VapiArtifact;
  monitor?: {
    listenUrl?: string;
    controlUrl?: string;
  };
}

export interface VapiMessage {
  role: 'assistant' | 'user' | 'system' | 'function';
  message: string;
  time: number;
  endTime?: number;
  secondsFromStart: number;
  duration?: number;
}

export interface VapiAnalysis {
  summary?: string;
  structuredData?: Record<string, any>;
  successEvaluation?: string;
}

export interface VapiArtifact {
  messages?: VapiMessage[];
  recordingUrl?: string;
  transcript?: string;
  videoRecordingUrl?: string;
}

export interface CreateCallRequest {
  assistantId?: string;
  assistant?: {
    model?: any;
    voice?: any;
    transcriber?: any;
    firstMessage?: string;
  };
  phoneNumberId?: string;
  customer?: {
    number: string;
    name?: string;
    extension?: string;
  };
  assistantOverrides?: {
    variableValues?: Record<string, any>;
    firstMessage?: string;
  };
}

export interface CreateCallResponse {
  success: boolean;
  call?: VapiCall;
  error?: string;
}

export interface CallStatusResponse {
  success: boolean;
  call?: VapiCall;
  error?: string;
}

/**
 * VAPI Service for managing phone calls
 */
export class VapiService {
  private apiKey: string;
  private baseUrl: string;
  private configStatus: {
    hasApiKey: boolean;
    hasAssistantId: boolean;
    hasPhoneNumberId: boolean;
    isFullyConfigured: boolean;
  } | null = null;

  constructor() {
    this.baseUrl = VAPI_CONFIG.baseUrl;
    
    // On client side, we'll get the API key from server-side API calls
    // On server side, we can access environment variables directly
    if (typeof window === 'undefined') {
      this.apiKey = process.env.VAPI_API_KEY || '';
    } else {
      this.apiKey = ''; // Will be handled by server-side API calls
    }
    
    // Only warn during runtime (when window is available), not during build
    if (!this.apiKey && typeof window !== 'undefined') {
      console.warn('VAPI API key will be handled server-side for security.');
    }
  }

  /**
   * Create an outbound phone call
   */
  async createOutboundCall(phoneNumber: string, userContext?: {
    userId?: string;
    sessionId?: string;
    userName?: string;
  }): Promise<CreateCallResponse> {
    try {
      // Use server-side API endpoint for security
      const response = await fetch('/api/voice/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          userContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: result.success,
        call: result.call,
        error: result.error
      };

    } catch (error) {
      console.error('Error creating outbound call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get call status and details
   */
  async getCallStatus(callId: string): Promise<CallStatusResponse> {
    try {
      // Use server-side API endpoint for security
      const response = await fetch(`/api/voice/calls?callId=${encodeURIComponent(callId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: result.success,
        call: result.call,
        error: result.error
      };

    } catch (error) {
      console.error('Error getting call status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * End an active call
   */
  async endCall(callId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use server-side API endpoint for security
      const response = await fetch(`/api/voice/calls?callId=${encodeURIComponent(callId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Error ending call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch configuration status from API
   */
  private async fetchConfigStatus(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: use environment variables directly
      this.configStatus = {
        hasApiKey: !!process.env.VAPI_API_KEY,
        hasAssistantId: !!VAPI_CONFIG.defaultAssistant.assistantId,
        hasPhoneNumberId: !!VAPI_CONFIG.phoneNumber.phoneNumberId,
        isFullyConfigured: !!(
          process.env.VAPI_API_KEY &&
          VAPI_CONFIG.defaultAssistant.assistantId &&
          VAPI_CONFIG.phoneNumber.phoneNumberId
        )
      };
      return;
    }

    try {
      const response = await fetch('/api/voice/config');
      if (response.ok) {
        const config = await response.json();
        this.configStatus = {
          hasApiKey: config.hasApiKey,
          hasAssistantId: config.hasAssistantId,
          hasPhoneNumberId: config.hasPhoneNumberId,
          isFullyConfigured: config.isConfigured
        };
      } else {
        // Fallback to false values if API fails
        this.configStatus = {
          hasApiKey: false,
          hasAssistantId: false,
          hasPhoneNumberId: false,
          isFullyConfigured: false
        };
      }
    } catch (error) {
      console.error('Error fetching VAPI configuration:', error);
      // Fallback to false values if API fails
      this.configStatus = {
        hasApiKey: false,
        hasAssistantId: false,
        hasPhoneNumberId: false,
        isFullyConfigured: false
      };
    }
  }

  /**
   * Check if VAPI is properly configured
   */
  async isConfigured(): Promise<boolean> {
    if (!this.configStatus) {
      await this.fetchConfigStatus();
    }
    return this.configStatus?.isFullyConfigured || false;
  }

  /**
   * Get configuration status for debugging
   */
  async getConfigStatus(): Promise<{
    hasApiKey: boolean;
    hasAssistantId: boolean;
    hasPhoneNumberId: boolean;
    isFullyConfigured: boolean;
  }> {
    if (!this.configStatus) {
      await this.fetchConfigStatus();
    }
    
    return this.configStatus || {
      hasApiKey: false,
      hasAssistantId: false,
      hasPhoneNumberId: false,
      isFullyConfigured: false
    };
  }
}

// Export singleton instance
export const vapiService = new VapiService();