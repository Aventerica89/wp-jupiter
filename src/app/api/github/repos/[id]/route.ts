import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { githubRepos, siteGithubConnections, githubCommits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createGitHubClientFromEncrypted, encryptGitHubToken } from "@/lib/github";
import { z } from "zod";

const updateRepoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  defaultBranch: z.string().optional(),
  accessToken: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/github/repos/[id] - Get a single GitHub repo with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repoId = parseInt(id);

    const repo = await db.query.githubRepos.findFirst({
      where: eq(githubRepos.id, repoId),
      with: {
        siteConnections: {
          with: {
            site: true,
            commits: {
              limit: 10,
              orderBy: (commits, { desc }) => [desc(commits.committedAt)],
            },
          },
        },
      },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Get branches from GitHub
    const client = createGitHubClientFromEncrypted(
      repo.owner,
      repo.repo,
      repo.accessToken
    );

    let branches: string[] = [];
    try {
      const branchList = await client.listBranches();
      branches = branchList.map((b) => b.name);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }

    return NextResponse.json({
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      repo: repo.repo,
      defaultBranch: repo.defaultBranch,
      lastSyncedAt: repo.lastSyncedAt,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      branches,
      connections: repo.siteConnections.map((c) => ({
        id: c.id,
        siteId: c.siteId,
        siteName: c.site.name,
        siteUrl: c.site.url,
        branch: c.branch,
        path: c.path,
        syncDirection: c.syncDirection,
        autoSync: c.autoSync,
        lastCommitSha: c.lastCommitSha,
        lastPushedAt: c.lastPushedAt,
        lastPulledAt: c.lastPulledAt,
        recentCommits: c.commits,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch GitHub repo:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 }
    );
  }
}

// PUT /api/github/repos/[id] - Update a GitHub repo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repoId = parseInt(id);
    const body = await request.json();

    const result = updateRepoSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const existingRepo = await db.query.githubRepos.findFirst({
      where: eq(githubRepos.id, repoId),
    });

    if (!existingRepo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const updateData: Partial<typeof githubRepos.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (result.data.name) {
      updateData.name = result.data.name;
    }

    if (result.data.defaultBranch) {
      updateData.defaultBranch = result.data.defaultBranch;
    }

    if (result.data.accessToken) {
      updateData.accessToken = encryptGitHubToken(result.data.accessToken);
    }

    const [updatedRepo] = await db
      .update(githubRepos)
      .set(updateData)
      .where(eq(githubRepos.id, repoId))
      .returning({
        id: githubRepos.id,
        name: githubRepos.name,
        owner: githubRepos.owner,
        repo: githubRepos.repo,
        defaultBranch: githubRepos.defaultBranch,
        updatedAt: githubRepos.updatedAt,
      });

    return NextResponse.json(updatedRepo);
  } catch (error) {
    console.error("Failed to update GitHub repo:", error);
    return NextResponse.json(
      { error: "Failed to update repository" },
      { status: 500 }
    );
  }
}

// DELETE /api/github/repos/[id] - Delete a GitHub repo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repoId = parseInt(id);

    const repo = await db.query.githubRepos.findFirst({
      where: eq(githubRepos.id, repoId),
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Delete will cascade to connections and commits
    await db.delete(githubRepos).where(eq(githubRepos.id, repoId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete GitHub repo:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 }
    );
  }
}
