import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { updateSiteSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/sites/[id] - Get a single site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, parseInt(id)),
      with: {
        plugins: true,
        themes: true,
        users: true,
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Strip sensitive data
    const { apiPassword, ...safeSite } = site;
    return NextResponse.json(safeSite);
  } catch (error) {
    console.error("Failed to fetch site:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

// PUT /api/sites/[id] - Update a site
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input with Zod
    const result = updateSiteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      ...result.data,
      updatedAt: new Date().toISOString(),
    };

    // Encrypt password if being updated
    if (result.data.apiPassword) {
      updateData.apiPassword = encrypt(result.data.apiPassword);
    }

    const [updated] = await db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, parseInt(id)))
      .returning({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        status: sites.status,
        updatedAt: sites.updatedAt,
      });

    if (!updated) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update site:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/[id] - Delete a site
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(sites)
      .where(eq(sites.id, parseInt(id)))
      .returning({ id: sites.id });

    if (!deleted) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}
