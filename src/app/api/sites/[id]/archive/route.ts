import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseId, invalidIdResponse, sanitizeError, apiError } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/sites/[id]/archive - Toggle archive status
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseId(id);

    if (!siteId) {
      return invalidIdResponse();
    }

    // Get current status
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, siteId),
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
      .where(eq(sites.id, siteId))
      .returning({
        id: sites.id,
        isArchived: sites.isArchived,
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to toggle archive:", sanitizeError(error));
    return apiError("Failed to toggle archive");
  }
}
