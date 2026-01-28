import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, servers, providers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { createSiteSchema } from "@/lib/validations";
import { logger } from "@/lib/activity-logger";

// GET /api/sites - Get all sites
export async function GET() {
  try {
    const allSites = await db.query.sites.findMany({
      with: {
        plugins: true,
        themes: true,
        server: {
          with: {
            provider: true,
          },
        },
      },
    });

    // Calculate update counts and strip sensitive data
    const sitesWithCounts = allSites.map((site) => ({
      id: site.id,
      name: site.name,
      url: site.url,
      wpVersion: site.wpVersion,
      phpVersion: site.phpVersion,
      status: site.status,
      sslExpiry: site.sslExpiry,
      lastChecked: site.lastChecked,
      notes: site.notes,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
      pluginUpdates: site.plugins.filter((p) => p.updateAvailable).length,
      themeUpdates: site.themes.filter((t) => t.updateAvailable).length,
      serverId: site.serverId,
      serverName: site.server?.name || null,
      serverIp: site.server?.ipAddress || null,
      providerId: site.server?.providerId || null,
      providerName: site.server?.provider?.name || null,
      providerSlug: site.server?.provider?.slug || null,
      providerLogo: site.server?.provider?.logoUrl || null,
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

    // Validate input with Zod
    const result = createSiteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, url, apiUsername, apiPassword } = result.data;

    // Check if site already exists
    const normalizedUrl = url.replace(/\/$/, "");
    const existing = await db.query.sites.findFirst({
      where: eq(sites.url, normalizedUrl),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Site already exists" },
        { status: 409 }
      );
    }

    // Encrypt the password before storing
    const encryptedPassword = encrypt(apiPassword);

    const [newSite] = await db
      .insert(sites)
      .values({
        name,
        url: normalizedUrl,
        apiUsername,
        apiPassword: encryptedPassword,
        status: "unknown",
        serverId: body.serverId || null,
        notes: body.notes || null,
      })
      .returning({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        status: sites.status,
        createdAt: sites.createdAt,
      });

    // Log the activity
    await logger.siteAdded(newSite.id, newSite.name);

    return NextResponse.json(newSite, { status: 201 });
  } catch (error) {
    console.error("Failed to create site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
