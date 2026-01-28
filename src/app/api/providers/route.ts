import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { PROVIDERS } from "@/lib/providers";
import { eq } from "drizzle-orm";

// GET /api/providers - List all providers (with seed if empty)
export async function GET() {
  try {
    let allProviders = await db.select().from(providers);

    // Seed providers if table is empty
    if (allProviders.length === 0) {
      for (const provider of PROVIDERS) {
        await db.insert(providers).values({
          slug: provider.slug,
          name: provider.name,
          logoUrl: provider.logoUrl,
          dashboardUrl: provider.dashboardUrl,
          serverUrlPattern: provider.serverUrlPattern,
          docsUrl: provider.docsUrl,
          supportUrl: provider.supportUrl,
          communityUrl: provider.communityUrl,
        });
      }
      allProviders = await db.select().from(providers);
    }

    return NextResponse.json(allProviders);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

// POST /api/providers - Create a custom provider
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await db.insert(providers).values({
      slug: body.slug,
      name: body.name,
      logoUrl: body.logoUrl,
      dashboardUrl: body.dashboardUrl,
      serverUrlPattern: body.serverUrlPattern,
      docsUrl: body.docsUrl,
      supportUrl: body.supportUrl,
      communityUrl: body.communityUrl,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
