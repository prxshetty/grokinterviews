import { NextResponse } from 'next/server';
import { validateVapiConfig } from '@/config/vapi.config';

export async function GET() {
  try {
    const { isValid, missingVars } = validateVapiConfig();
    
    return NextResponse.json({
      isConfigured: isValid,
      hasApiKey: !!process.env.VAPI_API_KEY,
      hasAssistantId: !!process.env.VAPI_ASSISTANT_ID,
      hasPhoneNumberId: !!process.env.VAPI_PHONE_NUMBER_ID,
      missingVars: missingVars
    });
  } catch (error) {
    console.error('Error checking VAPI configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}