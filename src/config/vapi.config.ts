// VAPI Configuration
export const VAPI_CONFIG = {
  // Base URL for VAPI API
  baseUrl: 'https://api.vapi.ai',
  
  // Default assistant configuration for behavioral interviews
  defaultAssistant: {
    // This should be set to your actual assistant ID from VAPI dashboard
    assistantId: process.env.VAPI_ASSISTANT_ID || '',
    
    // Fallback configuration if assistant ID is not available
    fallbackConfig: {
      model: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        systemMessage: `You are a professional behavioral interview assistant. Conduct a structured behavioral interview focusing on:
        
        1. Tell me about yourself
        2. Describe a challenging situation you faced and how you handled it
        3. Give an example of when you had to work in a team
        4. Tell me about a time you had to learn something new quickly
        5. Describe a situation where you had to deal with conflict
        
        Keep questions conversational and follow up based on responses. Limit the interview to 10-15 minutes total.
        At the end, provide brief feedback on communication skills and suggest areas for improvement.`
      },
      voice: {
        provider: 'playht',
        voiceId: 'jennifer'
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US'
      }
    }
  },
  
  // Phone number configuration
  phoneNumber: {
    // This should be set to your VAPI phone number ID
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || '',
  },
  
  // Call settings
  callSettings: {
    // Maximum call duration in seconds (15 minutes)
    maxDurationSeconds: 900,
    
    // Enable recording for analysis
    recordingEnabled: true,
    
    // Enable transcript generation
    transcriptEnabled: true,
  }
} as const;

// Environment validation
export function validateVapiConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'VAPI_API_KEY',
    'VAPI_ASSISTANT_ID',
    'VAPI_PHONE_NUMBER_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// VAPI API endpoints
export const VAPI_ENDPOINTS = {
  calls: '/call',
  assistants: '/assistant',
  phoneNumbers: '/phone-number'
} as const;