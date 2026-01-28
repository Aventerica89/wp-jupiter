import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/sites/[id]/archive - Toggle archive status
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get current status
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, parseInt(id)),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Toggle archive
    const [updated] = await db
      .update(sites)
      .set({
        isArchived: !site.isArchived,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sites.id, parseInt(id)))
      .returning({
        id: sites.id,
        isArchived: sites.isArchived,
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to toggle archive:", error);
    return NextResponse.json(
      { error: "Failed to toggle archive" },
      { status: 500 }
    );
  }
}
