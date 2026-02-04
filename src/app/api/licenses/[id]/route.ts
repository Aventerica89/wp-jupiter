import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pluginLicenses, siteLicenseAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/crypto";
import { licenseManager } from "@/lib/licenses";
import { z } from "zod";

const updateLicenseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  licenseKey: z.string().min(1).optional(),
  licenseEmail: z.string().email().optional().nullable(),
  licenseUrl: z.string().url().optional().nullable(),
  maxActivations: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  status: z.enum(["active", "expired", "suspended", "invalid"]).optional(),
  notes: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/licenses/[id] - Get a single license with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const licenseId = parseInt(id);
    const includKey = request.nextUrl.searchParams.get("includeKey") === "true";

    const license = await db.query.pluginLicenses.findFirst({
      where: eq(pluginLicenses.id, licenseId),
      with: {
        vendor: true,
        assignments: {
          with: {
            site: true,
            injectionLogs: {
              limit: 10,
              orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            },
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const response: Record<string, unknown> = {
      id: license.id,
      name: license.name,
      vendorId: license.vendorId,
      vendor: license.vendor,
      pluginSlug: license.pluginSlug,
      themeSlug: license.themeSlug,
      licenseEmail: license.licenseEmail,
      licenseUrl: license.licenseUrl,
      maxActivations: license.maxActivations,
      currentActivations: license.currentActivations,
      purchaseDate: license.purchaseDate,
      expiresAt: license.expiresAt,
      status: license.status,
      lastValidatedAt: license.lastValidatedAt,
      notes: license.notes,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
      assignments: license.assignments.map((a) => ({
        id: a.id,
        siteId: a.siteId,
        siteName: a.site.name,
        siteUrl: a.site.url,
        status: a.status,
        activatedAt: a.activatedAt,
        deactivatedAt: a.deactivatedAt,
        lastInjectedAt: a.lastInjectedAt,
        recentLogs: a.injectionLogs,
      })),
    };

    // Only include decrypted key if explicitly requested
    if (includKey) {
      response.licenseKey = decrypt(license.licenseKey);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch license:", error);
    return NextResponse.json(
      { error: "Failed to fetch license" },
      { status: 500 }
    );
  }
}

// PUT /api/licenses/[id] - Update a license
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const licenseId = parseInt(id);
    const body = await request.json();

    const result = updateLicenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db.query.pluginLicenses.findFirst({
      where: eq(pluginLicenses.id, licenseId),
    });

    if (!existing) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const updateData: Partial<typeof pluginLicenses.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (result.data.name) updateData.name = result.data.name;
    if (result.data.licenseKey) updateData.licenseKey = encrypt(result.data.licenseKey);
    if (result.data.licenseEmail !== undefined) updateData.licenseEmail = result.data.licenseEmail;
    if (result.data.licenseUrl !== undefined) updateData.licenseUrl = result.data.licenseUrl;
    if (result.data.maxActivations !== undefined) updateData.maxActivations = result.data.maxActivations;
    if (result.data.expiresAt !== undefined) updateData.expiresAt = result.data.expiresAt;
    if (result.data.status) updateData.status = result.data.status;
    if (result.data.notes !== undefined) updateData.notes = result.data.notes;

    const [updatedLicense] = await db
      .update(pluginLicenses)
      .set(updateData)
      .where(eq(pluginLicenses.id, licenseId))
      .returning({
        id: pluginLicenses.id,
        name: pluginLicenses.name,
        status: pluginLicenses.status,
        updatedAt: pluginLicenses.updatedAt,
      });

    return NextResponse.json(updatedLicense);
  } catch (error) {
    console.error("Failed to update license:", error);
    return NextResponse.json(
      { error: "Failed to update license" },
      { status: 500 }
    );
  }
}

// DELETE /api/licenses/[id] - Delete a license
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const licenseId = parseInt(id);

    const license = await db.query.pluginLicenses.findFirst({
      where: eq(pluginLicenses.id, licenseId),
      with: {
        assignments: true,
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Check if license is still in use
    const activeAssignments = license.assignments.filter(
      (a) => a.status === "active"
    );

    if (activeAssignments.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete license that is still assigned to sites",
          activeSites: activeAssignments.length,
        },
        { status: 400 }
      );
    }

    // Delete will cascade to assignments and logs
    await db.delete(pluginLicenses).where(eq(pluginLicenses.id, licenseId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete license:", error);
    return NextResponse.json(
      { error: "Failed to delete license" },
      { status: 500 }
    );
  }
}

// POST /api/licenses/[id] - Special actions (validate, refresh all sites)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const licenseId = parseInt(id);
    const body = await request.json();
    const action = body.action as string;

    if (action === "validate") {
      const result = await licenseManager.validateLicense(licenseId);
      return NextResponse.json(result);
    }

    if (action === "refresh") {
      // Re-inject license to all assigned sites
      const assignments = await db.query.siteLicenseAssignments.findMany({
        where: eq(siteLicenseAssignments.licenseId, licenseId),
      });

      const results = [];
      for (const assignment of assignments) {
        const result = await licenseManager.injectLicense(
          assignment.id,
          "sync"
        );
        results.push(result);
      }

      return NextResponse.json({
        success: true,
        results,
        totalSites: assignments.length,
        successCount: results.filter((r) => r.success).length,
      });
    }

    return NextResponse.json(
      { error: "Unknown action. Use 'validate' or 'refresh'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to perform license action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
