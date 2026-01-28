import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { servers, sites, providers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/servers/[id] - Get server details with sites
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serverId = parseInt(id, 10);

    // Get server with provider info
    const serverResult = await db
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
        docsUrl: providers.docsUrl,
        supportUrl: providers.supportUrl,
        communityUrl: providers.communityUrl,
        createdAt: servers.createdAt,
      })
      .from(servers)
      .leftJoin(providers, eq(servers.providerId, providers.id))
      .where(eq(servers.id, serverId))
      .limit(1);

    if (serverResult.length === 0) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    // Get sites on this server
    const serverSites = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        status: sites.status,
        wpVersion: sites.wpVersion,
        lastChecked: sites.lastChecked,
      })
      .from(sites)
      .where(eq(sites.serverId, serverId));

    return NextResponse.json({
      ...serverResult[0],
      sites: serverSites,
    });
  } catch (error) {
    console.error("Error fetching server:", error);
    return NextResponse.json(
      { error: "Failed to fetch server" },
      { status: 500 }
    );
  }
}

// PUT /api/servers/[id] - Update server
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serverId = parseInt(id, 10);
    const body = await request.json();

    const result = await db
      .update(servers)
      .set({
        providerId: body.providerId,
        name: body.name,
        ipAddress: body.ipAddress,
        externalId: body.externalId,
        region: body.region,
        notes: body.notes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(servers.id, serverId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    await db.insert(activityLog).values({
      action: "server_updated",
      status: "success",
      details: `Updated server: ${body.name}`,
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating server:", error);
    return NextResponse.json(
      { error: "Failed to update server" },
      { status: 500 }
    );
  }
}

// DELETE /api/servers/[id] - Delete server
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serverId = parseInt(id, 10);

    // Get server name for logging
    const server = await db
      .select({ name: servers.name })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (server.length === 0) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    // Unlink sites from this server (don't delete them)
    await db
      .update(sites)
      .set({ serverId: null })
      .where(eq(sites.serverId, serverId));

    // Delete the server
    await db.delete(servers).where(eq(servers.id, serverId));

    await db.insert(activityLog).values({
      action: "server_updated",
      status: "info",
      details: `Deleted server: ${server[0].name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting server:", error);
    return NextResponse.json(
      { error: "Failed to delete server" },
      { status: 500 }
    );
  }
}
