import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notificationSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeError, apiError } from "@/lib/api-utils";

// GET /api/notifications - List all notification settings
export async function GET() => {
  try {
    const settings = await db.query.notificationSettings.findMany({
      orderBy: (settings, { desc }) => [desc(settings.createdAt)],
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch notification settings:", sanitizeError(error));
    return apiError("Failed to fetch notification settings");
  }
}

// POST /api/notifications - Create notification setting
export async function POST(request: NextRequest) => {
  try {
    const body = await request.json();
    const { type, enabled, config, events } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Notification type is required" },
        { status: 400 }
      );
    }

    const [setting] = await db
      .insert(notificationSettings)
      .values({
        type,
        enabled: enabled ?? true,
        config: config ? JSON.stringify(config) : null,
        events: events ? JSON.stringify(events) : null,
      })
      .returning();

    return NextResponse.json(setting, { status: 201 }
  } catch (error) {
    console.error("Failed to create notification setting:", sanitizeError(error));
    return apiError("Failed to create notification setting");
  }
}
