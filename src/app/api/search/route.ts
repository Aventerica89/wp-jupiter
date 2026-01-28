import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, servers, plugins, themes, projects } from "@/lib/db/schema";
import { like, or, eq } from "drizzle-orm";
import { validateSearchQuery, sanitizeError, apiError } from "@/lib/api-utils";

interface SearchResult {
  type: "site" | "server" | "plugin" | "theme" | "project";
  id: number;
  name: string;
  url?: string;
  description?: string;
  parentId?: number;
  parentName?: string;
}

// GET /api/search?q=query - Global search
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");

    // Validate and sanitize query
    const validation = validateSearchQuery(query);
    if (!validation.valid) {
      return NextResponse.json({ results: [] });
    }

    const searchPattern = `%${validation.sanitized}%`;
    const results: SearchResult[] = [];

    // Search sites (excluding archived by default)
    const matchingSites = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
      })
      .from(sites)
      .where(
        or(
          like(sites.name, searchPattern),
          like(sites.url, searchPattern),
          like(sites.notes, searchPattern)
        )
      )
      .limit(10);

    for (const site of matchingSites) {
      results.push({
        type: "site",
        id: site.id,
        name: site.name,
        url: site.url,
      });
    }

    // Search servers
    const matchingServers = await db
      .select({
        id: servers.id,
        name: servers.name,
        ipAddress: servers.ipAddress,
      })
      .from(servers)
      .where(
        or(
          like(servers.name, searchPattern),
          like(servers.ipAddress, searchPattern),
          like(servers.notes, searchPattern)
        )
      )
      .limit(10);

    for (const server of matchingServers) {
      results.push({
        type: "server",
        id: server.id,
        name: server.name,
        description: server.ipAddress || undefined,
      });
    }

    // Search plugins (with site context)
    const matchingPlugins = await db
      .select({
        id: plugins.id,
        name: plugins.name,
        slug: plugins.slug,
        siteId: plugins.siteId,
        siteName: sites.name,
      })
      .from(plugins)
      .innerJoin(sites, eq(plugins.siteId, sites.id))
      .where(
        or(
          like(plugins.name, searchPattern),
          like(plugins.slug, searchPattern)
        )
      )
      .limit(10);

    for (const plugin of matchingPlugins) {
      results.push({
        type: "plugin",
        id: plugin.id,
        name: plugin.name,
        description: plugin.slug,
        parentId: plugin.siteId,
        parentName: plugin.siteName,
      });
    }

    // Search themes (with site context)
    const matchingThemes = await db
      .select({
        id: themes.id,
        name: themes.name,
        slug: themes.slug,
        siteId: themes.siteId,
        siteName: sites.name,
      })
      .from(themes)
      .innerJoin(sites, eq(themes.siteId, sites.id))
      .where(
        or(
          like(themes.name, searchPattern),
          like(themes.slug, searchPattern)
        )
      )
      .limit(10);

    for (const theme of matchingThemes) {
      results.push({
        type: "theme",
        id: theme.id,
        name: theme.name,
        description: theme.slug,
        parentId: theme.siteId,
        parentName: theme.siteName,
      });
    }

    // Search projects
    const matchingProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
      })
      .from(projects)
      .where(
        or(
          like(projects.name, searchPattern),
          like(projects.description, searchPattern)
        )
      )
      .limit(10);

    for (const project of matchingProjects) {
      results.push({
        type: "project",
        id: project.id,
        name: project.name,
        description: project.description || undefined,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search failed:", sanitizeError(error));
    return apiError("Search failed");
  }
}
