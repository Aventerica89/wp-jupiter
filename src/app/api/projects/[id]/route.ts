import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

// GET /api/projects/[id] - Get project with its sites
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, parseInt(id)),
      with: {
        sites: {
          with: {
            plugins: true,
            themes: true,
            server: {
              with: {
                provider: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Strip sensitive data from sites
    const safeSites = project.sites.map((site) => ({
      id: site.id,
      name: site.name,
      url: site.url,
      status: site.status,
      wpVersion: site.wpVersion,
      isFavorite: site.isFavorite,
      isArchived: site.isArchived,
      lastChecked: site.lastChecked,
      pluginUpdates: site.plugins.filter((p) => p.updateAvailable).length,
      themeUpdates: site.themes.filter((t) => t.updateAvailable).length,
      serverName: site.server?.name || null,
      providerName: site.server?.provider?.name || null,
      providerLogo: site.server?.provider?.logoUrl || null,
    }));

    return NextResponse.json({
      ...project,
      sites: safeSites,
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = updateProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...result.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Unassign sites from this project first
    await db
      .update(sites)
      .set({ projectId: null })
      .where(eq(sites.projectId, parseInt(id)));

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning({ id: projects.id });

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
