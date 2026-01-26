import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { WordPressAPI } from "@/lib/wordpress";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/sites/[id]/health - Check site health
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, parseInt(id)),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const wp = new WordPressAPI({
      siteUrl: site.url,
      username: site.apiUsername,
      password: site.apiPassword,
    });

    const health = await wp.checkHealth();

    // Update site status in database
    await db
      .update(sites)
      .set({
        status: health.online ? "online" : "offline",
        lastChecked: new Date().toISOString(),
      })
      .where(eq(sites.id, parseInt(id)));

    return NextResponse.json({
      online: health.online,
      wpVersion: health.version,
      ssl: health.is_ssl,
    });
  } catch (error) {
    console.error("Failed to check site health:", error);
    return NextResponse.json(
      { error: "Failed to check site health" },
      { status: 500 }
    );
  }
}
