import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, plugins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { WordPressAPI } from "@/lib/wordpress";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/sites/[id]/plugins - Get and sync plugins
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

    const wpPlugins = await wp.getPlugins();

    // Clear existing plugins and insert fresh data
    await db.delete(plugins).where(eq(plugins.siteId, site.id));

    const pluginData = wpPlugins.map((p) => ({
      siteId: site.id,
      name: p.name,
      slug: p.plugin,
      version: p.version,
      updateAvailable: !!p.update,
      newVersion: p.update?.version || null,
      isActive: p.status === "active",
    }));

    if (pluginData.length > 0) {
      await db.insert(plugins).values(pluginData);
    }

    // Fetch the newly inserted plugins
    const sitePlugins = await db.query.plugins.findMany({
      where: eq(plugins.siteId, site.id),
    });

    return NextResponse.json(sitePlugins);
  } catch (error) {
    console.error("Failed to fetch plugins:", error);
    return NextResponse.json(
      { error: "Failed to fetch plugins" },
      { status: 500 }
    );
  }
}

// POST /api/sites/[id]/plugins - Update a plugin
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pluginSlug } = body;

    if (!pluginSlug) {
      return NextResponse.json(
        { error: "Plugin slug required" },
        { status: 400 }
      );
    }

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

    const updated = await wp.updatePlugin(pluginSlug);

    return NextResponse.json({
      success: true,
      plugin: updated,
    });
  } catch (error) {
    console.error("Failed to update plugin:", error);
    return NextResponse.json(
      { error: "Failed to update plugin" },
      { status: 500 }
    );
  }
}
