import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Projects/folders for organizing sites
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"), // Default indigo
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Hosting providers (xCloud, Cloudways, Runcloud, etc.)
export const providers = sqliteTable("providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(), // 'xcloud', 'cloudways', 'runcloud'
  name: text("name").notNull(), // 'xCloud', 'Cloudways', 'RunCloud'
  logoUrl: text("logo_url"), // URL to provider logo
  dashboardUrl: text("dashboard_url"), // Base URL for dashboard (e.g., 'https://my.xcloud.host')
  serverUrlPattern: text("server_url_pattern"), // Pattern for server links: '/servers/{serverId}'
  docsUrl: text("docs_url"),
  supportUrl: text("support_url"),
  communityUrl: text("community_url"), // Facebook group, Discord, etc.
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Servers within a provider
export const servers = sqliteTable("servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "set null" }),
  name: text("name").notNull(), // 'Production Server 1', 'Staging'
  ipAddress: text("ip_address"), // '192.168.1.1'
  externalId: text("external_id"), // Provider's ID for the server (for URL generation)
  region: text("region"), // 'us-east-1', 'London', etc.
  notes: text("notes"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Sites table - stores WordPress site credentials and status
export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serverId: integer("server_id").references(() => servers.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  apiUsername: text("api_username").notNull(),
  apiPassword: text("api_password").notNull(), // Encrypted WordPress Application Password
  wpVersion: text("wp_version"),
  phpVersion: text("php_version"),
  status: text("status", { enum: ["online", "offline", "unknown"] }).default("unknown"),
  sslExpiry: text("ssl_expiry"),
  lastChecked: text("last_checked"),
  notes: text("notes"), // Site notes/changelog
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false),
  isArchived: integer("is_archived", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Plugins table - tracks plugins on each site
export const plugins = sqliteTable("plugins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  version: text("version"),
  updateAvailable: integer("update_available", { mode: "boolean" }).default(false),
  newVersion: text("new_version"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

// Themes table - tracks themes on each site
export const themes = sqliteTable("themes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  version: text("version"),
  updateAvailable: integer("update_available", { mode: "boolean" }).default(false),
  newVersion: text("new_version"),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
});

// WordPress users on remote sites
export const wpUsers = sqliteTable("wp_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  wpUserId: integer("wp_user_id").notNull(),
  username: text("username").notNull(),
  email: text("email"),
  role: text("role"),
  lastLogin: text("last_login"),
});

// Activity log for tracking actions
export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  action: text("action", {
    enum: [
      "site_added",
      "site_updated",
      "site_deleted",
      "site_sync",
      "health_check",
      "plugin_updated",
      "theme_updated",
      "bulk_update_started",
      "bulk_update_completed",
      "server_added",
      "server_updated",
      "provider_added",
      "github_push",
      "github_pull",
      "github_commit",
      "github_repo_connected",
      "license_activated",
      "license_deactivated",
      "license_injected",
      "license_validation",
      "error",
    ],
  }).notNull(),
  status: text("status", { enum: ["success", "failed", "info"] }).default("info"),
  details: text("details"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Update log for tracking bulk update operations
export const updateLog = sqliteTable("update_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  itemType: text("item_type", { enum: ["plugin", "theme"] }).notNull(),
  itemSlug: text("item_slug").notNull(),
  itemName: text("item_name").notNull(),
  fromVersion: text("from_version"),
  toVersion: text("to_version"),
  status: text("status", { enum: ["pending", "in_progress", "success", "failed"] }).default("pending"),
  errorMessage: text("error_message"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  sites: many(sites),
}));

export const providersRelations = relations(providers, ({ many }) => ({
  servers: many(servers),
}));

export const serversRelations = relations(servers, ({ one, many }) => ({
  provider: one(providers, {
    fields: [servers.providerId],
    references: [providers.id],
  }),
  sites: many(sites),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  server: one(servers, {
    fields: [sites.serverId],
    references: [servers.id],
  }),
  project: one(projects, {
    fields: [sites.projectId],
    references: [projects.id],
  }),
  plugins: many(plugins),
  themes: many(themes),
  users: many(wpUsers),
  activities: many(activityLog),
  updateLogs: many(updateLog),
  tags: many(siteTags),
  backups: many(backups),
  securityScans: many(securityScans),
  uptimeChecks: many(uptimeChecks),
  uptimeIncidents: many(uptimeIncidents),
  performanceMetrics: many(performanceMetrics),
  userPermissions: many(userSitePermissions),
  clientAccess: many(clientSiteAccess),
  githubConnections: many(siteGithubConnections),
  licenseAssignments: many(siteLicenseAssignments),
}));

export const pluginsRelations = relations(plugins, ({ one }) => ({
  site: one(sites, {
    fields: [plugins.siteId],
    references: [sites.id],
  }),
}));

export const themesRelations = relations(themes, ({ one }) => ({
  site: one(sites, {
    fields: [themes.siteId],
    references: [sites.id],
  }),
}));

export const wpUsersRelations = relations(wpUsers, ({ one }) => ({
  site: one(sites, {
    fields: [wpUsers.siteId],
    references: [sites.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  site: one(sites, {
    fields: [activityLog.siteId],
    references: [sites.id],
  }),
}));

export const updateLogRelations = relations(updateLog, ({ one }) => ({
  site: one(sites, {
    fields: [updateLog.siteId],
    references: [sites.id],
  }),
}));

// Tags for categorizing sites
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").default("#3b82f6"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Junction table for site tags (many-to-many)
export const siteTags = sqliteTable("site_tags", {
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

// Notification settings
export const notificationSettings = sqliteTable("notification_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["email", "slack", "discord", "webhook"] }).notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  config: text("config"), // JSON config (email addresses, webhook URLs, etc.)
  events: text("events"), // JSON array of events to notify on
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Notification history
export const notificationHistory = sqliteTable("notification_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  settingId: integer("setting_id").references(() => notificationSettings.id, { onDelete: "cascade" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["sent", "failed"] }).default("sent"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Scheduled jobs configuration
export const scheduledJobs = sqliteTable("scheduled_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type", { enum: ["sync_all", "sync_site", "health_check", "backup"] }).notNull(),
  schedule: text("schedule").notNull(), // Cron expression
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  lastRun: text("last_run"),
  nextRun: text("next_run"),
  config: text("config"), // JSON config
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Backup tracking
export const backups = sqliteTable("backups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["manual", "scheduled", "pre_update"] }).notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed", "failed"] }).default("pending"),
  size: integer("size"), // Bytes
  location: text("location"), // Storage location (S3, local, etc.)
  fileCount: integer("file_count"),
  dbSize: integer("db_size"),
  errorMessage: text("error_message"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Security scan results
export const securityScans = sqliteTable("security_scans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  scanType: text("scan_type", { enum: ["vulnerability", "malware", "ssl", "firewall"] }).notNull(),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).default("pending"),
  score: integer("score"), // 0-100 security score
  issues: text("issues"), // JSON array of found issues
  recommendations: text("recommendations"), // JSON array
  completedAt: text("completed_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Uptime monitoring checks
export const uptimeChecks = sqliteTable("uptime_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["up", "down", "degraded"] }).notNull(),
  responseTime: integer("response_time"), // Milliseconds
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  checkedAt: text("checked_at").$defaultFn(() => new Date().toISOString()),
});

// Uptime incidents
export const uptimeIncidents = sqliteTable("uptime_incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  startedAt: text("started_at").notNull(),
  resolvedAt: text("resolved_at"),
  duration: integer("duration"), // Seconds
  status: text("status", { enum: ["ongoing", "resolved"] }).default("ongoing"),
  notificationSent: integer("notification_sent", { mode: "boolean" }).default(false),
  notes: text("notes"),
});

// Performance metrics
export const performanceMetrics = sqliteTable("performance_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  pageLoadTime: integer("page_load_time"), // Milliseconds
  ttfb: integer("ttfb"), // Time to first byte (ms)
  domContentLoaded: integer("dom_content_loaded"), // Milliseconds
  firstContentfulPaint: integer("first_contentful_paint"), // Milliseconds
  largestContentfulPaint: integer("largest_contentful_paint"), // Milliseconds
  cumulativeLayoutShift: text("cumulative_layout_shift"), // Float as string
  performanceScore: integer("performance_score"), // 0-100
  checkedAt: text("checked_at").$defaultFn(() => new Date().toISOString()),
});

// Team users (for multi-user support)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "editor", "viewer"] }).default("viewer"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastLogin: text("last_login"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// User site permissions (which users can access which sites)
export const userSitePermissions = sqliteTable("user_site_permissions", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  permission: text("permission", { enum: ["view", "edit", "admin"] }).default("view"),
});

// White label settings
export const whiteLabelSettings = sqliteTable("white_label_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationName: text("organization_name"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#6366f1"),
  secondaryColor: text("secondary_color").default("#8b5cf6"),
  customDomain: text("custom_domain"),
  supportEmail: text("support_email"),
  supportUrl: text("support_url"),
  footerText: text("footer_text"),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Client portal users (read-only access for clients)
export const clientUsers = sqliteTable("client_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  organizationName: text("organization_name"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastLogin: text("last_login"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Client user site access
export const clientSiteAccess = sqliteTable("client_site_access", {
  clientUserId: integer("client_user_id").notNull().references(() => clientUsers.id, { onDelete: "cascade" }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
});

// Relations for new tables
export const tagsRelations = relations(tags, ({ many }) => ({
  siteTags: many(siteTags),
}));

export const siteTagsRelations = relations(siteTags, ({ one }) => ({
  site: one(sites, {
    fields: [siteTags.siteId],
    references: [sites.id],
  }),
  tag: one(tags, {
    fields: [siteTags.tagId],
    references: [tags.id],
  }),
}));

export const backupsRelations = relations(backups, ({ one }) => ({
  site: one(sites, {
    fields: [backups.siteId],
    references: [sites.id],
  }),
}));

export const securityScansRelations = relations(securityScans, ({ one }) => ({
  site: one(sites, {
    fields: [securityScans.siteId],
    references: [sites.id],
  }),
}));

export const uptimeChecksRelations = relations(uptimeChecks, ({ one }) => ({
  site: one(sites, {
    fields: [uptimeChecks.siteId],
    references: [sites.id],
  }),
}));

export const uptimeIncidentsRelations = relations(uptimeIncidents, ({ one }) => ({
  site: one(sites, {
    fields: [uptimeIncidents.siteId],
    references: [sites.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  site: one(sites, {
    fields: [performanceMetrics.siteId],
    references: [sites.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sitePermissions: many(userSitePermissions),
}));

export const clientUsersRelations = relations(clientUsers, ({ many }) => ({
  siteAccess: many(clientSiteAccess),
}));

// GitHub repositories for version control
export const githubRepos = sqliteTable("github_repos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // Display name: 'Client Sites Repo'
  owner: text("owner").notNull(), // GitHub username/org: 'mycompany'
  repo: text("repo").notNull(), // Repository name: 'wordpress-sites'
  defaultBranch: text("default_branch").default("main"),
  accessToken: text("access_token").notNull(), // Encrypted GitHub PAT
  webhookSecret: text("webhook_secret"), // For receiving push events
  lastSyncedAt: text("last_synced_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Link sites to GitHub repos (a site can have one repo, repo can serve multiple sites)
export const siteGithubConnections = sqliteTable("site_github_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  repoId: integer("repo_id").notNull().references(() => githubRepos.id, { onDelete: "cascade" }),
  branch: text("branch").default("main"), // Branch for this site (e.g., 'production', 'staging')
  path: text("path").default("/"), // Path in repo for this site's files
  syncDirection: text("sync_direction", { enum: ["push", "pull", "bidirectional"] }).default("push"),
  autoSync: integer("auto_sync", { mode: "boolean" }).default(false),
  lastCommitSha: text("last_commit_sha"),
  lastPushedAt: text("last_pushed_at"),
  lastPulledAt: text("last_pulled_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// GitHub commit history for tracking changes
export const githubCommits = sqliteTable("github_commits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  connectionId: integer("connection_id").notNull().references(() => siteGithubConnections.id, { onDelete: "cascade" }),
  sha: text("sha").notNull(),
  message: text("message").notNull(),
  author: text("author"),
  authorEmail: text("author_email"),
  filesChanged: text("files_changed"), // JSON array of changed file paths
  additions: integer("additions"),
  deletions: integer("deletions"),
  committedAt: text("committed_at").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// License vendors (WooCommerce, EDD, Freemius, etc.)
export const licenseVendors = sqliteTable("license_vendors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // 'Elegant Themes', 'WPForms'
  slug: text("slug").notNull().unique(), // 'elegant-themes', 'wpforms'
  website: text("website"),
  apiEndpoint: text("api_endpoint"), // For automated license validation
  apiType: text("api_type", { enum: ["woocommerce", "edd", "freemius", "envato", "custom"] }),
  notes: text("notes"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Plugin/theme licenses (centralized license storage)
export const pluginLicenses = sqliteTable("plugin_licenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vendorId: integer("vendor_id").references(() => licenseVendors.id, { onDelete: "set null" }),
  name: text("name").notNull(), // 'WPForms Pro License', 'Divi Lifetime'
  pluginSlug: text("plugin_slug"), // 'wpforms-lite' - matches plugins.slug
  themeSlug: text("theme_slug"), // 'divi' - matches themes.slug
  licenseKey: text("license_key").notNull(), // Encrypted license key
  licenseEmail: text("license_email"), // Email associated with license
  licenseUrl: text("license_url"), // URL for license management
  maxActivations: integer("max_activations"), // null = unlimited
  currentActivations: integer("current_activations").default(0),
  purchaseDate: text("purchase_date"),
  expiresAt: text("expires_at"), // null = lifetime
  status: text("status", { enum: ["active", "expired", "suspended", "invalid"] }).default("active"),
  lastValidatedAt: text("last_validated_at"),
  notes: text("notes"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Track which licenses are assigned to which sites
export const siteLicenseAssignments = sqliteTable("site_license_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  licenseId: integer("license_id").notNull().references(() => pluginLicenses.id, { onDelete: "cascade" }),
  activatedAt: text("activated_at").$defaultFn(() => new Date().toISOString()),
  deactivatedAt: text("deactivated_at"),
  status: text("status", { enum: ["active", "inactive", "failed"] }).default("active"),
  activationResponse: text("activation_response"), // JSON response from license server
  lastInjectedAt: text("last_injected_at"), // When license was last pushed to site
});

// License injection history (for audit trail)
export const licenseInjectionLog = sqliteTable("license_injection_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assignmentId: integer("assignment_id").notNull().references(() => siteLicenseAssignments.id, { onDelete: "cascade" }),
  action: text("action", { enum: ["inject", "activate", "deactivate", "validate", "refresh"] }).notNull(),
  status: text("status", { enum: ["success", "failed"] }).notNull(),
  details: text("details"), // JSON with response/error details
  triggeredBy: text("triggered_by", { enum: ["manual", "clone", "restore", "sync", "scheduled"] }).default("manual"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// GitHub repos relations
export const githubReposRelations = relations(githubRepos, ({ many }) => ({
  siteConnections: many(siteGithubConnections),
}));

export const siteGithubConnectionsRelations = relations(siteGithubConnections, ({ one, many }) => ({
  site: one(sites, {
    fields: [siteGithubConnections.siteId],
    references: [sites.id],
  }),
  repo: one(githubRepos, {
    fields: [siteGithubConnections.repoId],
    references: [githubRepos.id],
  }),
  commits: many(githubCommits),
}));

export const githubCommitsRelations = relations(githubCommits, ({ one }) => ({
  connection: one(siteGithubConnections, {
    fields: [githubCommits.connectionId],
    references: [siteGithubConnections.id],
  }),
}));

// License relations
export const licenseVendorsRelations = relations(licenseVendors, ({ many }) => ({
  licenses: many(pluginLicenses),
}));

export const pluginLicensesRelations = relations(pluginLicenses, ({ one, many }) => ({
  vendor: one(licenseVendors, {
    fields: [pluginLicenses.vendorId],
    references: [licenseVendors.id],
  }),
  assignments: many(siteLicenseAssignments),
}));

export const siteLicenseAssignmentsRelations = relations(siteLicenseAssignments, ({ one, many }) => ({
  site: one(sites, {
    fields: [siteLicenseAssignments.siteId],
    references: [sites.id],
  }),
  license: one(pluginLicenses, {
    fields: [siteLicenseAssignments.licenseId],
    references: [pluginLicenses.id],
  }),
  injectionLogs: many(licenseInjectionLog),
}));

export const licenseInjectionLogRelations = relations(licenseInjectionLog, ({ one }) => ({
  assignment: one(siteLicenseAssignments, {
    fields: [licenseInjectionLog.assignmentId],
    references: [siteLicenseAssignments.id],
  }),
}));

// Type exports
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Plugin = typeof plugins.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type WpUser = typeof wpUsers.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type UpdateLogEntry = typeof updateLog.$inferSelect;
export type NewUpdateLogEntry = typeof updateLog.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type NewNotificationSetting = typeof notificationSettings.$inferInsert;
export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;
export type Backup = typeof backups.$inferSelect;
export type NewBackup = typeof backups.$inferInsert;
export type SecurityScan = typeof securityScans.$inferSelect;
export type NewSecurityScan = typeof securityScans.$inferInsert;
export type UptimeCheck = typeof uptimeChecks.$inferSelect;
export type UptimeIncident = typeof uptimeIncidents.$inferSelect;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ClientUser = typeof clientUsers.$inferSelect;
export type NewClientUser = typeof clientUsers.$inferInsert;
export type WhiteLabelSettings = typeof whiteLabelSettings.$inferSelect;
export type GithubRepo = typeof githubRepos.$inferSelect;
export type NewGithubRepo = typeof githubRepos.$inferInsert;
export type SiteGithubConnection = typeof siteGithubConnections.$inferSelect;
export type NewSiteGithubConnection = typeof siteGithubConnections.$inferInsert;
export type GithubCommit = typeof githubCommits.$inferSelect;
export type NewGithubCommit = typeof githubCommits.$inferInsert;
export type LicenseVendor = typeof licenseVendors.$inferSelect;
export type NewLicenseVendor = typeof licenseVendors.$inferInsert;
export type PluginLicense = typeof pluginLicenses.$inferSelect;
export type NewPluginLicense = typeof pluginLicenses.$inferInsert;
export type SiteLicenseAssignment = typeof siteLicenseAssignments.$inferSelect;
export type NewSiteLicenseAssignment = typeof siteLicenseAssignments.$inferInsert;
export type LicenseInjectionLog = typeof licenseInjectionLog.$inferSelect;
