/**
 * Business logic functions for site health and update prioritization
 * Built with TDD methodology
 */

export interface SiteHealth {
  status: 'online' | 'offline' | 'unknown';
  sslValid: boolean;
  sslExpiry: Date | null;
  lastChecked: Date | null;
  pluginUpdates: number;
  themeUpdates: number;
  wpVersion?: string;
  phpVersion?: string;
}

export interface PendingUpdate {
  id: string;
  name: string;
  type: 'plugin' | 'theme';
  isSecurityUpdate: boolean;
  isActive: boolean;
}

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface PrioritizedUpdate extends PendingUpdate {
  priority: Priority;
  score: number;
}

/**
 * Calculate a health score (0-100) for a site based on various factors
 */
export function calculateHealthScore(site: SiteHealth): number {
  // Offline sites always score 0
  if (site.status === 'offline') {
    return 0;
  }

  let score = 100;

  // Status penalty
  if (site.status === 'unknown') {
    score -= 20;
  }

  // SSL penalty
  if (!site.sslValid) {
    score -= 25;
  } else if (site.sslExpiry) {
    const daysUntilExpiry = Math.floor(
      (site.sslExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry < 7) {
      score -= 20;
    } else if (daysUntilExpiry < 30) {
      score -= 10;
    }
  }

  // Update penalty (2 points per update, max 30)
  const totalUpdates = site.pluginUpdates + site.themeUpdates;
  const updatePenalty = Math.min(totalUpdates * 2, 30);
  score -= updatePenalty;

  // Last checked penalty
  if (site.lastChecked) {
    const hoursSinceCheck = Math.floor(
      (Date.now() - site.lastChecked.getTime()) / (1000 * 60 * 60)
    );
    if (hoursSinceCheck > 168) {
      // More than 7 days
      score -= 15;
    } else if (hoursSinceCheck > 24) {
      // More than 1 day
      score -= 5;
    }
  } else {
    score -= 10; // Never checked
  }

  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score));
}

/**
 * Prioritize updates based on security, active status, and type
 */
export function prioritizeUpdates(updates: PendingUpdate[]): PrioritizedUpdate[] {
  if (updates.length === 0) {
    return [];
  }

  const prioritized: PrioritizedUpdate[] = updates.map((update) => {
    let priority: Priority;
    let score: number;

    if (update.isSecurityUpdate) {
      priority = 'critical';
      score = 100;
    } else if (update.type === 'plugin' && update.isActive) {
      priority = 'high';
      score = 75;
    } else if (update.type === 'theme' && update.isActive) {
      priority = 'medium';
      score = 50;
    } else {
      priority = 'low';
      score = 25;
    }

    return {
      ...update,
      priority,
      score,
    };
  });

  // Sort by score descending
  return prioritized.sort((a, b) => b.score - a.score);
}
