import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, sites } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { sanitizeError, apiError } from "@/lib/api-utils";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

// GET /api/projects - Get all projects with site counts
export async function GET() {
  try {
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        color: projects.color,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        siteCount: sql<number>`(
          SELECT COUNT(*) FROM sites WHERE sites.project_id = ${projects.id}
        )`,
      })
      .from(projects)
      .orderBy(projects.name);

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("Failed to fetch projects:", sanitizeError(error));
    return apiError("Failed to fetch projects");
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten());
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        name: result.data.name,
        description: result.data.description || null,
        color: result.data.color || "#6366f1",
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", sanitizeError(error));
    return apiError("Failed to create project");
  }
}
