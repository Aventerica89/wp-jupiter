import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Sites table - stores WordPress site credentials and status
export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  apiUsername: text("api_username").notNull(),
  apiPassword: text("api_password").notNull(), // WordPress Application Password
  wpVersion: text("wp_version"),
  phpVersion: text("php_version"),
  status: text("status", { enum: ["online", "offline", "unknown"] }).default("unknown"),
  sslExpiry: text("ssl_expiry"),
  lastChecked: text("last_checked"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
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
  action: text("action").notNull(),
  details: text("details"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
  plugins: many(plugins),
  themes: many(themes),
  users: many(wpUsers),
  activities: many(activityLog),
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

// Type exports
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Plugin = typeof plugins.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type WpUser = typeof wpUsers.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
