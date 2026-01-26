import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    return NextResponse.json(site);
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

    const [updated] = await db
      .update(sites)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sites.id, parseInt(id)))
      .returning();

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
      .returning();

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
