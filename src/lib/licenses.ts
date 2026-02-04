/**
 * License Manager Library for WP Jupiter
 * Handles plugin license storage, validation, and auto-injection
 */

import { db } from "./db";
import {
  pluginLicenses,
  siteLicenseAssignments,
  licenseInjectionLog,
  sites,
  plugins,
} from "./db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt, encrypt } from "./crypto";
import { createWordPressClient } from "./wordpress";

export interface LicenseInfo {
  id: number;
  name: string;
  pluginSlug: string | null;
  themeSlug: string | null;
  licenseKey: string; // Decrypted
  licenseEmail: string | null;
  maxActivations: number | null;
  currentActivations: number;
  status: "active" | "expired" | "suspended" | "invalid";
  expiresAt: string | null;
}

export interface LicenseValidationResult {
  valid: boolean;
  status: "active" | "expired" | "suspended" | "invalid";
  activationsRemaining?: number;
  expiresAt?: string;
  message?: string;
}

export interface InjectionResult {
  success: boolean;
  siteId: number;
  licenseId: number;
  message: string;
  activationResponse?: unknown;
}

/**
 * License Manager class for handling all license operations
 */
export class LicenseManager {
  /**
   * Get all licenses for a specific plugin slug
   */
  async getLicensesForPlugin(pluginSlug: string): Promise<LicenseInfo[]> {
    const licenses = await db.query.pluginLicenses.findMany({
      where: eq(pluginLicenses.pluginSlug, pluginSlug),
      with: {
        vendor: true,
      },
    });

    return licenses.map((l) => ({
      id: l.id,
      name: l.name,
      pluginSlug: l.pluginSlug,
      themeSlug: l.themeSlug,
      licenseKey: decrypt(l.licenseKey),
      licenseEmail: l.licenseEmail,
      maxActivations: l.maxActivations,
      currentActivations: l.currentActivations ?? 0,
      status: l.status as LicenseInfo["status"],
      expiresAt: l.expiresAt,
    }));
  }

  /**
   * Get all licenses assigned to a site
   */
  async getSiteLicenses(siteId: number): Promise<
    Array<
      LicenseInfo & {
        assignmentId: number;
        assignmentStatus: string;
        activatedAt: string | null;
      }
    >
  > {
    const assignments = await db.query.siteLicenseAssignments.findMany({
      where: eq(siteLicenseAssignments.siteId, siteId),
      with: {
        license: {
          with: {
            vendor: true,
          },
        },
      },
    });

    return assignments.map((a) => ({
      id: a.license.id,
      name: a.license.name,
      pluginSlug: a.license.pluginSlug,
      themeSlug: a.license.themeSlug,
      licenseKey: decrypt(a.license.licenseKey),
      licenseEmail: a.license.licenseEmail,
      maxActivations: a.license.maxActivations,
      currentActivations: a.license.currentActivations ?? 0,
      status: a.license.status as LicenseInfo["status"],
      expiresAt: a.license.expiresAt,
      assignmentId: a.id,
      assignmentStatus: a.status ?? "active",
      activatedAt: a.activatedAt,
    }));
  }

  /**
   * Find an available license for a plugin
   * Returns a license that has activations remaining
   */
  async findAvailableLicense(
    pluginSlug: string
  ): Promise<LicenseInfo | null> {
    const licenses = await this.getLicensesForPlugin(pluginSlug);

    // Find an active license with available activations
    const available = licenses.find((l) => {
      if (l.status !== "active") return false;
      if (l.maxActivations === null) return true; // Unlimited
      return l.currentActivations < l.maxActivations;
    });

    return available || null;
  }

