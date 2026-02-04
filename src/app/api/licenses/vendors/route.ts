import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licenseVendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(50),
  website: z.string().url().optional(),
  apiEndpoint: z.string().url().optional(),
  apiType: z.enum(["woocommerce", "edd", "freemius", "envato", "custom"]).optional(),
  notes: z.string().optional(),
});

// GET /api/licenses/vendors - List all license vendors
export async function GET() {
  try {
    const vendors = await db.query.licenseVendors.findMany({
      with: {
        licenses: true,
      },
      orderBy: (vendors, { asc }) => [asc(vendors.name)],
    });

    const vendorsWithCounts = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      website: v.website,
      apiEndpoint: v.apiEndpoint,
      apiType: v.apiType,
      notes: v.notes,
      createdAt: v.createdAt,
      licenseCount: v.licenses.length,
      activeLicenses: v.licenses.filter((l) => l.status === "active").length,
    }));

    return NextResponse.json(vendorsWithCounts);
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST /api/licenses/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = createVendorSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await db.query.licenseVendors.findFirst({
      where: eq(licenseVendors.slug, result.data.slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A vendor with this slug already exists" },
        { status: 409 }
      );
    }

    const [newVendor] = await db
      .insert(licenseVendors)
      .values({
        name: result.data.name,
        slug: result.data.slug,
        website: result.data.website || null,
        apiEndpoint: result.data.apiEndpoint || null,
        apiType: result.data.apiType || null,
        notes: result.data.notes || null,
      })
      .returning();

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error("Failed to create vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}

// DELETE /api/licenses/vendors?id=X - Delete a vendor
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get("id");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const vendor = await db.query.licenseVendors.findFirst({
      where: eq(licenseVendors.id, parseInt(vendorId)),
      with: {
        licenses: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.licenses.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete vendor with associated licenses",
          licenseCount: vendor.licenses.length,
        },
        { status: 400 }
      );
    }

    await db.delete(licenseVendors).where(eq(licenseVendors.id, parseInt(vendorId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
