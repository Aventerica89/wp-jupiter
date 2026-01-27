import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

type ActionType =
  | "site_added"
  | "site_updated"
  | "site_deleted"
  | "site_sync"
  | "health_check"
  | "plugin_updated"
  | "theme_updated"
  | "bulk_update_started"
  | "bulk_update_completed"
  | "error";

type StatusType = "success" | "failed" | "info";

interface LogOptions {
  siteId?: number;
  action: ActionType;
  status?: StatusType;
  details?: string;
}

/**
 * Log an activity to the database
 */
export async function logActivity({
  siteId,
  action,
  status = "info",
  details,
}: LogOptions): Promise<void> {
  try {
    await db.insert(activityLog).values({
      siteId: siteId ?? null,
      action,
      status,
      details,
    });
  } catch (error) {
    // Don't let logging failures break the main operation
    console.error("Failed to log activity:", error);
  }
}

/**
 * Helper functions for common log types
 */
export const logger = {
  siteAdded: (siteId: number, siteName: string) =>
    logActivity({
      siteId,
      action: "site_added",
      status: "success",
      details: `Added site: ${siteName}`,
    }),

  siteUpdated: (siteId: number, siteName: string) =>
    logActivity({
      siteId,
      action: "site_updated",
      status: "success",
      details: `Updated site: ${siteName}`,
    }),

  siteDeleted: (siteName: string) =>
    logActivity({
      action: "site_deleted",
      status: "success",
      details: `Deleted site: ${siteName}`,
    }),

  siteSync: (siteId: number, siteName: string, pluginCount: number, themeCount: number) =>
    logActivity({
      siteId,
      action: "site_sync",
      status: "success",
      details: `Synced ${siteName}: ${pluginCount} plugins, ${themeCount} themes`,
    }),

  healthCheck: (siteId: number, siteName: string, status: "online" | "offline") =>
    logActivity({
      siteId,
      action: "health_check",
      status: status === "online" ? "success" : "failed",
      details: `${siteName} is ${status}`,
    }),

  pluginUpdated: (siteId: number, pluginName: string, fromVersion: string, toVersion: string) =>
    logActivity({
      siteId,
      action: "plugin_updated",
      status: "success",
      details: `Updated ${pluginName}: ${fromVersion} → ${toVersion}`,
    }),

  themeUpdated: (siteId: number, themeName: string, fromVersion: string, toVersion: string) =>
    logActivity({
      siteId,
      action: "theme_updated",
      status: "success",
      details: `Updated ${themeName}: ${fromVersion} → ${toVersion}`,
    }),

  bulkUpdateStarted: (count: number) =>
    logActivity({
      action: "bulk_update_started",
      status: "info",
      details: `Started bulk update of ${count} items`,
    }),

  bulkUpdateCompleted: (successful: number, failed: number) =>
    logActivity({
      action: "bulk_update_completed",
      status: failed > 0 ? "failed" : "success",
      details: `Bulk update complete: ${successful} successful, ${failed} failed`,
    }),

  error: (siteId: number | undefined, message: string) =>
    logActivity({
      siteId,
      action: "error",
      status: "failed",
      details: message,
    }),
};
