import { createClient } from '@/utils/supabase/server';

export interface RateLimitConfig {
  maxRequests: number;
  windowHours: number;
}

export interface RateLimitResult {
  allowed: boolean;
  isAllowed: boolean; // Alias for compatibility
  remaining: number;
  remainingAttempts: number; // Alias for compatibility
  resetTime: Date;
  message?: string;
}

// Voice tier mapping for web interviews
export const VOICE_TIER_MAP: Record<string, 'standard' | 'premium'> = {
  // Standard voices (cheap)
  'Marcus': 'standard',
  'Sophia': 'standard',
  'George': 'standard',
  'Gia': 'standard',
  
  // Premium voices (expensive)
  'Algieba': 'premium',
  'Aoede': 'premium',
  'Gideon': 'premium',
  'Gianna': 'premium',
};

// Default fallback configuration
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 1,
  windowHours: 168, // 7 days
};

// Predefined rate limit configurations (fallback)
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  web_interview: {
    maxRequests: 1,
    windowHours: 168, // 7 days
  },
  phone_interview: {
    maxRequests: 1,
    windowHours: 24, // 1 day
  },
};

/**
 * Get rate limit configuration from database
 */
async function getRateLimitConfig(
  userRole: string,
  interviewType: 'web' | 'phone',
  voiceTier?: 'standard' | 'premium'
): Promise<RateLimitConfig> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .rpc('get_rate_limit_config', {
        p_user_role: userRole,
        p_interview_type: interviewType,
        p_voice_tier: voiceTier || null
      });

    if (error || !data || data.length === 0) {
      console.warn('Failed to get rate limit config, using fallback:', error);
      const fallbackKey = `${interviewType}_interview` as keyof typeof RATE_LIMIT_CONFIGS;
      const fallbackConfig = RATE_LIMIT_CONFIGS[fallbackKey];
      return fallbackConfig || DEFAULT_RATE_LIMIT_CONFIG;
    }

    return {
      maxRequests: data[0].max_requests,
      windowHours: data[0].window_hours
    };
  } catch (error) {
    console.error('Error getting rate limit config:', error);
    const fallbackKey = `${interviewType}_interview` as keyof typeof RATE_LIMIT_CONFIGS;
    const fallbackConfig = RATE_LIMIT_CONFIGS[fallbackKey];
    return fallbackConfig || DEFAULT_RATE_LIMIT_CONFIG;
  }
}

/**
 * Get user role from database
 */
async function getUserRole(userId: string): Promise<string> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('Failed to get user role, defaulting to user:', error);
      return 'user';
    }

    return data.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

/**
 * Check rate limit for web interviews with voice tier support
 */
export async function checkWebInterviewRateLimit(
  userId: string,
  voiceId?: string
): Promise<RateLimitResult> {
  const userRole = await getUserRole(userId);
  const voiceTier = voiceId ? VOICE_TIER_MAP[voiceId] || 'standard' : 'standard';
  const config = await getRateLimitConfig(userRole, 'web', voiceTier);
  
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - config.windowHours);

  try {
    const supabase = await createClient();
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select('id, session_start, is_completed')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('session_start', windowStart.toISOString())
      .order('session_start', { ascending: false });

    if (error) {
      console.error('Error checking web interview rate limit:', error);
      // Fail open - allow the request if we can't check
      return {
        allowed: true,
        isAllowed: true,
        remaining: config.maxRequests,
        remainingAttempts: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowHours * 60 * 60 * 1000)
      };
    }

    const completedSessions = sessions?.length || 0;
    const remaining = Math.max(0, config.maxRequests - completedSessions);
    const allowed = remaining > 0;

    // Calculate reset time based on the earliest qualifying session
    let resetTime: Date;
    if (sessions && sessions.length > 0 && sessions[sessions.length - 1]?.session_start) {
      // For rolling window, reset time is when the earliest session expires
      const earliestSession = new Date(sessions[sessions.length - 1]!.session_start);
      resetTime = new Date(earliestSession);
      resetTime.setHours(resetTime.getHours() + config.windowHours);
    } else {
      // No sessions in window, reset time is end of current window
      resetTime = new Date(windowStart);
      resetTime.setHours(resetTime.getHours() + config.windowHours);
    }

    if (!allowed) {
      const tierMessage = voiceTier === 'premium' ? 'premium voice' : 'standard voice';
      return {
        allowed: false,
        isAllowed: false,
        remaining: 0,
        remainingAttempts: 0,
        resetTime,
        message: `Rate limit exceeded for ${tierMessage} web interviews. Try again after ${resetTime.toLocaleString()}.`
      };
    }

    return {
      allowed: true,
      isAllowed: true,
      remaining,
      remainingAttempts: remaining,
      resetTime
    };

  } catch (error) {
    console.error('Unexpected error in web interview rate limit check:', error);
    // Fail open
    return {
      allowed: true,
      isAllowed: true,
      remaining: config.maxRequests,
      remainingAttempts: config.maxRequests,
      resetTime: new Date(Date.now() + config.windowHours * 60 * 60 * 1000)
    };
  }
}

