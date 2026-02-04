/**
 * GitHub Client Library for WP Jupiter
 * Handles repository operations, commits, and file management
 */

import { decrypt, encrypt } from "./crypto";

export interface GitHubRepo {
  owner: string;
  repo: string;
  accessToken: string; // Decrypted token
}

export interface GitHubFile {
  path: string;
  content: string;
  sha?: string; // Required for updates
}

export interface GitHubCommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  files?: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }[];
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Create GitHub API client with authentication
 */
export class GitHubClient {
  private owner: string;
  private repo: string;
  private token: string;

  constructor(repo: GitHubRepo) {
    this.owner = repo.owner;
    this.repo = repo.repo;
    this.token = repo.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new GitHubError(
        error.message || `GitHub API error: ${response.status}`,
        response.status,
        error
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Verify the access token and repository access
   */
  async verifyAccess(): Promise<{
    valid: boolean;
    repoExists: boolean;
    permissions: { push: boolean; pull: boolean };
  }> {
    try {
      const repo = await this.request<{
        permissions: { push: boolean; pull: boolean };
      }>(`/repos/${this.owner}/${this.repo}`);

      return {
        valid: true,
        repoExists: true,
        permissions: repo.permissions,
      };
    } catch (error) {
      if (error instanceof GitHubError) {
        if (error.status === 401) {
          return { valid: false, repoExists: false, permissions: { push: false, pull: false } };
        }
        if (error.status === 404) {
          return { valid: true, repoExists: false, permissions: { push: false, pull: false } };
        }
      }
      throw error;
    }
  }

  /**
   * List branches in the repository
   */
  async listBranches(): Promise<GitHubBranch[]> {
    return this.request<GitHubBranch[]>(
      `/repos/${this.owner}/${this.repo}/branches`
    );
  }

  /**
   * Create a new branch from a base branch
   */
  async createBranch(
    branchName: string,
    baseBranch: string = "main"
  ): Promise<{ ref: string; sha: string }> {
    // Get the SHA of the base branch
    const baseRef = await this.request<{ object: { sha: string } }>(
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${baseBranch}`
    );

    // Create the new branch
    const newRef = await this.request<{ ref: string; object: { sha: string } }>(
      `/repos/${this.owner}/${this.repo}/git/refs`,
      {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseRef.object.sha,
        }),
      }
    );

    return {
      ref: newRef.ref,
      sha: newRef.object.sha,
    };
  }

  /**
   * Get file content from repository
   */
  async getFile(
    path: string,
    branch: string = "main"
  ): Promise<{ content: string; sha: string } | null> {
    try {
      const response = await this.request<{
        content: string;
        sha: string;
        encoding: string;
      }>(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${branch}`);

      const content =
        response.encoding === "base64"
          ? Buffer.from(response.content, "base64").toString("utf-8")
          : response.content;

      return { content, sha: response.sha };
    } catch (error) {
      if (error instanceof GitHubError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get directory contents
   */
  async getDirectory(
    path: string = "",
    branch: string = "main"
  ): Promise<
    Array<{
      name: string;
      path: string;
      type: "file" | "dir";
      sha: string;
      size?: number;
    }>
  > {
    const endpoint = path
      ? `/repos/${this.owner}/${this.repo}/contents/${path}?ref=${branch}`
      : `/repos/${this.owner}/${this.repo}/contents?ref=${branch}`;

    return this.request(endpoint);
  }

  /**
   * Create or update a file
   */
  async putFile(
    path: string,
    content: string,
    message: string,
    branch: string = "main",
    sha?: string
  ): Promise<{ sha: string; commit: { sha: string } }> {
    const body: Record<string, string> = {
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(
    path: string,
    message: string,
    sha: string,
    branch: string = "main"
  ): Promise<{ commit: { sha: string } }> {
    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: "DELETE",
      body: JSON.stringify({
        message,
        sha,
        branch,
      }),
    });
  }

  /**
   * Commit multiple files at once using Git Data API
   */
  async commitMultipleFiles(
    files: GitHubFile[],
    message: string,
    branch: string = "main"
  ): Promise<GitHubCommitInfo> {
    // Get the current commit SHA for the branch
    const ref = await this.request<{ object: { sha: string } }>(
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${branch}`
    );
    const latestCommitSha = ref.object.sha;

    // Get the tree SHA for the latest commit
    const latestCommit = await this.request<{ tree: { sha: string } }>(
      `/repos/${this.owner}/${this.repo}/git/commits/${latestCommitSha}`
    );
    const baseTreeSha = latestCommit.tree.sha;

    // Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (file) => {
        const blob = await this.request<{ sha: string }>(
          `/repos/${this.owner}/${this.repo}/git/blobs`,
          {
            method: "POST",
            body: JSON.stringify({
              content: file.content,
              encoding: "utf-8",
            }),
          }
        );

        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      })
    );

    // Create a new tree
    const newTree = await this.request<{ sha: string }>(
      `/repos/${this.owner}/${this.repo}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );

    // Create the commit
    const newCommit = await this.request<{
      sha: string;
      author: { name: string; email: string; date: string };
    }>(`/repos/${this.owner}/${this.repo}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    // Update the branch reference
    await this.request(`/repos/${this.owner}/${this.repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      body: JSON.stringify({
        sha: newCommit.sha,
      }),
    });

    return {
      sha: newCommit.sha,
      message,
      author: newCommit.author,
    };
  }

  /**
   * Get commit history
   */
  async getCommits(
    branch: string = "main",
    path?: string,
    limit: number = 30
  ): Promise<GitHubCommitInfo[]> {
    let endpoint = `/repos/${this.owner}/${this.repo}/commits?sha=${branch}&per_page=${limit}`;
    if (path) {
      endpoint += `&path=${encodeURIComponent(path)}`;
    }

    const commits = await this.request<
      Array<{
        sha: string;
        commit: {
          message: string;
          author: { name: string; email: string; date: string };
        };
      }>
    >(endpoint);

    return commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author,
    }));
  }

  /**
   * Get a specific commit with file changes
   */
  async getCommit(sha: string): Promise<GitHubCommitInfo> {
    const commit = await this.request<{
      sha: string;
      commit: {
        message: string;
        author: { name: string; email: string; date: string };
      };
      files?: Array<{
        filename: string;
        status: string;
        additions: number;
        deletions: number;
      }>;
      stats?: { additions: number; deletions: number };
    }>(`/repos/${this.owner}/${this.repo}/commits/${sha}`);

    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author,
      files: commit.files,
    };
  }

