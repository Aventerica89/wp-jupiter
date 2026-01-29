import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, siteTags, activityLog } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { sanitizeError, apiError } from "@/lib/api-utils";

const MAX_BULK_SITES = 100;

// POST /api/sites/bulk - Perform bulk operations on sites
export async function POST(request: NextRequest) {
  try {
    const { action, siteIds, ...params } = await request.json();

    if (!action || !siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
      return NextResponse.json(
        { error: "Action and site IDs are required" },
        { status: 400 }
      );
    }

    // CRITICAL FIX: Validate that all siteIds are positive integers
    if (!siteIds.every((id) => typeof id === "number" && Number.isInteger(id) && id > 0)) {
      return NextResponse.json(
        { error: "All site IDs must be valid positive integers" },
        { status: 400 }
      );
    }

    // CRITICAL FIX: Add bulk operation limit
    if (siteIds.length > MAX_BULK_SITES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BULK_SITES} sites allowed per bulk operation` },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    switch (action) {
      case "archive":
        await db
          .update(sites)
          .set({
            isArchived: true,
            updatedAt: new Date().toISOString(),
          })
          .where(inArray(sites.id, siteIds));

        for (const siteId of siteIds) {
          await db.insert(activityLog).values({
            siteId,
            action: "site_updated",
            status: "info",
            details: "Site archived via bulk action",
          });
        }

        results.success = siteIds.length;
        break;

      case "unarchive":
        await db
          .update(sites)
          .set({
            isArchived: false,
            updatedAt: new Date().toISOString(),
          })
          .where(inArray(sites.id, siteIds));

        for (const siteId of siteIds) {
          await db.insert(activityLog).values({
            siteId,
            action: "site_updated",
            status: "info",
            details: "Site unarchived via bulk action",
          });
        }

        results.success = siteIds.length;
        break;

      case "favorite":
        await db
          .update(sites)
          .set({
            isFavorite: true,
            updatedAt: new Date().toISOString(),
          })
          .where(inArray(sites.id, siteIds));

        results.success = siteIds.length;
        break;

      case "unfavorite":
        await db
          .update(sites)
          .set({
            isFavorite: false,
            updatedAt: new Date().toISOString(),
          })
          .where(inArray(sites.id, siteIds));

        results.success = siteIds.length;
        break;

      case "delete":
        // HIGH FIX: Log before deletion to avoid foreign key issues
        for (const siteId of siteIds) {
          await db.insert(activityLog).values({
            siteId,
            action: "site_deleted",
            status: "info",
            details: "Site marked for deletion via bulk action",
          });
        }

        // Delete sites (cascade will handle related records)
        await db.delete(sites).where(inArray(sites.id, siteIds));

        results.success = siteIds.length;
        break;

      case "addTag":
        const { tagId } = params;

        // CRITICAL FIX: Validate tagId is a positive integer
        if (!tagId || typeof tagId !== "number" || !Number.isInteger(tagId) || tagId <= 0) {
          return NextResponse.json(
            { error: "Valid tag ID (positive integer) is required" },
            { status: 400 }
          );
        }

        for (const siteId of siteIds) {
          try {
            // Check if tag already exists
            const existing = await db.query.siteTags.findFirst({
              where: and(
                eq(siteTags.siteId, siteId),
                eq(siteTags.tagId, tagId)
              ),
            });

            if (!existing) {
              await db.insert(siteTags).values({
                siteId,
                tagId,
              });
              results.success++;
            } else {
              results.failed++;
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Site ${siteId}: ${String(error)}`);
          }
        }
        break;

      case "removeTag":
        const { tagId: removeTagId } = params;

        // CRITICAL FIX: Validate removeTagId is a positive integer
        if (!removeTagId || typeof removeTagId !== "number" || !Number.isInteger(removeTagId) || removeTagId <= 0) {
          return NextResponse.json(
            { error: "Valid tag ID (positive integer) is required" },
            { status: 400 }
          );
        }

        // HIGH FIX: Use correct Drizzle syntax with and()
        for (const siteId of siteIds) {
          try {
            await db
              .delete(siteTags)
              .where(
                and(
                  eq(siteTags.siteId, siteId),
                  eq(siteTags.tagId, removeTagId)
                )
              );
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Site ${siteId}: ${String(error)}`);
          }
        }
        break;

      case "sync":
        // Trigger sync for all sites
        for (const siteId of siteIds) {
          try {
            // Trigger sync via internal API call
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sites/${siteId}/plugins`, {
              method: "GET",
            });
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Site ${siteId}: ${String(error)}`);
          }
        }

        await db.insert(activityLog).values({
          siteId: null,
          action: "bulk_update_completed",
          status: "success",
          details: `Synced ${results.success} sites`,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Bulk operation failed:", sanitizeError(error));
    return apiError("Bulk operation failed");
  }
}
