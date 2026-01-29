import { NextRequest, NextResponse } from "next/server";

/**
 * Simple authentication check using ADMIN_PASSWORD environment variable
 * In production, replace with proper authentication (NextAuth, Clerk, etc.)
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no ADMIN_PASSWORD is set, allow access (for development)
  if (!adminPassword) {
    console.warn("WARNING: ADMIN_PASSWORD not set. API routes are unprotected!");
    return null;
  }

  // Check for Authorization header
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Authorization required" },
      { status: 401 }
    );
  }

  // Support both "Bearer <password>" and direct password
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  if (token !== adminPassword) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Authentication successful
  return null;
}

/**
 * Wrapper for API route handlers that adds authentication
 */
export function withAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    return handler(request, context);
  };
}