  /**
   * Compare two commits/branches
   */
  async compare(
    base: string,
    head: string
  ): Promise<{
    ahead_by: number;
    behind_by: number;
    commits: GitHubCommitInfo[];
    files: Array<{ filename: string; status: string }>;
  }> {
    return this.request(
      `/repos/${this.owner}/${this.repo}/compare/${base}...${head}`
    );
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<{ number: number; html_url: string }> {
    return this.request(`/repos/${this.owner}/${this.repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({
        title,
        head,
        base,
        body,
      }),
    });
  }

  /**
   * Setup a webhook for push events
   */
  async createWebhook(
    webhookUrl: string,
    secret: string
  ): Promise<{ id: number; active: boolean }> {
    return this.request(`/repos/${this.owner}/${this.repo}/hooks`, {
      method: "POST",
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["push"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    });
  }
}

/**
 * Custom error class for GitHub API errors
 */
export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/**
 * Create a GitHub client from encrypted stored credentials
 */
export function createGitHubClientFromEncrypted(
  owner: string,
  repo: string,
  encryptedToken: string
): GitHubClient {
  const accessToken = decrypt(encryptedToken);
  return new GitHubClient({ owner, repo, accessToken });
}

/**
 * Encrypt a GitHub access token for storage
 */
export function encryptGitHubToken(token: string): string {
  return encrypt(token);
}
