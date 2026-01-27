/**
 * WordPress REST API client
 * Supports both Application Passwords (WP 5.6+) and WP Manager Connector plugin
 */

interface WPRequestOptions {
  siteUrl: string;
  username: string;
  password: string; // Application Password or Connector Secret
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

interface ConnectorHealth {
  status: string;
  plugin_version: string;
  configured: boolean;
}

class WordPressAPI {
  private siteUrl: string;
  private authHeader: string;
  private secret: string;
  private connectorAvailable: boolean | null = null;

  constructor({ siteUrl, username, password }: WPRequestOptions) {
    // Remove trailing slash
    this.siteUrl = siteUrl.replace(/\/$/, "");
    // Create Basic Auth header for standard WP API
    this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
    // Store password as connector secret
    this.secret = password;
  }

  /**
   * Check if the WP Manager Connector plugin is installed and configured
   */
  private async checkConnector(): Promise<boolean> {
    if (this.connectorAvailable !== null) {
      return this.connectorAvailable;
    }

    try {
      const response = await fetch(`${this.siteUrl}/wp-json/wp-manager/v1/health`, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data: ConnectorHealth = await response.json();
        this.connectorAvailable = data.status === "ok" && data.configured;
        return this.connectorAvailable;
      }
    } catch {
      // Connector not available
    }

    this.connectorAvailable = false;
    return false;
  }

  /**
   * Make request using the connector plugin
   */
  private async connectorRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.siteUrl}/wp-json/wp-manager/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-WP-Manager-Secret": this.secret,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Connector API error: ${response.status} - ${error}`);
    }

    return response.json();
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
   * Helper to fetch data with connector fallback to standard API
   */
  private async fetchWithConnectorFallback<T>(
    connectorEndpoint: string,
    wpApiEndpoint: string
  ): Promise<T> {
    const hasConnector = await this.checkConnector();
    if (hasConnector) {
      try {
        return await this.connectorRequest<T>(connectorEndpoint);
      } catch (connectorError) {
        console.log(`Connector ${connectorEndpoint} failed, falling back to standard API:`, connectorError);
      }
    }
    return this.request<T>(wpApiEndpoint);
  }

  /**
   * Check if site is reachable and get basic info
   * Uses connector plugin if available for richer data
   */
  async checkHealth(): Promise<WPSiteHealth & { online: boolean }> {
    try {
      // Check if connector is available and get detailed info
      const hasConnector = await this.checkConnector();
      if (hasConnector) {
        try {
          const info = await this.connectorRequest<{
            wp_version: string;
            php_version: string;
            is_ssl: boolean;
          }>("/info");
          return {
            online: true,
            version: info.wp_version,
            php_version: info.php_version,
            is_ssl: info.is_ssl,
          };
        } catch (connectorError) {
          console.log("Connector /info failed, falling back to standard health check:", connectorError);
        }
      }

      // Standard health check
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
    } catch (error) {
      console.log("Health check failed:", error);
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
   * Uses connector plugin if available, falls back to standard WP API
   */
  async getPlugins(): Promise<WPPlugin[]> {
    return this.fetchWithConnectorFallback<WPPlugin[]>("/plugins", "/wp/v2/plugins");
  }

  /**
   * Activate/deactivate a specific plugin
   */
  async updatePlugin(pluginSlug: string): Promise<WPPlugin> {
    return this.request<WPPlugin>(`/wp/v2/plugins/${pluginSlug}`, {
      method: "POST",
      body: JSON.stringify({ status: "active" }),
    });
  }

  /**
   * Update a plugin to its latest version
   * Uses connector plugin if available, falls back to standard WP API
   */
  async updatePluginVersion(pluginSlug: string): Promise<WPPlugin> {
    const hasConnector = await this.checkConnector();

    if (hasConnector) {
      try {
        return await this.connectorRequest<WPPlugin>(
          `/plugins/update`,
          {
            method: "POST",
            body: JSON.stringify({ plugin: pluginSlug }),
          }
        );
      } catch (connectorError) {
        console.log(
          "Connector plugin update failed, falling back to standard API:",
          connectorError
        );
      }
    }

    // Standard WP REST API - requires WordPress 5.5+ with auto-updates enabled
    // Note: This may not work on all hosts
    return this.request<WPPlugin>(
      `/wp/v2/plugins/${encodeURIComponent(pluginSlug)}`,
      {
        method: "POST",
        body: JSON.stringify({ update: true }),
      }
    );
  }

  /**
   * Update a theme to its latest version
   * Uses connector plugin if available, falls back to standard WP API
   */
  async updateThemeVersion(stylesheet: string): Promise<WPTheme> {
    const hasConnector = await this.checkConnector();

    if (hasConnector) {
      try {
        return await this.connectorRequest<WPTheme>(
          `/themes/${encodeURIComponent(stylesheet)}/update`,
          { method: "POST" }
        );
      } catch (connectorError) {
        console.log(
          "Connector theme update failed, falling back to standard API:",
          connectorError
        );
      }
    }

    // Standard WP REST API
    return this.request<WPTheme>(
      `/wp/v2/themes/${encodeURIComponent(stylesheet)}`,
      {
        method: "POST",
        body: JSON.stringify({ update: true }),
      }
    );
  }

  /**
   * Get all themes with their update status
   * Uses connector plugin if available, falls back to standard WP API
   */
  async getThemes(): Promise<WPTheme[]> {
    return this.fetchWithConnectorFallback<WPTheme[]>("/themes", "/wp/v2/themes");
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
