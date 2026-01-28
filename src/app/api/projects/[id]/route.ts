import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { parseId, invalidIdResponse, sanitizeError, apiError } from "@/lib/api-utils";

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
    const projectId = parseId(id);

    if (!projectId) {
      return invalidIdResponse();
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
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
    console.error("Failed to fetch project:", sanitizeError(error));
    return apiError("Failed to fetch project");
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const projectId = parseId(id);

    if (!projectId) {
      return invalidIdResponse();
    }

    const body = await request.json();

    const result = updateProjectSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten());
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...result.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update project:", sanitizeError(error));
    return apiError("Failed to update project");
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const projectId = parseId(id);

    if (!projectId) {
      return invalidIdResponse();
    }

    // Unassign sites from this project first
    await db
      .update(sites)
      .set({ projectId: null })
      .where(eq(sites.projectId, projectId));

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning({ id: projects.id });

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", sanitizeError(error));
    return apiError("Failed to delete project");
  }
}
