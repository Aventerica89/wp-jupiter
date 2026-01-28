/**
 * Site utility functions
 * Built with TDD methodology
 */

export interface Site {
  id: number;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'unknown';
  pluginUpdates: number;
  themeUpdates: number;
}

export interface UpdateCounts {
  totalUpdates: number;
  pluginUpdates: number;
  themeUpdates: number;
  sitesWithUpdates: number;
  sitesOnline: number;
  sitesOffline: number;
}

/**
 * Format a date as relative time (e.g., "2m ago", "3h ago")
 */
export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (date === null || date === undefined) {
    return 'Never';
  }

  const parsed = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(parsed.getTime())) {
    return 'Never';
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return parsed.toLocaleDateString();
}

/**
 * Calculate aggregate update counts across all sites
 */
export function calculateUpdateCounts(sites: Site[]): UpdateCounts {
  const result: UpdateCounts = {
    totalUpdates: 0,
    pluginUpdates: 0,
    themeUpdates: 0,
    sitesWithUpdates: 0,
    sitesOnline: 0,
    sitesOffline: 0,
  };

  for (const site of sites) {
    result.pluginUpdates += site.pluginUpdates;
    result.themeUpdates += site.themeUpdates;
    result.totalUpdates += site.pluginUpdates + site.themeUpdates;

    if (site.pluginUpdates > 0 || site.themeUpdates > 0) {
      result.sitesWithUpdates++;
    }

    if (site.status === 'online') {
      result.sitesOnline++;
    } else if (site.status === 'offline') {
      result.sitesOffline++;
    }
  }

  return result;
}
