// Authentication utilities for Vercel API routes
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setSecurityHeaders, logSecurityEvent } from './security';

export interface AuthenticatedRequest extends VercelRequest {
  userId?: string;
  user?: any;
}

export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function authenticateRequest(
  req: AuthenticatedRequest,
  res: VercelResponse,
  next?: () => void
): Promise<boolean> {
  try {
    // Set security headers
    setSecurityHeaders(res);

    const authHeader = req.headers.authorization;
    const userAgent = req.headers['user-agent'];
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress;

    // Validate authorization header format
    if (!authHeader?.startsWith('Bearer ')) {
      logSecurityEvent('auth_header_missing', {
        ip: clientIP,
        userAgent,
        path: req.url,
      });

      res.status(401).json({
        error: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED'
      });
      return false;
    }

    const token = authHeader.substring(7);

    // Basic token format validation
    if (!token || token.length < 20 || token.length > 2048) {
      logSecurityEvent('invalid_token_format', {
        ip: clientIP,
        userAgent,
        tokenLength: token?.length || 0,
      });

      res.status(401).json({
        error: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
      return false;
    }

    const supabase = createSupabaseClient();

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logSecurityEvent('token_verification_failed', {
        ip: clientIP,
        userAgent,
        error: error?.message,
        userId: user?.id,
      }, 'medium');

      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return false;
    }

    // Check if user is active (not banned/deleted)
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      logSecurityEvent('banned_user_access_attempt', {
        ip: clientIP,
        userAgent,
        userId: user.id,
        bannedUntil: user.banned_until,
      }, 'high');

      res.status(403).json({
        error: 'Account temporarily suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
      return false;
    }

    // Validate user email is confirmed (for sensitive operations)
    if (!user.email_confirmed_at && req.method !== 'GET') {
      res.status(403).json({
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return false;
    }

    // Add user info to request
    req.userId = user.id;
    req.user = user;

    // Log successful authentication
    logSecurityEvent('auth_success', {
      userId: user.id,
      ip: clientIP,
      userAgent,
      path: req.url,
    }, 'low');

    if (next) next();
    return true;

  } catch (error) {
    console.error('Authentication error:', error);

    logSecurityEvent('auth_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
      userAgent: req.headers['user-agent'],
    }, 'high');

    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
    return false;
  }
}

export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    const isAuthenticated = await authenticateRequest(req, res);
    if (isAuthenticated) {
      await handler(req, res);
    }
  };
}

export function handleCORS(req: VercelRequest, res: VercelResponse): boolean {
  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'exp://localhost:19000', // Expo development
    'later://app', // Production app scheme
    'https://later-app.vercel.app', // Web app (if applicable)
  ];

  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Allow localhost in development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  // Set other CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

export function createErrorResponse(
  res: VercelResponse,
  message: string,
  status = 400,
  code?: string,
  details?: any
) {
  return res.status(status).json({
    error: message,
    code,
    details,
    timestamp: new Date().toISOString()
  });
}

export function createSuccessResponse(
  res: VercelResponse,
  data: any,
  status = 200
) {
  return res.status(status).json(data);
}