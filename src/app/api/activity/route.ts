import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLog, sites } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    const query = db
      .select({
        id: activityLog.id,
        siteId: activityLog.siteId,
        siteName: sites.name,
        siteUrl: sites.url,
        action: activityLog.action,
        status: activityLog.status,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(sites, eq(activityLog.siteId, sites.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter by site if provided
    const logs = siteId
      ? await query.where(eq(activityLog.siteId, parseInt(siteId, 10)))
      : await query;

    // Get total count for pagination
    const allLogs = await db.select({ id: activityLog.id }).from(activityLog);
    const total = allLogs.length;

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
