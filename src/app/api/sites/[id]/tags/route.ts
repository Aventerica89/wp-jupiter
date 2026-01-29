import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteTags } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { parseId, invalidIdResponse, sanitizeError, apiError } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/sites/[id]/tags - Add tag to site
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseId(id);

    if (!siteId) {
      return invalidIdResponse();
    }

    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
    }

    // Check if tag already exists on site
    const existing = await db.query.siteTags.findFirst({
      where: and(eq(siteTags.siteId, siteId), eq(siteTags.tagId, tagId)),
    });

    if (existing) {
      return NextResponse.json({ error: "Tag already added to site" }, { status: 400 });
    }

    await db.insert(siteTags).values({
      siteId,
      tagId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add tag to site:", sanitizeError(error));
    return apiError("Failed to add tag to site");
  }
}

// DELETE /api/sites/[id]/tags - Remove tag from site
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseId(id);

    if (!siteId) {
      return invalidIdResponse();
    }

    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
    }

    await db
      .delete(siteTags)
      .where(and(eq(siteTags.siteId, siteId), eq(siteTags.tagId, tagId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove tag from site:", sanitizeError(error));
    return apiError("Failed to remove tag from site");
  }
}
