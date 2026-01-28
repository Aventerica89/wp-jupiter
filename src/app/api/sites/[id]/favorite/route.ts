import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/sites/[id]/favorite - Toggle favorite status
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

    // Toggle favorite
    const [updated] = await db
      .update(sites)
      .set({
        isFavorite: !site.isFavorite,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sites.id, parseInt(id)))
      .returning({
        id: sites.id,
        isFavorite: sites.isFavorite,
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
