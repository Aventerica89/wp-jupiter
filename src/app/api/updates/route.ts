import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { plugins, themes, sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface PendingUpdate {
  id: string;
  siteId: number;
  siteName: string;
  siteUrl: string;
  type: "plugin" | "theme";
  name: string;
  slug: string;
  currentVersion: string;
  newVersion: string;
  isActive: boolean;
}

// GET /api/updates - Get all pending updates across all sites
export async function GET() {
  try {
    // Get all plugins with updates
    const pluginsWithUpdates = await db
      .select({
        siteId: sites.id,
        siteName: sites.name,
        siteUrl: sites.url,
        pluginId: plugins.id,
        name: plugins.name,
        slug: plugins.slug,
        currentVersion: plugins.version,
        newVersion: plugins.newVersion,
        isActive: plugins.isActive,
      })
      .from(plugins)
      .innerJoin(sites, eq(plugins.siteId, sites.id))
      .where(eq(plugins.updateAvailable, true));

    // Get all themes with updates
    const themesWithUpdates = await db
      .select({
        siteId: sites.id,
        siteName: sites.name,
        siteUrl: sites.url,
        themeId: themes.id,
        name: themes.name,
        slug: themes.slug,
        currentVersion: themes.version,
        newVersion: themes.newVersion,
        isActive: themes.isActive,
      })
      .from(themes)
      .innerJoin(sites, eq(themes.siteId, sites.id))
      .where(eq(themes.updateAvailable, true));

    const pendingUpdates: PendingUpdate[] = [
      ...pluginsWithUpdates.map((p) => ({
        id: `${p.siteId}-plugin-${p.slug}`,
        siteId: p.siteId,
        siteName: p.siteName,
        siteUrl: p.siteUrl,
        type: "plugin" as const,
        name: p.name,
        slug: p.slug,
        currentVersion: p.currentVersion || "unknown",
        newVersion: p.newVersion || "unknown",
        isActive: p.isActive ?? true,
      })),
      ...themesWithUpdates.map((t) => ({
        id: `${t.siteId}-theme-${t.slug}`,
        siteId: t.siteId,
        siteName: t.siteName,
        siteUrl: t.siteUrl,
        type: "theme" as const,
        name: t.name,
        slug: t.slug,
        currentVersion: t.currentVersion || "unknown",
        newVersion: t.newVersion || "unknown",
        isActive: t.isActive ?? false,
      })),
    ];

    // Group by site for summary
    const summary = {
      totalUpdates: pendingUpdates.length,
      pluginUpdates: pluginsWithUpdates.length,
      themeUpdates: themesWithUpdates.length,
      siteCount: new Set(pendingUpdates.map((u) => u.siteId)).size,
    };

    return NextResponse.json({
      updates: pendingUpdates,
      summary,
    });
  } catch (error) {
    console.error("Failed to fetch pending updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending updates" },
      { status: 500 }
    );
  }
}
