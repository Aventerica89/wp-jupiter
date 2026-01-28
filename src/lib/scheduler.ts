/**
 * Scheduling and notification utilities
 * Built with TDD methodology
 */

export interface SiteForSync {
  id: number;
  name: string;
  lastSynced: Date | null;
}

export interface SiteForNotification {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'unknown';
  pluginUpdates: number;
  themeUpdates: number;
  sslExpiry: Date | null;
}

export type NotificationType = 'offline' | 'updates_available' | 'ssl_expiring';
export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface Notification {
  type: NotificationType;
  severity: NotificationSeverity;
  siteId: number;
  siteName: string;
  message: string;
  createdAt: Date;
}

/**
 * Get sites that need syncing based on the configured interval
 * @param sites - List of sites with their last sync time
 * @param intervalMinutes - Sync interval in minutes
 * @returns Sites that need to be synced
 */
export function getSitesNeedingSync(
  sites: SiteForSync[],
  intervalMinutes: number
): SiteForSync[] {
  if (sites.length === 0) {
    return [];
  }

  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;

  return sites.filter((site) => {
    if (site.lastSynced === null) {
      return true; // Never synced
    }

    const timeSinceSync = now - site.lastSynced.getTime();
    return timeSinceSync >= intervalMs;
  });
}

/**
 * Generate notifications for sites with issues
 * @param sites - List of sites to check
 * @returns Array of notifications
 */
export function generateNotifications(
  sites: SiteForNotification[]
): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  for (const site of sites) {
    // Check for offline status
    if (site.status === 'offline') {
      notifications.push({
        type: 'offline',
        severity: 'critical',
        siteId: site.id,
        siteName: site.name,
        message: `${site.name} is offline and not responding`,
        createdAt: now,
      });
    }

    // Check for many updates (threshold: 5+ total updates)
    const totalUpdates = site.pluginUpdates + site.themeUpdates;
    if (totalUpdates >= 5) {
      notifications.push({
        type: 'updates_available',
        severity: 'warning',
        siteId: site.id,
        siteName: site.name,
        message: `${site.name} has ${totalUpdates} updates available`,
        createdAt: now,
      });
    }

    // Check for expiring SSL (within 7 days)
    if (site.sslExpiry) {
      const daysUntilExpiry = Math.floor(
        (site.sslExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
        notifications.push({
          type: 'ssl_expiring',
          severity: 'warning',
          siteId: site.id,
          siteName: site.name,
          message: `${site.name} SSL certificate expires in ${daysUntilExpiry} days`,
          createdAt: now,
        });
      }
    }
  }

  return notifications;
}
