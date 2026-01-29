import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notificationSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeError, apiError } from "@/lib/api-utils";
import { z } from "zod";

// HIGH FIX: Add comprehensive Zod validation
const notificationSchema = z.object({
  type: z.enum(["email", "slack", "discord", "webhook"]),
  enabled: z.boolean().optional().default(true),
  config: z.record(z.unknown()).optional(),
  events: z.array(z.string()).optional(),
});

// GET /api/notifications - List all notification settings
export async function GET() {
  try {
    const settings = await db.query.notificationSettings.findMany({
      orderBy: (settings, { desc }) => [desc(settings.createdAt)],
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch notification settings:", sanitizeError(error));
    return apiError("Failed to fetch notification settings");
  }
}

// POST /api/notifications - Create notification setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // HIGH FIX: Validate input with Zod schema
    const result = notificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    const { type, enabled, config, events } = result.data;

    const [setting] = await db
      .insert(notificationSettings)
      .values({
        type,
        enabled: enabled ?? true,
        config: config ? JSON.stringify(config) : null,
        events: events ? JSON.stringify(events) : null,
      })
      .returning();

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification setting:", sanitizeError(error));
    return apiError("Failed to create notification setting");
  }
}
