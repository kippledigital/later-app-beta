// Shared utilities for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError, RateLimitInfo, EnvVars } from './types.ts';

// Initialize Supabase client
export function createSupabaseClient(env: EnvVars) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Error response helper
export function createErrorResponse(
  error: string,
  status = 400,
  code?: string,
  details?: any
): Response {
  const errorResponse: ApiError = {
    error,
    code,
    details,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  });
}

// Success response helper
export function createSuccessResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  });
}

// CORS preflight handler
export function handleCORSPreflight(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// Extract user ID from JWT token
export function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

// Rate limiting helper
export async function checkRateLimit(
  supabase: any,
  userId: string | null,
  endpoint: string,
  maxRequests = 100,
  windowMs = 900000 // 15 minutes
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const resetTime = new Date(Math.ceil(now.getTime() / windowMs) * windowMs);

  // Check rate limit
  const { data: rateLimitData, error } = await supabase
    .from('api_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is OK
    console.error('Rate limit check error:', error);
    return {
      allowed: true,
      info: {
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: Math.floor(resetTime.getTime() / 1000)
      }
    };
  }

  if (!rateLimitData) {
    // First request in window
    await supabase
      .from('api_rate_limits')
      .insert({
        user_id: userId,
        endpoint,
        request_count: 1,
        window_start: windowStart.toISOString(),
        reset_at: resetTime.toISOString()
      });

    return {
      allowed: true,
      info: {
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: Math.floor(resetTime.getTime() / 1000)
      }
    };
  }

  if (rateLimitData.request_count >= maxRequests) {
    return {
      allowed: false,
      info: {
        limit: maxRequests,
        remaining: 0,
        reset: Math.floor(resetTime.getTime() / 1000),
        retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
      }
    };
  }

  // Increment counter
  await supabase
    .from('api_rate_limits')
    .update({
      request_count: rateLimitData.request_count + 1,
      updated_at: now.toISOString()
    })
    .eq('id', rateLimitData.id);

  return {
    allowed: true,
    info: {
      limit: maxRequests,
      remaining: maxRequests - rateLimitData.request_count - 1,
      reset: Math.floor(resetTime.getTime() / 1000)
    }
  };
}

// Content validation
export function validateContentSize(content: string, maxSize = 10485760): boolean {
  return new Blob([content]).size <= maxSize;
}

// Sanitize content for processing
export function sanitizeContent(content: string): string {
  // Remove potentially harmful content
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

// Extract domain from URL
export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// Sleep utility for retries
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i === maxRetries) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
      await sleep(delay);
    }
  }

  throw lastError!;
}

// Log structured data
export function logInfo(message: string, data?: any) {
  console.log(JSON.stringify({
    level: 'info',
    message,
    data,
    timestamp: new Date().toISOString()
  }));
}

export function logError(message: string, error?: any, data?: any) {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: error?.message || error,
    stack: error?.stack,
    data,
    timestamp: new Date().toISOString()
  }));
}

// Validate environment variables
export function validateEnv(env: Record<string, string | undefined>): EnvVars {
  const required = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return env as EnvVars;
}