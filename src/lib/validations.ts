import { z } from "zod";

export const createSiteSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  url: z.string().url("Invalid URL format"),
  apiUsername: z.string().min(1, "Username is required"),
  apiPassword: z.string().min(1, "Password is required"),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  apiUsername: z.string().min(1).optional(),
  apiPassword: z.string().min(1).optional(),
  status: z.enum(["online", "offline", "unknown"]).optional(),
  wpVersion: z.string().nullable().optional(),
  phpVersion: z.string().nullable().optional(),
  sslExpiry: z.string().nullable().optional(),
});

export const updatePluginSchema = z.object({
  pluginSlug: z.string().min(1, "Plugin slug is required"),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type UpdatePluginInput = z.infer<typeof updatePluginSchema>;
