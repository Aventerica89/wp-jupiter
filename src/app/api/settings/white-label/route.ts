import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { whiteLabelSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeError, apiError } from "@/lib/api-utils";
import { z } from "zod";

// CRITICAL FIX: Validate all white-label settings input
const whiteLabelSchema = z.object({
  organizationName: z.string().max(100).optional().nullable(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  faviconUrl: z.string().url().max(500).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  customDomain: z.string().max(255).optional().nullable(),
  supportEmail: z.string().email().max(255).optional().nullable(),
  supportUrl: z.string().url().max(500).optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
});

// GET /api/settings/white-label - Get white label settings
export async function GET() {
  try {
    // There should only be one white label settings record
    const settings = await db.query.whiteLabelSettings.findFirst();

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        id: null,
        organizationName: null,
        logoUrl: null,
        faviconUrl: null,
        primaryColor: "#6366f1",
        secondaryColor: "#8b5cf6",
        customDomain: null,
        supportEmail: null,
        supportUrl: null,
        footerText: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch white label settings:", sanitizeError(error));
    return apiError("Failed to fetch white label settings");
  }
}

// POST /api/settings/white-label - Update white label settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // CRITICAL FIX: Validate input instead of spreading arbitrary body
    const result = whiteLabelSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const validated = result.data;

    // Check if settings exist
    const existing = await db.query.whiteLabelSettings.findFirst();

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(whiteLabelSettings)
        .set({
          ...validated,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(whiteLabelSettings.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    } else {
      // Create new
      const [created] = await db
        .insert(whiteLabelSettings)
        .values(validated)
        .returning();

      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to update white label settings:", sanitizeError(error));
    return apiError("Failed to update white label settings");
  }
}
