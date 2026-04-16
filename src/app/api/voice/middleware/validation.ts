import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

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

  static async validateAuthentication(request?: NextRequest): Promise<{
    isAuthenticated: boolean;
    user?: User;
    error?: NextResponse;
  }> {
    try {
      const supabase = await createClient();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      let user = supabaseUser;

      // DEV BYPASS: Support mock admin user on localhost when explicitly enabled
      if (
        !user &&
        process.env.NODE_ENV === 'development' &&
        process.env.ENABLE_DEV_AUTH_BYPASS === 'true' &&
        request
      ) {
        const devBypass = request.cookies.get('dev-bypass')?.value === 'true';
        if (devBypass) {
          user = {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'admin@admin.com',
            user_metadata: { full_name: 'Local Admin' },
            app_metadata: {},
            aud: 'authenticated',
            role: 'authenticated'
          } as any;
        }
      }

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



  static handleError(error: any): NextResponse {
    console.error('API Error:', error);

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
