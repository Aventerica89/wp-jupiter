import { NextRequest, NextResponse } from "next/server";
import { checkAllSitesUptime } from "@/lib/uptime-monitor";
import { sanitizeError, apiError } from "@/lib/api-utils";

// HIGH FIX: Add rate limiting to prevent abuse
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now - record.timestamp > RATE_LIMIT_WINDOW * 5) {
      requestCounts.delete(ip);
    }
  }
}, 300000);

// POST /api/uptime/check - Run uptime checks on all sites
export async function POST(request: NextRequest) => {
  try {
    // Rate limiting check
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    const now = Date.now();
    const record = requestCounts.get(ip);

    if (record && now - record.timestamp < RATE_LIMIT_WINDOW) {
      if (record.count >= MAX_REQUESTS) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again later." },
          { status: 429 }
        );
      }
      record.count++;
    } else {
      requestCounts.set(ip, { count: 1, timestamp: now }
    }

    // Perform uptime checks
    const results = await checkAllSitesUptime();

    return NextResponse.json({
      success: true,
      checked: results.length,
      results: results.map((r) => ({
        siteId: r.siteId,
        status: r.status,
        responseTime: r.responseTime,
      })),
    }
  } catch (error) {
    console.error("Uptime check failed:", sanitizeError(error));
    return apiError("Uptime check failed");
  }
}
