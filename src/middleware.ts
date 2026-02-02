import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// SECURITY: Fail fast if no secret is configured in production
const rawSecret = process.env.AUTH_SECRET || process.env.ENCRYPTION_SECRET;
if (!rawSecret && process.env.NODE_ENV === "production") {
  throw new Error("CRITICAL: AUTH_SECRET or ENCRYPTION_SECRET must be set in production");
}

const SECRET_KEY = new TextEncoder().encode(
  rawSecret || "dev-only-fallback-secret-not-for-production"
);

const SESSION_COOKIE = "wp-jupiter-session";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/status",
  "/login",
  "/_next",
  "/favicon.ico",
];

// Rate limiting storage (in-memory, resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  maxAuthAttempts: 5, // 5 login attempts per minute
};

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(
  ip: string,
  key: string,
  limit: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const rateLimitKey = `${key}:${ip}`;
  const record = rateLimitStore.get(rateLimitKey);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // Still add security headers
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const isAuthRoute = pathname.startsWith("/api/auth/login");
    const limit = isAuthRoute ? RATE_LIMIT.maxAuthAttempts : RATE_LIMIT.maxRequests;
    const { allowed, remaining } = checkRateLimit(ip, isAuthRoute ? "auth" : "api", limit);

    if (!allowed) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": "60",
              "X-RateLimit-Remaining": "0",
            },
          }
        )
      );
    }

    // Check if auth is enabled (ADMIN_PASSWORD is set)
    const authEnabled = !!process.env.ADMIN_PASSWORD;

    if (authEnabled) {
      // Verify session token
      const token = request.cookies.get(SESSION_COOKIE)?.value;

      if (!token) {
        return addSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );
      }

      try {
        await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
      } catch {
        return addSecurityHeaders(
          NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
        );
      }
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return addSecurityHeaders(response);
  }

  // For non-API routes, check auth and redirect to login if needed
  const authEnabled = !!process.env.ADMIN_PASSWORD;

  if (authEnabled && pathname !== "/login") {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
