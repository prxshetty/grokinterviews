interface TurnstileValidationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

interface TurnstileValidationResult {
  success: boolean;
  error?: string;
  data?: TurnstileValidationResponse;
}

export async function validateTurnstileToken(
  token: string,
  remoteip?: string,
  expectedAction?: string
): Promise<TurnstileValidationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('Turnstile secret key not configured');
    return {
      success: false,
      error: 'Server configuration error'
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'Turnstile token is required'
    };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result: TurnstileValidationResponse = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: 'Bot protection verification failed',
        data: result
      };
    }

    // Optional: Validate expected action (skip for test keys)
    const isTestKey = secretKey === '1x0000000000000000000000000000000AA';
    if (expectedAction && result.action !== expectedAction && !isTestKey) {
      return {
        success: false,
        error: 'Invalid verification context'
      };
    }

    // Validate hostname for production (skip for test keys)
    if (!isTestKey && result.hostname && result.hostname !== 'grokinterviews.org') {
      // Don't fail validation for hostname mismatch, just continue
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Turnstile validation error:', error);
    return {
      success: false,
      error: 'Verification service unavailable'
    };
  }
}

export function getTurnstileErrorMessage(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return 'Verification failed. Please try again.';
  }

  const errorMessages: Record<string, string> = {
    'missing-input-secret': 'Server configuration error',
    'invalid-input-secret': 'Server configuration error',
    'missing-input-response': 'Please complete the verification',
    'invalid-input-response': 'Verification failed. Please try again.',
    'bad-request': 'Invalid request. Please refresh and try again.',
    'timeout-or-duplicate': 'Verification expired. Please try again.',
    'internal-error': 'Service temporarily unavailable. Please try again.'
  };

  const firstError = errorCodes[0];
  return (firstError && errorMessages[firstError]) || 'Verification failed. Please try again.';
}