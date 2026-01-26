/**
 * WordPress REST API client
 * Uses Application Passwords for authentication (WP 5.6+)
 */

interface WPRequestOptions {
  siteUrl: string;
  username: string;
  password: string;
}

interface WPPlugin {
  plugin: string;
  status: "active" | "inactive";
  name: string;
  version: string;
  update?: {
    version: string;
  };
}

interface WPTheme {
  stylesheet: string;
  name: string;
  version: string;
  status: "active" | "inactive";
  update?: {
    version: string;
  };
}

interface WPUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface WPSiteHealth {
  version: string;
  php_version?: string;
  is_ssl: boolean;
}

class WordPressAPI {
  private siteUrl: string;
  private authHeader: string;

  constructor({ siteUrl, username, password }: WPRequestOptions) {
    // Remove trailing slash
    this.siteUrl = siteUrl.replace(/\/$/, "");
    // Create Basic Auth header
    this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.siteUrl}/wp-json${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": this.authHeader,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Check if site is reachable and get basic info
   */
  async checkHealth(): Promise<WPSiteHealth & { online: boolean }> {
    try {
      const response = await fetch(`${this.siteUrl}/wp-json/`, {
        headers: { "Authorization": this.authHeader },
      });

      if (!response.ok) {
        return { online: false, version: "unknown", is_ssl: false };
      }

      const data = await response.json();
      return {
        online: true,
        version: data.description || "unknown",
        is_ssl: this.siteUrl.startsWith("https"),
      };
    } catch {
      return { online: false, version: "unknown", is_ssl: false };
    }
  }

  /**
   * Get WordPress core version and other site info
   */
  async getSiteInfo() {
    // Using the application-passwords endpoint to get site info
    const info = await this.request<{
      name: string;
      description: string;
      url: string;
      namespaces: string[];
    }>("/");

    return info;
  }

  /**
   * Get all plugins with their update status
   */
  async getPlugins(): Promise<WPPlugin[]> {
    return this.request<WPPlugin[]>("/wp/v2/plugins");
  }

  /**
   * Update a specific plugin
   */
  async updatePlugin(pluginSlug: string): Promise<WPPlugin> {
    return this.request<WPPlugin>(`/wp/v2/plugins/${pluginSlug}`, {
      method: "POST",
      body: JSON.stringify({ status: "active" }),
    });
  }

  /**
   * Get all themes with their update status
   */
  async getThemes(): Promise<WPTheme[]> {
    return this.request<WPTheme[]>("/wp/v2/themes");
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<WPUser[]> {
    return this.request<WPUser[]>("/wp/v2/users");
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    roles?: string[];
  }): Promise<WPUser> {
    return this.request<WPUser>("/wp/v2/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: number, reassignTo?: number): Promise<void> {
    const params = new URLSearchParams({
      force: "true",
      ...(reassignTo && { reassign: reassignTo.toString() }),
    });

    await this.request(`/wp/v2/users/${userId}?${params}`, {
      method: "DELETE",
    });
  }
}

export { WordPressAPI };
export type { WPPlugin, WPTheme, WPUser, WPSiteHealth, WPRequestOptions };
