import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  siteLicenseAssignments,
  pluginLicenses,
  sites,
  activityLog,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { licenseManager } from "@/lib/licenses";
import { z } from "zod";

const assignLicenseSchema = z.object({
  licenseId: z.number().int().positive(),
  autoInject: z.boolean().default(true),
});

const cloneLicensesSchema = z.object({
  sourceSiteId: z.number().int().positive(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sites/[id]/licenses - Get all licenses for a site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);

    const licenses = await licenseManager.getSiteLicenses(siteId);

    // Strip the actual license keys from the response
    const safeLicenses = licenses.map((l) => ({
      id: l.id,
      name: l.name,
      pluginSlug: l.pluginSlug,
      themeSlug: l.themeSlug,
      licenseEmail: l.licenseEmail,
      maxActivations: l.maxActivations,
      currentActivations: l.currentActivations,
      status: l.status,
      expiresAt: l.expiresAt,
      assignmentId: l.assignmentId,
      assignmentStatus: l.assignmentStatus,
      activatedAt: l.activatedAt,
    }));

    return NextResponse.json(safeLicenses);
  } catch (error) {
    console.error("Failed to fetch site licenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 }
    );
  }
}

// POST /api/sites/[id]/licenses - Assign a license to a site
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);
    const body = await request.json();

    // Check if this is a clone operation
    if (body.action === "clone") {
      const cloneResult = cloneLicensesSchema.safeParse(body);
      if (!cloneResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: cloneResult.error.flatten() },
          { status: 400 }
        );
      }

      const results = await licenseManager.cloneLicenses(
        cloneResult.data.sourceSiteId,
        siteId
      );

      // Log activity
      await db.insert(activityLog).values({
        siteId,
        action: "license_injected",
        status: results.every((r) => r.success) ? "success" : "failed",
        details: `Cloned ${results.length} license(s) from site ${cloneResult.data.sourceSiteId}`,
      });

      return NextResponse.json({
        success: true,
        results,
        totalLicenses: results.length,
        successCount: results.filter((r) => r.success).length,
      });
    }

    // Regular license assignment
    const result = assignLicenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify site exists
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, siteId),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Verify license exists and has capacity
    const license = await db.query.pluginLicenses.findFirst({
      where: eq(pluginLicenses.id, result.data.licenseId),
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    if (license.status !== "active") {
      return NextResponse.json(
        { error: "License is not active" },
        { status: 400 }
      );
    }

    const hasCapacity =
      license.maxActivations === null ||
      (license.currentActivations ?? 0) < license.maxActivations;

    if (!hasCapacity) {
      return NextResponse.json(
        {
          error: "License has reached maximum activations",
          maxActivations: license.maxActivations,
          currentActivations: license.currentActivations,
        },
        { status: 400 }
      );
    }

    // Assign the license
    const { assignmentId } = await licenseManager.assignLicense(
      siteId,
      result.data.licenseId
    );

    // Auto-inject if requested
    let injectionResult = null;
    if (result.data.autoInject) {
      injectionResult = await licenseManager.injectLicense(
        assignmentId,
        "manual"
      );

      // Log activity
      await db.insert(activityLog).values({
        siteId,
        action: "license_activated",
        status: injectionResult.success ? "success" : "failed",
        details: `Assigned and injected license "${license.name}"`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        assignmentId,
        injectionResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to assign license:", error);
    return NextResponse.json(
      { error: "Failed to assign license" },
      { status: 500 }
    );
  }
}

// PUT /api/sites/[id]/licenses - Re-inject all licenses (refresh)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);

    const results = await licenseManager.injectAllLicenses(siteId, "sync");

    // Log activity
    await db.insert(activityLog).values({
      siteId,
      action: "license_injected",
      status: results.every((r) => r.success) ? "success" : "failed",
      details: `Refreshed ${results.length} license(s)`,
    });

    return NextResponse.json({
      success: true,
      results,
      totalLicenses: results.length,
      successCount: results.filter((r) => r.success).length,
    });
  } catch (error) {
    console.error("Failed to refresh licenses:", error);
    return NextResponse.json(
      { error: "Failed to refresh licenses" },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/[id]/licenses - Remove a license from a site
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);
    const assignmentId = request.nextUrl.searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId is required" },
        { status: 400 }
      );
    }

    // Verify the assignment belongs to this site
    const assignment = await db.query.siteLicenseAssignments.findFirst({
      where: and(
        eq(siteLicenseAssignments.id, parseInt(assignmentId)),
        eq(siteLicenseAssignments.siteId, siteId)
      ),
      with: {
        license: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "License assignment not found" },
        { status: 404 }
      );
    }

    // Deactivate the license
    await licenseManager.deactivateLicense(parseInt(assignmentId));

    // Log activity
    await db.insert(activityLog).values({
      siteId,
      action: "license_deactivated",
      status: "success",
      details: `Removed license "${assignment.license.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove license:", error);
    return NextResponse.json(
      { error: "Failed to remove license" },
      { status: 500 }
    );
  }
}
