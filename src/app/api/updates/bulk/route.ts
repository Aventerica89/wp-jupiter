import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, plugins, themes, updateLog } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { WordPressAPI } from "@/lib/wordpress";
import { bulkUpdateSchema } from "@/lib/validations";
import { logger } from "@/lib/activity-logger";

interface UpdateResult {
  siteId: number;
  type: "plugin" | "theme";
  slug: string;
  status: "success" | "failed";
  message?: string;
  newVersion?: string;
}

// POST /api/updates/bulk - Execute bulk updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = bulkUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { updates } = result.data;

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Log bulk update start
    await logger.bulkUpdateStarted(updates.length);

    // Group updates by site for efficient processing
    const updatesBySite = new Map<number, typeof updates>();
    for (const update of updates) {
      const siteUpdates = updatesBySite.get(update.siteId) || [];
      siteUpdates.push(update);
      updatesBySite.set(update.siteId, siteUpdates);
    }

    // Get all required sites
    const siteIds = Array.from(updatesBySite.keys());
    const allSites = await db.query.sites.findMany({
      where: inArray(sites.id, siteIds),
    });

    const siteMap = new Map(allSites.map((s) => [s.id, s]));

    const results: UpdateResult[] = [];

    // Process sites with concurrency limit
    const CONCURRENCY_LIMIT = 3;
    const siteEntries = Array.from(updatesBySite.entries());

    for (let i = 0; i < siteEntries.length; i += CONCURRENCY_LIMIT) {
      const batch = siteEntries.slice(i, i + CONCURRENCY_LIMIT);

      const batchResults = await Promise.allSettled(
        batch.map(async ([siteId, siteUpdates]) => {
          const site = siteMap.get(siteId);
          if (!site) {
            return siteUpdates.map((u) => ({
              siteId,
              type: u.type,
              slug: u.slug,
              status: "failed" as const,
              message: "Site not found",
            }));
          }

          try {
            const decryptedPassword = decrypt(site.apiPassword);
            const wp = new WordPressAPI({
              siteUrl: site.url,
              username: site.apiUsername,
              password: decryptedPassword,
            });

            const updateResults: UpdateResult[] = [];

            // Process updates sequentially per site to avoid conflicts
            for (const update of siteUpdates) {
              try {
                if (update.type === "plugin") {
                  const updated = await wp.updatePluginVersion(update.slug);

                  // Update local database
                  await db
                    .update(plugins)
                    .set({
                      version: updated.version,
                      updateAvailable: false,
                      newVersion: null,
                    })
                    .where(
                      and(
                        eq(plugins.siteId, siteId),
                        eq(plugins.slug, update.slug)
                      )
                    );

                  updateResults.push({
                    siteId,
                    type: "plugin",
                    slug: update.slug,
                    status: "success",
                    newVersion: updated.version,
                  });
                } else {
                  const updated = await wp.updateThemeVersion(update.slug);

                  // Update local database
                  await db
                    .update(themes)
                    .set({
                      version: updated.version,
                      updateAvailable: false,
                      newVersion: null,
                    })
                    .where(
                      and(
                        eq(themes.siteId, siteId),
                        eq(themes.slug, update.slug)
                      )
                    );

                  updateResults.push({
                    siteId,
                    type: "theme",
                    slug: update.slug,
                    status: "success",
                    newVersion: updated.version,
                  });
                }
              } catch (updateError) {
                updateResults.push({
                  siteId,
                  type: update.type,
                  slug: update.slug,
                  status: "failed",
                  message:
                    updateError instanceof Error
                      ? updateError.message
                      : "Update failed",
                });
              }
            }

            // Re-sync plugins and themes from WordPress to get actual state
            // This ensures our database reflects reality after updates
            try {
              const [freshPlugins, freshThemes] = await Promise.all([
                wp.getPlugins(),
                wp.getThemes(),
              ]);

              // Update plugin states from WordPress
              for (const p of freshPlugins) {
                await db
                  .update(plugins)
                  .set({
                    version: p.version,
                    updateAvailable: !!p.update,
                    newVersion: p.update?.version || null,
                    isActive: p.status === "active",
                  })
                  .where(
                    and(eq(plugins.siteId, siteId), eq(plugins.slug, p.plugin))
                  );
              }

              // Update theme states from WordPress
              for (const t of freshThemes) {
                await db
                  .update(themes)
                  .set({
                    version: t.version,
                    updateAvailable: !!t.update,
                    newVersion: t.update?.version || null,
                    isActive: t.status === "active",
                  })
                  .where(
                    and(eq(themes.siteId, siteId), eq(themes.slug, t.stylesheet))
                  );
              }
            } catch (syncError) {
              console.error(`Re-sync failed for site ${siteId}:`, syncError);
              // Don't fail the whole operation, just log the sync error
            }

            return updateResults;
          } catch (siteError) {
            return siteUpdates.map((u) => ({
              siteId,
              type: u.type,
              slug: u.slug,
              status: "failed" as const,
              message:
                siteError instanceof Error
                  ? siteError.message
                  : "Site connection failed",
            }));
          }
        })
      );

      // Collect results
      for (const batchResult of batchResults) {
        if (batchResult.status === "fulfilled") {
          results.push(...batchResult.value);
        }
      }
    }

    // Log results to update_log table
    const logEntries = results.map((r) => ({
      siteId: r.siteId,
      itemType: r.type as "plugin" | "theme",
      itemSlug: r.slug,
      itemName: r.slug,
      toVersion: r.newVersion || null,
      status: r.status as "success" | "failed",
      errorMessage: r.message || null,
      completedAt: new Date().toISOString(),
    }));

    if (logEntries.length > 0) {
      await db.insert(updateLog).values(logEntries);
    }

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    // Log bulk update completion
    await logger.bulkUpdateCompleted(summary.successful, summary.failed);

    return NextResponse.json({
      results,
      summary,
    });
  } catch (error) {
    console.error("Bulk update failed:", error);
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
}
