import type { Config } from "drizzle-kit";

const dbUrl = process.env.TURSO_DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "TURSO_DATABASE_URL environment variable is required. " +
    "Please set it in your .env.local file."
  );
}

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
