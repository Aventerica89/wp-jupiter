import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  siteGithubConnections,
  githubRepos,
  githubCommits,
  sites,
  activityLog,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createGitHubClientFromEncrypted } from "@/lib/github";
import { z } from "zod";

const connectRepoSchema = z.object({
  repoId: z.number().int().positive(),
  branch: z.string().default("main"),
  path: z.string().default("/"),
  syncDirection: z.enum(["push", "pull", "bidirectional"]).default("push"),
  autoSync: z.boolean().default(false),
});

const commitSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
  message: z.string().min(1, "Commit message is required"),
  branch: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sites/[id]/github - Get GitHub connection for a site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);

    const connections = await db.query.siteGithubConnections.findMany({
      where: eq(siteGithubConnections.siteId, siteId),
      with: {
        repo: true,
        commits: {
          limit: 20,
          orderBy: (commits, { desc }) => [desc(commits.committedAt)],
        },
      },
    });

    return NextResponse.json(
      connections.map((c) => ({
        id: c.id,
        repoId: c.repoId,
        repoName: c.repo.name,
        repoOwner: c.repo.owner,
        repoRepo: c.repo.repo,
        branch: c.branch,
        path: c.path,
        syncDirection: c.syncDirection,
        autoSync: c.autoSync,
        lastCommitSha: c.lastCommitSha,
        lastPushedAt: c.lastPushedAt,
        lastPulledAt: c.lastPulledAt,
        createdAt: c.createdAt,
        commits: c.commits,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch GitHub connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub connections" },
      { status: 500 }
    );
  }
}

// POST /api/sites/[id]/github - Connect a site to a GitHub repo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);
    const body = await request.json();

    const result = connectRepoSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify site exists
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, siteId),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Verify repo exists
    const repo = await db.query.githubRepos.findFirst({
      where: eq(githubRepos.id, result.data.repoId),
    });

    if (!repo) {
      return NextResponse.json(
        { error: "GitHub repository not found" },
        { status: 404 }
      );
    }

    // Check if connection already exists
    const existing = await db.query.siteGithubConnections.findFirst({
      where: and(
        eq(siteGithubConnections.siteId, siteId),
        eq(siteGithubConnections.repoId, result.data.repoId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Site is already connected to this repository" },
        { status: 409 }
      );
    }

    const [connection] = await db
      .insert(siteGithubConnections)
      .values({
        siteId,
        repoId: result.data.repoId,
        branch: result.data.branch,
        path: result.data.path,
        syncDirection: result.data.syncDirection,
        autoSync: result.data.autoSync,
      })
      .returning();

    // Log activity
    await db.insert(activityLog).values({
      siteId,
      action: "github_repo_connected",
      status: "success",
      details: `Connected to ${repo.owner}/${repo.repo} on branch ${result.data.branch}`,
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Failed to connect GitHub repo:", error);
    return NextResponse.json(
      { error: "Failed to connect GitHub repository" },
      { status: 500 }
    );
  }
}

// PUT /api/sites/[id]/github - Create a commit (push files to GitHub)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);
    const body = await request.json();

    const result = commitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Get the site's GitHub connection
    const connection = await db.query.siteGithubConnections.findFirst({
      where: eq(siteGithubConnections.siteId, siteId),
      with: {
        repo: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Site is not connected to a GitHub repository" },
        { status: 404 }
      );
    }

    const { repo } = connection;
    const branch = result.data.branch || connection.branch || "main";

    // Create GitHub client and commit files
    const client = createGitHubClientFromEncrypted(
      repo.owner,
      repo.repo,
      repo.accessToken
    );

    // Prepend the connection path to file paths
    const connectionPath = connection.path || "/";
    const filesWithPath = result.data.files.map((f) => ({
      ...f,
      path: connectionPath === "/"
        ? f.path
        : `${connectionPath.replace(/^\/|\/$/g, "")}/${f.path}`,
    }));

    const commit = await client.commitMultipleFiles(
      filesWithPath,
      result.data.message,
      branch
    );

    // Record the commit in our database
    await db.insert(githubCommits).values({
      connectionId: connection.id,
      sha: commit.sha,
      message: commit.message,
      author: commit.author.name,
      authorEmail: commit.author.email,
      filesChanged: JSON.stringify(result.data.files.map((f) => f.path)),
      committedAt: commit.author.date,
    });

    // Update connection's last commit info
    await db
      .update(siteGithubConnections)
      .set({
        lastCommitSha: commit.sha,
        lastPushedAt: new Date().toISOString(),
      })
      .where(eq(siteGithubConnections.id, connection.id));

    // Update repo's last synced
    await db
      .update(githubRepos)
      .set({
        lastSyncedAt: new Date().toISOString(),
      })
      .where(eq(githubRepos.id, repo.id));

    // Log activity
    await db.insert(activityLog).values({
      siteId,
      action: "github_commit",
      status: "success",
      details: `Pushed ${result.data.files.length} file(s): ${result.data.message}`,
    });

    return NextResponse.json({
      success: true,
      commit: {
        sha: commit.sha,
        message: commit.message,
        branch,
        files: result.data.files.length,
      },
    });
  } catch (error) {
    console.error("Failed to create GitHub commit:", error);
    return NextResponse.json(
      { error: "Failed to create commit" },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/[id]/github - Disconnect site from GitHub
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const siteId = parseInt(id);

    const connectionId = request.nextUrl.searchParams.get("connectionId");

    if (connectionId) {
      // Delete specific connection
      await db
        .delete(siteGithubConnections)
        .where(eq(siteGithubConnections.id, parseInt(connectionId)));
    } else {
      // Delete all connections for this site
      await db
        .delete(siteGithubConnections)
        .where(eq(siteGithubConnections.siteId, siteId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to disconnect GitHub:", error);
    return NextResponse.json(
      { error: "Failed to disconnect from GitHub" },
      { status: 500 }
    );
  }
}
