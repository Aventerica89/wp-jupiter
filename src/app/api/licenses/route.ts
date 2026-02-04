import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pluginLicenses, licenseVendors } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

const createLicenseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  vendorId: z.number().int().positive().optional(),
  pluginSlug: z.string().optional(),
  themeSlug: z.string().optional(),
  licenseKey: z.string().min(1, "License key is required"),
  licenseEmail: z.string().email().optional(),
  licenseUrl: z.string().url().optional(),
  maxActivations: z.number().int().positive().optional(),
  purchaseDate: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/licenses - List all licenses
export async function GET(request: NextRequest) {
  try {
    const pluginSlug = request.nextUrl.searchParams.get("pluginSlug");
    const themeSlug = request.nextUrl.searchParams.get("themeSlug");
    const status = request.nextUrl.searchParams.get("status");

    let licenses = await db.query.pluginLicenses.findMany({
      with: {
        vendor: true,
        assignments: {
          with: {
            site: true,
          },
        },
      },
      orderBy: (licenses, { desc }) => [desc(licenses.createdAt)],
    });

    // Filter by plugin/theme slug if specified
    if (pluginSlug) {
      licenses = licenses.filter((l) => l.pluginSlug === pluginSlug);
    }
    if (themeSlug) {
      licenses = licenses.filter((l) => l.themeSlug === themeSlug);
    }
    if (status) {
      licenses = licenses.filter((l) => l.status === status);
    }

    // Strip sensitive data (license keys) and add useful info
    const safeLicenses = licenses.map((license) => ({
      id: license.id,
      name: license.name,
      vendorId: license.vendorId,
      vendorName: license.vendor?.name || null,
      pluginSlug: license.pluginSlug,
      themeSlug: license.themeSlug,
      licenseEmail: license.licenseEmail,
      licenseUrl: license.licenseUrl,
      maxActivations: license.maxActivations,
      currentActivations: license.currentActivations,
      availableActivations:
        license.maxActivations !== null
          ? license.maxActivations - (license.currentActivations ?? 0)
          : null, // null = unlimited
      purchaseDate: license.purchaseDate,
      expiresAt: license.expiresAt,
      status: license.status,
      lastValidatedAt: license.lastValidatedAt,
      notes: license.notes,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
      // Show which sites are using this license
      activeSites: license.assignments
        .filter((a) => a.status === "active")
        .map((a) => ({
          id: a.site.id,
          name: a.site.name,
          activatedAt: a.activatedAt,
        })),
    }));

    return NextResponse.json(safeLicenses);
  } catch (error) {
    console.error("Failed to fetch licenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 }
    );
  }
}

// POST /api/licenses - Create a new license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = createLicenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Must specify either pluginSlug or themeSlug
    if (!data.pluginSlug && !data.themeSlug) {
      return NextResponse.json(
        { error: "Either pluginSlug or themeSlug is required" },
        { status: 400 }
      );
    }

    // Verify vendor exists if specified
    if (data.vendorId) {
      const vendor = await db.query.licenseVendors.findFirst({
        where: (vendors, { eq }) => eq(vendors.id, data.vendorId!),
      });

      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor not found" },
          { status: 404 }
        );
      }
    }

    // Encrypt the license key
    const encryptedKey = encrypt(data.licenseKey);

    const [newLicense] = await db
      .insert(pluginLicenses)
      .values({
        name: data.name,
        vendorId: data.vendorId || null,
        pluginSlug: data.pluginSlug || null,
        themeSlug: data.themeSlug || null,
        licenseKey: encryptedKey,
        licenseEmail: data.licenseEmail || null,
        licenseUrl: data.licenseUrl || null,
        maxActivations: data.maxActivations || null,
        purchaseDate: data.purchaseDate || null,
        expiresAt: data.expiresAt || null,
        notes: data.notes || null,
        status: "active",
      })
      .returning({
        id: pluginLicenses.id,
        name: pluginLicenses.name,
        pluginSlug: pluginLicenses.pluginSlug,
        themeSlug: pluginLicenses.themeSlug,
        status: pluginLicenses.status,
        createdAt: pluginLicenses.createdAt,
      });

    return NextResponse.json(newLicense, { status: 201 });
  } catch (error) {
    console.error("Failed to create license:", error);
    return NextResponse.json(
      { error: "Failed to create license" },
      { status: 500 }
    );
  }
}
