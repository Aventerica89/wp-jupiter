import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, plugins, themes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { WordPressAPI } from "@/lib/wordpress";

// POST /api/sync - Sync all sites
export async function POST() {
  try {
    const allSites = await db.query.sites.findMany();

    const results = await Promise.allSettled(
      allSites.map(async (site) => {
        // Decrypt the password before using
        const decryptedPassword = decrypt(site.apiPassword);

        const wp = new WordPressAPI({
          siteUrl: site.url,
          username: site.apiUsername,
          password: decryptedPassword,
        });

        // Check health
        const health = await wp.checkHealth();

        // Update site status
        await db
          .update(sites)
          .set({
            status: health.online ? "online" : "offline",
            lastChecked: new Date().toISOString(),
          })
          .where(eq(sites.id, site.id));

        if (!health.online) {
          return { siteId: site.id, status: "offline", synced: false };
        }

        // Sync plugins
        try {
          const wpPlugins = await wp.getPlugins();
          await db.delete(plugins).where(eq(plugins.siteId, site.id));

          if (wpPlugins.length > 0) {
            await db.insert(plugins).values(
              wpPlugins.map((p) => ({
                siteId: site.id,
                name: p.name,
                slug: p.plugin,
                version: p.version,
                updateAvailable: !!p.update,
                newVersion: p.update?.version || null,
                isActive: p.status === "active",
              }))
            );
          }
        } catch (e) {
          console.error(`Failed to sync plugins for site ${site.id}:`, e);
        }

        // Sync themes
        try {
          const wpThemes = await wp.getThemes();
          await db.delete(themes).where(eq(themes.siteId, site.id));

          if (wpThemes.length > 0) {
            await db.insert(themes).values(
              wpThemes.map((t) => ({
                siteId: site.id,
                name: t.name,
                slug: t.stylesheet,
                version: t.version,
                updateAvailable: !!t.update,
                newVersion: t.update?.version || null,
                isActive: t.status === "active",
              }))
            );
          }
        } catch (e) {
          console.error(`Failed to sync themes for site ${site.id}:`, e);
        }

        return { siteId: site.id, status: "online", synced: true };
      })
    );

    const summary = {
      total: allSites.length,
      synced: results.filter(
        (r) => r.status === "fulfilled" && r.value.synced
      ).length,
      offline: results.filter(
        (r) => r.status === "fulfilled" && !r.value.synced
      ).length,
      failed: results.filter((r) => r.status === "rejected").length,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
