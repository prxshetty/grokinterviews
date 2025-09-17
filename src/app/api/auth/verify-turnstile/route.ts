import { NextRequest, NextResponse } from 'next/server';
import { validateTurnstileToken } from '@/utils/turnstile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Turnstile token is required' },
        { status: 400 }
      );
    }

    // Get client IP for additional validation
    const remoteip = request.headers.get('CF-Connecting-IP') ||
                    request.headers.get('X-Forwarded-For') ||
                    request.headers.get('X-Real-IP') ||
                    'unknown';

    const validation = await validateTurnstileToken(token, remoteip, action);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error || 'Verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Turnstile verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}