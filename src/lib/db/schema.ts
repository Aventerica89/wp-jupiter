import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// Sites table - stores WordPress site credentials and status
export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  apiUsername: text("api_username").notNull(),
  apiPassword: text("api_password").notNull(), // Encrypted WordPress Application Password
  wpVersion: text("wp_version"),
  phpVersion: text("php_version"),
  status: text("status", { enum: ["online", "offline", "unknown"] }).default("unknown"),
  sslExpiry: text("ssl_expiry"),
  lastChecked: text("last_checked"),
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
export const sitesRelations = relations(sites, ({ many }) => ({
  plugins: many(plugins),
  themes: many(themes),
  users: many(wpUsers),
  activities: many(activityLog),
  updateLogs: many(updateLog),
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

// Type exports
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Plugin = typeof plugins.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type WpUser = typeof wpUsers.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type UpdateLogEntry = typeof updateLog.$inferSelect;
export type NewUpdateLogEntry = typeof updateLog.$inferInsert;
