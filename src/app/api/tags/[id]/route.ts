import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseId, invalidIdResponse, sanitizeError, apiError } from "@/lib/api-utils";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
}

// PUT /api/tags/[id] - Update a tag
export async function PUT(request: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params;
    const tagId = parseId(id);

    if (!tagId) {
      return invalidIdResponse();
    }

    const body = await request.json();

    // Validate input
    const result = updateTagSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, color } = result.data;

    const [updated] = await db
      .update(tags)
      .set({
        ...(name && { name }),
        ...(color && { color }),
      })
      .where(eq(tags.id, tagId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update tag:", sanitizeError(error));
    return apiError("Failed to update tag");
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(request: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params;
    const tagId = parseId(id);

    if (!tagId) {
      return invalidIdResponse();
    }

    await db.delete(tags).where(eq(tags.id, tagId));

    return NextResponse.json({ success: true }
  } catch (error) {
    console.error("Failed to delete tag:", sanitizeError(error));
    return apiError("Failed to delete tag");
  }
}
