import { db } from "./db";
import { securityScans, sites } from "./db/schema";
import { eq } from "drizzle-orm";
import { notifySecurityIssue } from "./notifications";

export interface SecurityIssue {
  type: "vulnerability" | "outdated_software" | "weak_config" | "malware";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
}

export interface SecurityScanResult {
  siteId: number;
  score: number; // 0-100
  issues: SecurityIssue[];
  recommendations: string[];
}

export async function scanSiteSecurity(siteId: number): Promise<SecurityScanResult> {
  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
    with: {
      plugins: true,
      themes: true,
    },
  });

  if (!site) {
    throw new Error(`Site ${siteId} not found`);
  }

  const issues: SecurityIssue[] = [];
  const recommendations: string[] = [];

  // Check SSL validity
  try {
    const url = new URL(site.url);
    if (url.protocol !== "https:") {
      issues.push({
        type: "weak_config",
        severity: "high",
        title: "HTTPS Not Enabled",
        description: "Site is not using HTTPS, making it vulnerable to man-in-the-middle attacks.",
        recommendation: "Enable SSL/TLS certificate and redirect all HTTP traffic to HTTPS.",
      });
    }

    // Check SSL expiry
    if (site.sslExpiry) {
      const expiryDate = new Date(site.sslExpiry);
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 0) {
        issues.push({
          type: "weak_config",
          severity: "critical",
          title: "SSL Certificate Expired",
          description: "SSL certificate has expired, users will see security warnings.",
          recommendation: "Renew SSL certificate immediately.",
        });
      } else if (daysUntilExpiry < 30) {
        issues.push({
          type: "weak_config",
          severity: "medium",
          title: "SSL Certificate Expiring Soon",
          description: `SSL certificate expires in ${daysUntilExpiry} days.`,
          recommendation: "Renew SSL certificate before expiration.",
        });
      }
    }
  } catch (error) {
    console.error("SSL check failed:", error);
  }

  // Check for outdated WordPress version
  if (site.wpVersion) {
    const currentMajor = parseInt(site.wpVersion.split(".")[0]);
    const latestMajor = 6; // Update this with actual latest version check

    if (currentMajor < latestMajor) {
      issues.push({
        type: "outdated_software",
        severity: "high",
        title: "Outdated WordPress Version",
        description: `WordPress ${site.wpVersion} is outdated. Latest is 6.x.`,
        recommendation: "Update WordPress to the latest version.",
      });
    }
  }

  // Check for plugins with available updates (potential security patches)
  const outdatedPlugins = site.plugins.filter((p) => p.updateAvailable);
  if (outdatedPlugins.length > 5) {
    issues.push({
      type: "vulnerability",
      severity: "medium",
      title: "Multiple Outdated Plugins",
      description: `${outdatedPlugins.length} plugins have available updates.`,
      recommendation: "Update all plugins to patch potential security vulnerabilities.",
    });
  }

  // Check PHP version
  if (site.phpVersion) {
    const phpMajor = parseFloat(site.phpVersion);
    if (phpMajor < 8.0) {
      issues.push({
        type: "outdated_software",
        severity: "high",
        title: "Outdated PHP Version",
        description: `PHP ${site.phpVersion} is no longer supported and has security vulnerabilities.`,
        recommendation: "Upgrade to PHP 8.0 or higher.",
      });
    } else if (phpMajor < 8.1) {
      issues.push({
        type: "outdated_software",
        severity: "medium",
        title: "PHP Version Approaching End of Life",
        description: `PHP ${site.phpVersion} will soon reach end of support.`,
        recommendation: "Plan upgrade to PHP 8.1 or higher.",
      });
    }
  }

  // Generate recommendations based on issues
  if (issues.length === 0) {
    recommendations.push("No security issues detected. Keep monitoring regularly.");
    recommendations.push("Enable automatic security updates for WordPress core.");
    recommendations.push("Implement regular backup schedule.");
  } else {
    recommendations.push("Address critical and high severity issues immediately.");
    recommendations.push("Schedule regular security audits.");
    recommendations.push("Enable automatic WordPress core security updates.");
    recommendations.push("Use strong passwords and enable two-factor authentication.");
  }

  // Calculate security score (100 - deductions for issues)
  let score = 100;
  issues.forEach((issue) => {
    switch (issue.severity) {
      case "critical":
        score -= 25;
        break;
      case "high":
        score -= 15;
        break;
      case "medium":
        score -= 8;
        break;
      case "low":
        score -= 3;
        break;
    }
  });
  score = Math.max(0, score);

  return {
    siteId,
    score,
    issues,
    recommendations,
  };
}

export async function runSecurityScan(siteId: number, scanType: "vulnerability" | "malware" | "ssl" | "firewall" = "vulnerability") {
  // Create scan record
  const [scan] = await db
    .insert(securityScans)
    .values({
      siteId,
      scanType,
      status: "running",
    })
    .returning();

  try {
    const result = await scanSiteSecurity(siteId);

    // Update scan with results
    await db
      .update(securityScans)
      .set({
        status: "completed",
        score: result.score,
        issues: JSON.stringify(result.issues),
        recommendations: JSON.stringify(result.recommendations),
        completedAt: new Date().toISOString(),
      })
      .where(eq(securityScans.id, scan.id));

    // Send notification if issues found
    if (result.issues.length > 0) {
      const site = await db.query.sites.findFirst({
        where: eq(sites.id, siteId),
      });

      if (site) {
        await notifySecurityIssue(siteId, site.name, result.issues.length);
      }
    }

    return result;
  } catch (error) {
    // Update scan as failed
    await db
      .update(securityScans)
      .set({
        status: "failed",
        completedAt: new Date().toISOString(),
      })
      .where(eq(securityScans.id, scan.id));

    throw error;
  }
}
