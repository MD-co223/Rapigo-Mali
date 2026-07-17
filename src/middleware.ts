import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in-memory for single instance)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  // Auth routes - stricter
  '/api/auth/login': { max: 5, windowMs: 60 * 1000 },       // 5 req/min
  '/api/auth/register': { max: 3, windowMs: 60 * 1000 },     // 3 req/min
  // General API - moderate
  '/api/orders': { max: 30, windowMs: 60 * 1000 },           // 30 req/min
  '/api/products': { max: 60, windowMs: 60 * 1000 },         // 60 req/min
  // DB management - very strict
  '/api/settings/db-management': { max: 2, windowMs: 60 * 1000 }, // 2 req/min
  // Admin routes
  '/api/settings/reset-data': { max: 1, windowMs: 60 * 1000 },  // 1 req/min
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

function checkRateLimit(path: string, ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, 5 * 60 * 1000);
  }

  const limit = RATE_LIMITS[path] || DEFAULT_LIMIT;
  const key = getRateLimitKey(path, ip);
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

  const { allowed, remaining, resetIn } = checkRateLimit(pathname, ip);

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

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};