import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for Platform Security
 * Injects defensive HTTP security headers and establishes secure routing context.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Clone response or create new
  const response = NextResponse.next();

  // 1. Strict Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // 2. Framing Policy
  // Allow /display routes to be embedded in OBS or production studio frames
  if (pathname.startsWith('/display')) {
    response.headers.set('X-Frame-Options', 'ALLOWALL');
  } else {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  }

  // 3. Strict Transport Security (HSTS) in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // 4. Content Security Policy (CSP)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self' *",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  // 5. Audit Trace ID Header
  const traceId = request.headers.get('x-trace-id') || crypto.randomUUID();
  response.headers.set('x-trace-id', traceId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
