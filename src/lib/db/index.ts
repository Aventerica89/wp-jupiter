import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      // During build, use a placeholder - actual calls will fail but build will succeed
      client = createClient({
        url: "file:local.db",
      });
    } else {
      client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    }
  }
  return client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (!database) {
    database = drizzle(getClient(), { schema });
  }
  return database;
}

// For convenience, export a proxy that lazily initializes
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
