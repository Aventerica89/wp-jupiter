import { NextResponse } from "next/server";

/**
 * Parse and validate an ID parameter
 * Returns the parsed ID or null if invalid
 */
export function parseId(id: string): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/**
 * Create an error response for invalid ID
 */
export function invalidIdResponse(): NextResponse {
  return NextResponse.json(
    { error: "Invalid ID format" },
    { status: 400 }
  );
}

/**
 * Sanitize error for logging - remove sensitive information
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Remove potentially sensitive stack traces and details
    return error.message.replace(/password|secret|token|key/gi, "[REDACTED]");
  }
  return "Unknown error";
}

/**
 * Create API error response
 * In production, details are hidden
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  const isDev = process.env.NODE_ENV === "development";

  return NextResponse.json(
    {
      error: message,
      ...(isDev && details ? { details } : {}),
    },
    { status }
  );
}

/**
 * Escape SQL LIKE pattern special characters
 */
export function escapeLikePattern(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Validate and constrain search query
 */
export function validateSearchQuery(query: string | null): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!query || query.length < 2) {
    return { valid: false, error: "Query must be at least 2 characters" };
  }

  if (query.length > 200) {
    return { valid: false, error: "Query too long (max 200 characters)" };
  }

  return {
    valid: true,
    sanitized: escapeLikePattern(query.trim()),
  };
}
