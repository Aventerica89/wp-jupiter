import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { githubRepos } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import {
  GitHubClient,
  GitHubError,
  encryptGitHubToken,
} from "@/lib/github";
import { z } from "zod";

const createRepoSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  defaultBranch: z.string().default("main"),
  accessToken: z.string().min(1, "Access token is required"),
});

// GET /api/github/repos - List all GitHub repos
export async function GET() {
  try {
    const repos = await db.query.githubRepos.findMany({
      with: {
        siteConnections: {
          with: {
            site: true,
          },
        },
      },
      orderBy: (repos, { desc }) => [desc(repos.createdAt)],
    });

    // Strip sensitive data
    const safeRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      repo: repo.repo,
      defaultBranch: repo.defaultBranch,
      lastSyncedAt: repo.lastSyncedAt,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      connectedSites: repo.siteConnections.length,
      sites: repo.siteConnections.map((c) => ({
        id: c.site.id,
        name: c.site.name,
        branch: c.branch,
      })),
    }));

    return NextResponse.json(safeRepos);
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub repositories" },
      { status: 500 }
    );
  }
}

// POST /api/github/repos - Add a new GitHub repo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = createRepoSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, owner, repo, defaultBranch, accessToken } = result.data;

    // Verify the access token works
    const client = new GitHubClient({ owner, repo, accessToken });
    const verification = await client.verifyAccess();

    if (!verification.valid) {
      return NextResponse.json(
        { error: "Invalid GitHub access token" },
        { status: 401 }
      );
    }

    if (!verification.repoExists) {
      return NextResponse.json(
        { error: "Repository not found or not accessible" },
        { status: 404 }
      );
    }

    if (!verification.permissions.push) {
      return NextResponse.json(
        {
          error: "Access token does not have push permissions",
          hint: "Make sure your Personal Access Token has the 'repo' scope",
        },
        { status: 403 }
      );
    }

    // Encrypt the access token
    const encryptedToken = encryptGitHubToken(accessToken);

    const [newRepo] = await db
      .insert(githubRepos)
      .values({
        name,
        owner,
        repo,
        defaultBranch,
        accessToken: encryptedToken,
      })
      .returning({
        id: githubRepos.id,
        name: githubRepos.name,
        owner: githubRepos.owner,
        repo: githubRepos.repo,
        defaultBranch: githubRepos.defaultBranch,
        createdAt: githubRepos.createdAt,
      });

    return NextResponse.json(newRepo, { status: 201 });
  } catch (error) {
    console.error("Failed to create GitHub repo:", error);

    if (error instanceof GitHubError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to create GitHub repository" },
      { status: 500 }
    );
  }
}
