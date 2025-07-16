import { VAPI_CONFIG, VAPI_ENDPOINTS } from '@/config/vapi.config';

// Types for VAPI Phone Number Hooks
export interface PhoneNumberHook {
  on: 'call.ringing';
  do: Array<{
    type: 'say' | 'transfer';
    exact?: string;
    destination?: {
      type: 'number' | 'sip';
      number?: string;
      callerId?: string;
      sipUri?: string;
    };
  }>;
}

export interface PhoneNumberConfig {
  hooks?: PhoneNumberHook[];
}

export interface UpdatePhoneNumberResponse {
  success: boolean;
  phoneNumber?: any;
  error?: string;
}

export class VapiPhoneNumberService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.VAPI_API_KEY || '';
    this.baseUrl = VAPI_CONFIG.baseUrl;
    
    // Only warn during runtime (when window is available), not during build
    if (!this.apiKey && typeof window !== 'undefined') {
      console.warn('VAPI API key not found. Phone number management functionality will be limited.');
    }
  }

  /**
   * Disable incoming calls by setting up a hook that plays a message
   */
  async disableIncomingCalls(
    phoneNumberId?: string,
    customMessage?: string
  ): Promise<UpdatePhoneNumberResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      const targetPhoneNumberId = phoneNumberId || VAPI_CONFIG.phoneNumber.phoneNumberId;
      if (!targetPhoneNumberId) {
        throw new Error('Phone Number ID not configured');
      }

      const message = customMessage || 'Thank you for calling. Inbound calling is currently disabled. Please visit our website to schedule an interview.';

      const hookConfig: PhoneNumberConfig = {
        hooks: [{
          on: 'call.ringing',
          do: [{
            type: 'say',
            exact: message
          }]
        }]
      };

      const response = await fetch(`${this.baseUrl}${VAPI_ENDPOINTS.phoneNumbers}/${targetPhoneNumberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hookConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const phoneNumber = await response.json();

      return {
        success: true,
        phoneNumber
      };
    } catch (error) {
      console.error('Error disabling incoming calls:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Enable incoming calls by removing hooks
   */
  async enableIncomingCalls(phoneNumberId?: string): Promise<UpdatePhoneNumberResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      const targetPhoneNumberId = phoneNumberId || VAPI_CONFIG.phoneNumber.phoneNumberId;
      if (!targetPhoneNumberId) {
        throw new Error('Phone Number ID not configured');
      }

      const hookConfig: PhoneNumberConfig = {
        hooks: []
      };

      const response = await fetch(`${this.baseUrl}${VAPI_ENDPOINTS.phoneNumbers}/${targetPhoneNumberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hookConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const phoneNumber = await response.json();

      return {
        success: true,
        phoneNumber
      };
    } catch (error) {
      console.error('Error enabling incoming calls:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get current phone number configuration
   */
  async getPhoneNumberConfig(phoneNumberId?: string): Promise<UpdatePhoneNumberResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      const targetPhoneNumberId = phoneNumberId || VAPI_CONFIG.phoneNumber.phoneNumberId;
      if (!targetPhoneNumberId) {
        throw new Error('Phone Number ID not configured');
      }

      const response = await fetch(`${this.baseUrl}${VAPI_ENDPOINTS.phoneNumbers}/${targetPhoneNumberId}`, {
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

      const phoneNumber = await response.json();

      return {
        success: true,
        phoneNumber
      };
    } catch (error) {
      console.error('Error getting phone number config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Set up a custom hook for incoming calls
   */
  async setCustomHook(
    hook: PhoneNumberHook,
    phoneNumberId?: string
  ): Promise<UpdatePhoneNumberResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('VAPI API key not configured');
      }

      const targetPhoneNumberId = phoneNumberId || VAPI_CONFIG.phoneNumber.phoneNumberId;
      if (!targetPhoneNumberId) {
        throw new Error('Phone Number ID not configured');
      }

      const hookConfig: PhoneNumberConfig = {
        hooks: [hook]
      };

      const response = await fetch(`${this.baseUrl}${VAPI_ENDPOINTS.phoneNumbers}/${targetPhoneNumberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hookConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const phoneNumber = await response.json();

      return {
        success: true,
        phoneNumber
      };
    } catch (error) {
      console.error('Error setting custom hook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.apiKey &&
      VAPI_CONFIG.phoneNumber.phoneNumberId
    );
  }
}

// Export singleton instance
export const vapiPhoneNumberService = new VapiPhoneNumberService();