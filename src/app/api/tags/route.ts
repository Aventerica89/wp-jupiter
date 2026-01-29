import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { sanitizeError, apiError } from "@/lib/api-utils";
import { withAuth } from "@/lib/auth-middleware";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
});

// GET /api/tags - List all tags
export const GET = withAuth(async () => {
  try {
    const allTags = await db.query.tags.findMany({
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });

    return NextResponse.json(allTags);
  } catch (error) {
    console.error("Failed to fetch tags:", sanitizeError(error));
    return apiError("Failed to fetch tags");
  }
});

// POST /api/tags - Create a new tag
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate input
    const result = tagSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, color } = result.data;

    const [tag] = await db
      .insert(tags)
      .values({
        name,
        color: color || "#3b82f6",
      })
      .returning();

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", sanitizeError(error));
    return apiError("Failed to create tag");
  }
});

// DELETE /api/tags - Bulk delete tags
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Tag IDs are required" }, { status: 400 });
    }

    // Use bulk delete instead of loop
    await db.delete(tags).where(inArray(tags.id, ids));

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("Failed to delete tags:", sanitizeError(error));
    return apiError("Failed to delete tags");
  }
});
