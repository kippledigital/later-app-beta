// Security utilities for API endpoints
import { VercelRequest, VercelResponse } from '@vercel/node';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { z } from 'zod';

// Rate limiting configuration
const createRateLimiter = (
  windowMs: number,
  max: number,
  message = 'Too many requests'
) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message, code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).userId;
      return userId || req.ip || 'unknown';
    },
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts'
);

export const apiRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  100, // 100 requests per minute
  'API rate limit exceeded'
);

export const contentRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 content operations per minute
  'Content operation rate limit exceeded'
);

// Speed limiting for suspicious activity
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Input validation schemas
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().min(1).max(100);
export const urlSchema = z.string().url().max(2048);
export const uuidSchema = z.string().uuid();

export const contentInputSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().max(50000).optional(),
  url: urlSchema.optional(),
  source: z.enum(['email', 'web_url', 'voice_note', 'screenshot', 'manual_entry', 'shared_content']),
  tags: z.array(z.string().max(50)).max(20).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Security headers
export function setSecurityHeaders(res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

// Input sanitization
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

// Content validation
export function validateContent(content: any) {
  const result = contentInputSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Invalid content: ${result.error.message}`);
  }
  return result.data;
}

export function validatePagination(query: any) {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    throw new Error(`Invalid pagination: ${result.error.message}`);
  }
  return result.data;
}

// Request validation wrapper
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: VercelRequest & { validatedBody: T }, res: VercelResponse) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const validated = schema.parse(req.body);
      await handler({ ...req, validatedBody: validated }, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      throw error;
    }
  };
}

// SQL injection protection
export function validateSQLInput(input: string): boolean {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b.*\b=\b.*\bOR\b)/i,
    /(\bAND\b.*\b=\b.*\bAND\b)/i,
  ];

  return !sqlInjectionPatterns.some(pattern => pattern.test(input));
}

// File upload validation
export function validateFileUpload(file: any): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/pdf',
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file || !file.type || !file.size) {
    return false;
  }

  if (!allowedTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    issues.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    issues.push('Password is too common');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// IP whitelist validation (for admin endpoints)
export function validateIPWhitelist(req: VercelRequest): boolean {
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  if (whitelist.length === 0) return true; // No whitelist configured

  const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress;
  const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;

  return whitelist.includes(ip || '');
}

// Request logging for security monitoring
export function logSecurityEvent(
  event: string,
  details: any,
  severity: 'low' | 'medium' | 'high' = 'medium'
) {
  const timestamp = new Date().toISOString();

  console.log(JSON.stringify({
    timestamp,
    type: 'security_event',
    event,
    severity,
    details,
  }));

  // In production, you might want to send this to a security monitoring service
  if (process.env.NODE_ENV === 'production' && severity === 'high') {
    // Send alert to security team
  }
}