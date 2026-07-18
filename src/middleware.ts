import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// Rate limiting store (in-memory for single instance)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Rate limits keyed by "METHOD:path" — use "ANY:path" for method-agnostic limits
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  // Auth routes - stricter
  'ANY:/api/auth/login': { max: 5, windowMs: 60 * 1000 },       // 5 req/min
  'ANY:/api/auth/register': { max: 3, windowMs: 60 * 1000 },     // 3 req/min
  // POST routes - stricter
  'POST:/api/orders': { max: 10, windowMs: 60 * 1000 },          // 10 req/min (POST only)
  'POST:/api/upload': { max: 10, windowMs: 60 * 1000 },          // 10 req/min (POST only)
  // General API - moderate (all methods)
  'ANY:/api/orders': { max: 60, windowMs: 60 * 1000 },           // 60 req/min (GET etc.)
  'ANY:/api/products': { max: 60, windowMs: 60 * 1000 },         // 60 req/min
  'ANY:/api/upload': { max: 60, windowMs: 60 * 1000 },           // 60 req/min (GET etc.)
  // DB management - very strict
  'ANY:/api/settings/db-management': { max: 2, windowMs: 60 * 1000 }, // 2 req/min
  // Admin routes
  'ANY:/api/settings/reset-data': { max: 1, windowMs: 60 * 1000 },  // 1 req/min
};

// Default rate limit for any API route
const DEFAULT_LIMIT = { max: 60, windowMs: 60 * 1000 };

// Cleanup old entries every 5 minutes
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function cleanup() {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now - val.lastReset > 5 * 60 * 1000) {
      rateLimitMap.delete(key);
    }
  }
}

function getRateLimitKey(path: string, ip: string): string {
  return `${ip}:${path}`;
}

function checkRateLimit(path: string, method: string, ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, 5 * 60 * 1000);
  }

  // Check method-specific limit first (e.g. "POST:/api/orders")
  const methodKey = `${method}:${path}`;
  const limit = RATE_LIMITS[methodKey] || RATE_LIMITS[`ANY:${path}`] || DEFAULT_LIMIT;
  const key = getRateLimitKey(methodKey, ip);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.lastReset >= limit.windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return { allowed: true, remaining: limit.max - 1, resetIn: limit.windowMs };
  }

  if (entry.count >= limit.max) {
    const resetIn = entry.lastReset + limit.windowMs - now;
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  return { allowed: true, remaining: limit.max - entry.count, resetIn: entry.lastReset + limit.windowMs - now };
}

// Paths that don't require auth check
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/products',
  '/api/categories',
  '/api/settings/public',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Security headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { allowed, remaining, resetIn } = checkRateLimit(pathname, request.method, ip);

  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));

  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
      {
        status: 429,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Retry-After': String(Math.ceil(resetIn / 1000)),
        },
      }
    );
  }

  // Auth check for protected routes (skip public paths)
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (!isPublicPath) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);
      if (payload) {
        // Check if user is blocked or suspended — this is async but we use sync middleware
        // We handle this by attaching a header that API routes can check
        // For the actual DB check, we need to use a different approach
        // Since middleware must be sync in Next.js, we delegate to an internal check
        return checkUserStatus(request, response, payload.userId);
      }
    }
  }

  return response;
}

// Cache user status to avoid hitting DB on every request
const userStatusCache = new Map<string, { blocked: boolean; suspended: boolean; checkedAt: number }>();
const STATUS_CACHE_TTL = 30 * 1000; // 30 seconds

async function checkUserStatus(
  request: NextRequest,
  response: NextResponse,
  userId: string
): Promise<NextResponse> {
  const now = Date.now();
  const cached = userStatusCache.get(userId);

  if (cached && now - cached.checkedAt < STATUS_CACHE_TTL) {
    if (cached.blocked) {
      return NextResponse.json(
        { error: 'Votre compte a été bloqué. Contactez le support pour plus d\'informations.', code: 'ACCOUNT_BLOCKED' },
        {
          status: 403,
          headers: Object.fromEntries(response.headers.entries()),
        }
      );
    }
    if (cached.suspended) {
      return NextResponse.json(
        { error: 'Votre compte a été suspendu temporairement. Contactez le support.', code: 'ACCOUNT_SUSPENDED' },
        {
          status: 403,
          headers: Object.fromEntries(response.headers.entries()),
        }
      );
    }
    return response;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isBlocked: true, isSuspended: true, isActive: true },
    });

    if (user) {
      userStatusCache.set(userId, {
        blocked: user.isBlocked,
        suspended: user.isSuspended,
        checkedAt: now,
      });

      // Clean old cache entries periodically
      if (userStatusCache.size > 1000) {
        for (const [key, val] of userStatusCache.entries()) {
          if (now - val.checkedAt > STATUS_CACHE_TTL * 2) {
            userStatusCache.delete(key);
          }
        }
      }

      if (user.isBlocked) {
        return NextResponse.json(
          { error: 'Votre compte a été bloqué. Contactez le support pour plus d\'informations.', code: 'ACCOUNT_BLOCKED' },
          {
            status: 403,
            headers: Object.fromEntries(response.headers.entries()),
          }
        );
      }

      if (user.isSuspended) {
        return NextResponse.json(
          { error: 'Votre compte a été suspendu temporairement. Contactez le support.', code: 'ACCOUNT_SUSPENDED' },
          {
            status: 403,
            headers: Object.fromEntries(response.headers.entries()),
          }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Votre compte est désactivé. Contactez le support.', code: 'ACCOUNT_INACTIVE' },
          {
            status: 403,
            headers: Object.fromEntries(response.headers.entries()),
          }
        );
      }
    }
  } catch (error) {
    // If DB check fails, allow the request through (fail open)
    // The individual route handlers will handle auth properly
    console.error('Middleware user status check error:', error);
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};