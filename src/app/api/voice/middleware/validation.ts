import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit as checkUserRateLimit } from '@/utils/rateLimiting';
import { 
  ConversationRequest,
  ConversationResponse,
} from '../types';
import { 
  ERROR_MESSAGES, 
  HTTP_STATUS 
} from '../constants';

export class ValidationMiddleware {
  static async validateRequest(request: NextRequest): Promise<{
    isValid: boolean;
    data?: ConversationRequest;
    error?: NextResponse;
  }> {
    try {
      const body = await request.json();
      
      // Validate required fields
      if (!body.userResponse || !body.userResponse.trim()) {
        return {
          isValid: false,
          error: NextResponse.json(
            { error: ERROR_MESSAGES.NO_USER_RESPONSE },
            { status: HTTP_STATUS.BAD_REQUEST }
          )
        };
      }

      // Default values for optional fields
      const data: ConversationRequest = {
        userResponse: body.userResponse,
        conversationHistory: body.conversationHistory || [],
        sessionId: body.sessionId || null,
        sessionType: body.sessionType || 'behavioral',
        config: body.config || null,
        checkRateLimit: body.checkRateLimit || false,
        voiceId: body.voiceId,
        voiceName: body.voiceName
      };

      return { isValid: true, data };
    } catch (error) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: 'Invalid JSON payload' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      };
    }
  }

  static async validateAuthentication(): Promise<{
    isAuthenticated: boolean;
    user?: User;
    error?: NextResponse;
  }> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          isAuthenticated: false,
          error: NextResponse.json(
            { error: ERROR_MESSAGES.AUTH_REQUIRED },
            { status: HTTP_STATUS.UNAUTHORIZED }
          )
        };
      }

      return { isAuthenticated: true, user };
    } catch (error) {
      return {
        isAuthenticated: false,
        error: NextResponse.json(
          { error: ERROR_MESSAGES.AUTH_REQUIRED },
          { status: HTTP_STATUS.UNAUTHORIZED }
        )
      };
    }
  }

  static async handleRateLimitCheck(
    userId: string,
    voiceId?: string
  ): Promise<NextResponse> {
    try {
      const rateLimitResult = await checkUserRateLimit('web', userId, voiceId);
      
      if (!rateLimitResult.isAllowed) {
        return NextResponse.json({
          error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          message: rateLimitResult.message,
          rateLimited: true
        }, { status: HTTP_STATUS.RATE_LIMIT });
      }

      return NextResponse.json({ 
        rateLimited: false,
        remainingAttempts: rateLimitResult.remainingAttempts 
      });
    } catch (error) {
      return NextResponse.json({
        error: 'Rate limit check failed'
      }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
  }

  static async validateRateLimit(
    userId: string,
    currentQuestionCount: number,
    voiceId?: string
  ): Promise<{
    isAllowed: boolean;
    error?: NextResponse;
  }> {
    // Only check rate limiting for new interviews (first question)
    if (currentQuestionCount > 0) {
      return { isAllowed: true };
    }

    try {
      const rateLimitResult = await checkUserRateLimit('web', userId, voiceId);
      
      if (!rateLimitResult.isAllowed) {
        return {
          isAllowed: false,
          error: NextResponse.json({
            error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
            message: rateLimitResult.message,
            rateLimited: true
          }, { status: HTTP_STATUS.RATE_LIMIT })
        };
      }

      return { isAllowed: true };
    } catch (error) {
      return {
        isAllowed: false,
        error: NextResponse.json({
          error: 'Rate limit validation failed'
        }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
      };
    }
  }

  static handleError(error: any): NextResponse {
    console.error('API Error:', error);

    // Handle specific Groq API errors
    if (error instanceof Groq.APIError) {
      return NextResponse.json(
        { 
          error: ERROR_MESSAGES.AI_INTERVIEW_FAILED, 
          details: error.message,
          type: 'groq_api_error'
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        details: error.message || 'Unknown error occurred'
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  static createSuccessResponse(data: ConversationResponse): NextResponse {
    return NextResponse.json(data);
  }
}