/**
 * Check rate limit for phone interviews
 */
export async function checkPhoneInterviewRateLimit(userId: string): Promise<RateLimitResult> {
  const userRole = await getUserRole(userId);
  const config = await getRateLimitConfig(userRole, 'phone');
  
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - config.windowHours);

  try {
    const supabase = await createClient();
    const { data: calls, error } = await supabase
      .from('phone_calls')
      .select('id, created_at, call_status')
      .eq('user_id', userId)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking phone interview rate limit:', error);
      // Fail open - allow the request if we can't check
      return {
        allowed: true,
        isAllowed: true,
        remaining: config.maxRequests,
        remainingAttempts: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowHours * 60 * 60 * 1000)
      };
    }

    // Count all phone calls (regardless of status) within the window
    const callsInWindow = calls?.length || 0;
    const remaining = Math.max(0, config.maxRequests - callsInWindow);
    const allowed = remaining > 0;

    // Calculate reset time based on the earliest qualifying call
    let resetTime: Date;
    if (calls && calls.length > 0 && calls[calls.length - 1]?.created_at) {
      // For rolling window, reset time is when the earliest call expires
      const earliestCall = new Date(calls[calls.length - 1]!.created_at);
      resetTime = new Date(earliestCall);
      resetTime.setHours(resetTime.getHours() + config.windowHours);
    } else {
      // No calls in window, reset time is end of current window
      resetTime = new Date(windowStart);
      resetTime.setHours(resetTime.getHours() + config.windowHours);
    }

    if (!allowed) {
      return {
        allowed: false,
        isAllowed: false,
        remaining: 0,
        remainingAttempts: 0,
        resetTime,
        message: `Rate limit exceeded for phone interviews. Try again after ${resetTime.toLocaleString()}.`
      };
    }

    return {
      allowed: true,
      isAllowed: true,
      remaining,
      remainingAttempts: remaining,
      resetTime
    };

  } catch (error) {
    console.error('Unexpected error in phone interview rate limit check:', error);
    // Fail open
    return {
      allowed: true,
      isAllowed: true,
      remaining: config.maxRequests,
      remainingAttempts: config.maxRequests,
      resetTime: new Date(Date.now() + config.windowHours * 60 * 60 * 1000)
    };
  }
}

/**
 * Generic rate limit checker
 */
export async function checkRateLimit(
  type: 'web' | 'phone',
  userId: string,
  voiceId?: string
): Promise<RateLimitResult> {
  switch (type) {
    case 'web':
      return checkWebInterviewRateLimit(userId, voiceId);
    case 'phone':
      return checkPhoneInterviewRateLimit(userId);
    default:
      throw new Error(`Unknown rate limit type: ${type}`);
  }
}

/**
 * Create a rate limit response for API endpoints
 */
export function createRateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: result.message,
      remaining: result.remaining,
      resetTime: result.resetTime.toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString()
      }
    }
  );
}