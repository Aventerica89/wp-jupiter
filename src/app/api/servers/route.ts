import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { servers, sites, providers, activityLog } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/servers - List all servers with site counts
export async function GET() {
  try {
    const allServers = await db
      .select({
        id: servers.id,
        name: servers.name,
        ipAddress: servers.ipAddress,
        externalId: servers.externalId,
        region: servers.region,
        notes: servers.notes,
        providerId: servers.providerId,
        providerName: providers.name,
        providerSlug: providers.slug,
        providerLogo: providers.logoUrl,
        providerDashboard: providers.dashboardUrl,
        serverUrlPattern: providers.serverUrlPattern,
        createdAt: servers.createdAt,
        siteCount: sql<number>`(SELECT COUNT(*) FROM sites WHERE sites.server_id = servers.id)`,
      })
      .from(servers)
      .leftJoin(providers, eq(servers.providerId, providers.id))
      .orderBy(servers.name);

    return NextResponse.json(allServers);
  } catch (error) {
    console.error("Error fetching servers:", error);
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}

// POST /api/servers - Create a new server
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await db.insert(servers).values({
      providerId: body.providerId || null,
      name: body.name,
      ipAddress: body.ipAddress || null,
      externalId: body.externalId || null,
      region: body.region || null,
      notes: body.notes || null,
    }).returning();

    // Log activity
    await db.insert(activityLog).values({
      action: "server_added",
      status: "success",
      details: `Added server: ${body.name}`,
    });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating server:", error);
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    );
  }
}
