import { db } from "./db";
import {
  uptimeChecks,
  uptimeIncidents,
  sites,
} from "./db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notifySiteOffline } from "./notifications";

export interface UptimeCheckResult {
  siteId: number;
  status: "up" | "down" | "degraded";
  responseTime: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export async function checkSiteUptime(siteId: number, url: string): Promise<UptimeCheckResult> {
  const startTime = Date.now();
  let status: "up" | "down" | "degraded" = "down";
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    statusCode = response.status;
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      status = responseTime > 3000 ? "degraded" : "up";
    } else {
      status = "down";
      errorMessage = `HTTP ${statusCode}`;
    }

    return {
      siteId,
      status,
      responseTime,
      statusCode,
      errorMessage,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    errorMessage = error instanceof Error ? error.message : "Unknown error";

    return {
      siteId,
      status: "down",
      responseTime,
      statusCode: null,
      errorMessage,
    };
  }
}

export async function recordUptimeCheck(result: UptimeCheckResult) {
  // Record the check
  await db.insert(uptimeChecks).values({
    siteId: result.siteId,
    status: result.status,
    responseTime: result.responseTime,
    statusCode: result.statusCode,
    errorMessage: result.errorMessage,
    checkedAt: new Date().toISOString(),
  });

  // Check if we need to create or resolve an incident
  const site = await db.query.sites.findFirst({
    where: eq(sites.id, result.siteId),
  });

  if (!site) return;

  if (result.status === "down") {
    // Check if there's an ongoing incident
    const ongoingIncident = await db.query.uptimeIncidents.findFirst({
      where: and(
        eq(uptimeIncidents.siteId, result.siteId),
        eq(uptimeIncidents.status, "ongoing")
      ),
      orderBy: [desc(uptimeIncidents.startedAt)],
    });

    if (!ongoingIncident) {
      // Create new incident
      await db.insert(uptimeIncidents).values({
        siteId: result.siteId,
        startedAt: new Date().toISOString(),
        status: "ongoing",
        notificationSent: false,
      });

      // Send notification
      await notifySiteOffline(result.siteId, site.name);

      // Update notification sent flag
      await db
        .update(uptimeIncidents)
        .set({ notificationSent: true })
        .where(
          and(
            eq(uptimeIncidents.siteId, result.siteId),
            eq(uptimeIncidents.status, "ongoing")
          )
        );
    }
  } else if (result.status === "up") {
    // Check if there's an ongoing incident to resolve
    const ongoingIncident = await db.query.uptimeIncidents.findFirst({
      where: and(
        eq(uptimeIncidents.siteId, result.siteId),
        eq(uptimeIncidents.status, "ongoing")
      ),
      orderBy: [desc(uptimeIncidents.startedAt)],
    });

    if (ongoingIncident) {
      const resolvedAt = new Date().toISOString();
      const duration = Math.floor(
        (new Date(resolvedAt).getTime() - new Date(ongoingIncident.startedAt).getTime()) / 1000
      );

      await db
        .update(uptimeIncidents)
        .set({
          resolvedAt,
          duration,
          status: "resolved",
        })
        .where(eq(uptimeIncidents.id, ongoingIncident.id));
    }
  }

  // Update site status
  await db
    .update(sites)
    .set({
      status: result.status === "up" ? "online" : result.status === "down" ? "offline" : "unknown",
      lastChecked: new Date().toISOString(),
    })
    .where(eq(sites.id, result.siteId));
}

export async function checkAllSitesUptime() {
  const allSites = await db.query.sites.findMany({
    where: eq(sites.isArchived, false),
  });

  const results: UptimeCheckResult[] = [];

  for (const site of allSites) {
    const result = await checkSiteUptime(site.id, site.url);
    await recordUptimeCheck(result);
    results.push(result);
  }

  return results;
}

export async function getUptimeStats(siteId: number, hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const checks = await db.query.uptimeChecks.findMany({
    where: and(
      eq(uptimeChecks.siteId, siteId),
      // Note: SQLite doesn't have native date comparison, so we filter in memory
    ),
    orderBy: [desc(uptimeChecks.checkedAt)],
    limit: 1000,
  });

  const recentChecks = checks.filter((c) => c.checkedAt && c.checkedAt >= since);

  const totalChecks = recentChecks.length;
  const upChecks = recentChecks.filter((c) => c.status === "up").length;
  const downChecks = recentChecks.filter((c) => c.status === "down").length;
  const degradedChecks = recentChecks.filter((c) => c.status === "degraded").length;

  const uptime = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;

  const avgResponseTime =
    recentChecks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / totalChecks || 0;

  return {
    totalChecks,
    upChecks,
    downChecks,
    degradedChecks,
    uptimePercentage: uptime,
    avgResponseTime,
  };
}
