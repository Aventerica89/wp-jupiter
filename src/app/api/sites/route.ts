import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/sites - Get all sites
export async function GET() {
  try {
    const allSites = await db.query.sites.findMany({
      with: {
        plugins: true,
        themes: true,
      },
    });

    // Calculate update counts for each site
    const sitesWithCounts = allSites.map((site) => ({
      ...site,
      pluginUpdates: site.plugins.filter((p) => p.updateAvailable).length,
      themeUpdates: site.themes.filter((t) => t.updateAvailable).length,
    }));

    return NextResponse.json(sitesWithCounts);
  } catch (error) {
    console.error("Failed to fetch sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

// POST /api/sites - Add a new site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, apiUsername, apiPassword } = body;

    if (!name || !url || !apiUsername || !apiPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if site already exists
    const existing = await db.query.sites.findFirst({
      where: eq(sites.url, url),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Site already exists" },
        { status: 409 }
      );
    }

    const [newSite] = await db
      .insert(sites)
      .values({
        name,
        url: url.replace(/\/$/, ""), // Remove trailing slash
        apiUsername,
        apiPassword,
        status: "unknown",
      })
      .returning();

    return NextResponse.json(newSite, { status: 201 });
  } catch (error) {
    console.error("Failed to create site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
