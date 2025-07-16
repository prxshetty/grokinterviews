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

  constructor() {
    this.apiKey = process.env.VAPI_API_KEY || '';
    this.baseUrl = VAPI_CONFIG.baseUrl;
    
    if (!this.apiKey) {
      console.warn('VAPI API key not found. Phone call functionality will be limited.');
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
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      if (!VAPI_CONFIG.defaultAssistant.assistantId) {
        throw new Error('VAPI Assistant ID not configured');
      }

      if (!VAPI_CONFIG.phoneNumber.phoneNumberId) {
        throw new Error('VAPI Phone Number ID not configured');
      }

      // Validate phone number format
      const cleanPhoneNumber = this.validateAndFormatPhoneNumber(phoneNumber);

      const requestBody: CreateCallRequest = {
        assistantId: VAPI_CONFIG.defaultAssistant.assistantId,
        phoneNumberId: VAPI_CONFIG.phoneNumber.phoneNumberId,
        customer: {
          number: cleanPhoneNumber,
          name: userContext?.userName || 'Interview Candidate'
        },
        assistantOverrides: {
          variableValues: {
            userId: userContext?.userId,
            sessionId: userContext?.sessionId,
            userName: userContext?.userName
          },
          firstMessage: `Hello ${userContext?.userName || 'there'}! This is your behavioral interview assistant. I'm here to help you practice for your upcoming interviews. Are you ready to begin?`
        }
      };

      const response = await fetch(`${this.baseUrl}${VAPI_ENDPOINTS.calls}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const call: VapiCall = await response.json();

      return {
        success: true,
        call
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
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      const response = await fetch(`${this.baseUrl}${VAPI_ENDPOINTS.calls}/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const call: VapiCall = await response.json();

      return {
        success: true,
        call
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
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      const response = await fetch(`${this.baseUrl}${VAPI_ENDPOINTS.calls}/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
   * Validate and format phone number to E.164 format
   */
  private validateAndFormatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US number (10 digits) or international (starts with country code)
    if (digitsOnly.length === 10) {
      // US number, add +1 country code
      return `+1${digitsOnly}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // US number with country code
      return `+${digitsOnly}`;
    } else if (digitsOnly.length > 7) {
      // International number
      return `+${digitsOnly}`;
    } else {
      throw new Error('Invalid phone number format. Please enter a valid phone number.');
    }
  }

  /**
   * Check if VAPI is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.apiKey &&
      VAPI_CONFIG.defaultAssistant.assistantId &&
      VAPI_CONFIG.phoneNumber.phoneNumberId
    );
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): {
    hasApiKey: boolean;
    hasAssistantId: boolean;
    hasPhoneNumberId: boolean;
    isFullyConfigured: boolean;
  } {
    return {
      hasApiKey: !!this.apiKey,
      hasAssistantId: !!VAPI_CONFIG.defaultAssistant.assistantId,
      hasPhoneNumberId: !!VAPI_CONFIG.phoneNumber.phoneNumberId,
      isFullyConfigured: this.isConfigured()
    };
  }
}

// Export singleton instance
export const vapiService = new VapiService();