  /**
   * Assign a license to a site
   */
  async assignLicense(
    siteId: number,
    licenseId: number
  ): Promise<{ assignmentId: number }> {
    // Check if already assigned
    const existing = await db.query.siteLicenseAssignments.findFirst({
      where: and(
        eq(siteLicenseAssignments.siteId, siteId),
        eq(siteLicenseAssignments.licenseId, licenseId)
      ),
    });

    if (existing) {
      return { assignmentId: existing.id };
    }

    // Create assignment
    const [assignment] = await db
      .insert(siteLicenseAssignments)
      .values({
        siteId,
        licenseId,
        status: "inactive", // Will be 'active' after injection
      })
      .returning({ id: siteLicenseAssignments.id });

    // Increment activation count
    const license = await db.query.pluginLicenses.findFirst({
      where: eq(pluginLicenses.id, licenseId),
    });

    if (license) {
      await db
        .update(pluginLicenses)
        .set({
          currentActivations: (license.currentActivations ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(pluginLicenses.id, licenseId));
    }

    return { assignmentId: assignment.id };
  }

  /**
   * Inject a license into a WordPress site
   * This calls the WP Jupiter connector plugin endpoint
   */
  async injectLicense(
    assignmentId: number,
    triggeredBy: "manual" | "clone" | "restore" | "sync" | "scheduled" = "manual"
  ): Promise<InjectionResult> {
    const assignment = await db.query.siteLicenseAssignments.findFirst({
      where: eq(siteLicenseAssignments.id, assignmentId),
      with: {
        site: true,
        license: {
          with: {
            vendor: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new Error("License assignment not found");
    }

    const { site, license } = assignment;
    const decryptedKey = decrypt(license.licenseKey);

    try {
      // Create WordPress client for the site
      const wpClient = await createWordPressClient(site.id);

      // Call the license injection endpoint on the site
      // This requires the WP Jupiter connector plugin to be installed
      const response = await wpClient.injectLicense({
        pluginSlug: license.pluginSlug || undefined,
        themeSlug: license.themeSlug || undefined,
        licenseKey: decryptedKey,
        licenseEmail: license.licenseEmail || undefined,
        vendorType: license.vendor?.apiType || undefined,
      });

      // Log success
      await db.insert(licenseInjectionLog).values({
        assignmentId,
        action: "inject",
        status: "success",
        details: JSON.stringify(response),
        triggeredBy,
      });

      // Update assignment status
      await db
        .update(siteLicenseAssignments)
        .set({
          status: "active",
          lastInjectedAt: new Date().toISOString(),
          activationResponse: JSON.stringify(response),
        })
        .where(eq(siteLicenseAssignments.id, assignmentId));

      return {
        success: true,
        siteId: site.id,
        licenseId: license.id,
        message: "License injected successfully",
        activationResponse: response,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Log failure
      await db.insert(licenseInjectionLog).values({
        assignmentId,
        action: "inject",
        status: "failed",
        details: JSON.stringify({ error: errorMessage }),
        triggeredBy,
      });

      // Update assignment status
      await db
        .update(siteLicenseAssignments)
        .set({ status: "failed" })
        .where(eq(siteLicenseAssignments.id, assignmentId));

      return {
        success: false,
        siteId: site.id,
        licenseId: license.id,
        message: `Failed to inject license: ${errorMessage}`,
      };
    }
  }

  /**
   * Inject all assigned licenses to a site
   * Used after site cloning or restoration
   */
  async injectAllLicenses(
    siteId: number,
    triggeredBy: "clone" | "restore" | "sync" | "scheduled"
  ): Promise<InjectionResult[]> {
    const assignments = await db.query.siteLicenseAssignments.findMany({
      where: eq(siteLicenseAssignments.siteId, siteId),
    });

    const results: InjectionResult[] = [];

    for (const assignment of assignments) {
      const result = await this.injectLicense(assignment.id, triggeredBy);
      results.push(result);
    }

    return results;
  }

  /**
   * Auto-assign and inject licenses for a cloned site
   * Copies license assignments from source site
   */
  async cloneLicenses(
    sourceSiteId: number,
    targetSiteId: number
  ): Promise<InjectionResult[]> {
    // Get all license assignments from source site
    const sourceAssignments = await db.query.siteLicenseAssignments.findMany({
      where: eq(siteLicenseAssignments.siteId, sourceSiteId),
    });

    const results: InjectionResult[] = [];

    for (const sourceAssignment of sourceAssignments) {
      // Check if license has available activations
      const license = await db.query.pluginLicenses.findFirst({
        where: eq(pluginLicenses.id, sourceAssignment.licenseId),
      });

      if (!license) continue;

      const hasCapacity =
        license.maxActivations === null ||
        (license.currentActivations ?? 0) < license.maxActivations;

      if (!hasCapacity) {
        results.push({
          success: false,
          siteId: targetSiteId,
          licenseId: license.id,
          message: `License "${license.name}" has no available activations`,
        });
        continue;
      }

      // Assign the license to the target site
      const { assignmentId } = await this.assignLicense(
        targetSiteId,
        sourceAssignment.licenseId
      );

      // Inject the license
      const result = await this.injectLicense(assignmentId, "clone");
      results.push(result);
    }

    return results;
  }

  /**
   * Deactivate a license on a site
   */
  async deactivateLicense(assignmentId: number): Promise<void> {
    const assignment = await db.query.siteLicenseAssignments.findFirst({
      where: eq(siteLicenseAssignments.id, assignmentId),
    });

    if (!assignment) {
      throw new Error("License assignment not found");
    }

    // Update assignment
    await db
      .update(siteLicenseAssignments)
      .set({
        status: "inactive",
        deactivatedAt: new Date().toISOString(),
      })
      .where(eq(siteLicenseAssignments.id, assignmentId));

    // Decrement activation count
    const license = await db.query.pluginLicenses.findFirst({
      where: eq(pluginLicenses.id, assignment.licenseId),
    });

    if (license && (license.currentActivations ?? 0) > 0) {
      await db
        .update(pluginLicenses)
        .set({
          currentActivations: (license.currentActivations ?? 0) - 1,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(pluginLicenses.id, assignment.licenseId));
    }

    // Log the deactivation
    await db.insert(licenseInjectionLog).values({
      assignmentId,
      action: "deactivate",
      status: "success",
      triggeredBy: "manual",
    });
  }

  /**
   * Validate a license with the vendor API
   */
  async validateLicense(licenseId: number): Promise<LicenseValidationResult> {
    const license = await db.query.pluginLicenses.findFirst({
      where: eq(pluginLicenses.id, licenseId),
      with: {
        vendor: true,
      },
    });

    if (!license) {
      return {
        valid: false,
        status: "invalid",
        message: "License not found",
      };
    }

    // For now, just check expiry
    // TODO: Implement vendor-specific API validation
    if (license.expiresAt) {
      const expiryDate = new Date(license.expiresAt);
      if (expiryDate < new Date()) {
        await db
          .update(pluginLicenses)
          .set({
            status: "expired",
            lastValidatedAt: new Date().toISOString(),
          })
          .where(eq(pluginLicenses.id, licenseId));

        return {
          valid: false,
          status: "expired",
          expiresAt: license.expiresAt,
          message: "License has expired",
        };
      }
    }

    // Update last validated
    await db
      .update(pluginLicenses)
      .set({
        lastValidatedAt: new Date().toISOString(),
      })
      .where(eq(pluginLicenses.id, licenseId));

    const activationsRemaining =
      license.maxActivations !== null
        ? license.maxActivations - (license.currentActivations ?? 0)
        : undefined;

    return {
      valid: true,
      status: "active",
      activationsRemaining,
      expiresAt: license.expiresAt ?? undefined,
    };
  }
}

/**
 * Encrypt a license key for storage
 */
export function encryptLicenseKey(key: string): string {
  return encrypt(key);
}

/**
 * Singleton license manager instance
 */
export const licenseManager = new LicenseManager();
