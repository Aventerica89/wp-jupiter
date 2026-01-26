import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET /api/setup?token=YOUR_ENCRYPTION_SECRET - Initialize database tables
// Requires the ENCRYPTION_SECRET as a query parameter for security
export async function GET(request: NextRequest) {
  try {
    // Require authentication token
    const token = request.nextUrl.searchParams.get("token");
    const expectedToken = process.env.ENCRYPTION_SECRET;

    if (!expectedToken) {
      return NextResponse.json(
        { error: "Server misconfigured: ENCRYPTION_SECRET not set" },
        { status: 500 }
      );
    }

    if (!token || token !== expectedToken) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          hint: "Add ?token=YOUR_ENCRYPTION_SECRET to the URL"
        },
        { status: 401 }
      );
    }

    const db = getDb();

    // Create sites table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        api_username TEXT NOT NULL,
        api_password TEXT NOT NULL,
        wp_version TEXT,
        php_version TEXT,
        status TEXT DEFAULT 'unknown',
        ssl_expiry TEXT,
        last_checked TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // Create plugins table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS plugins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        version TEXT,
        update_available INTEGER DEFAULT 0,
        new_version TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Create themes table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        version TEXT,
        update_available INTEGER DEFAULT 0,
        new_version TEXT,
        is_active INTEGER DEFAULT 0
      )
    `);

    // Create wp_users table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS wp_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        wp_user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        role TEXT,
        last_login TEXT
      )
    `);

    // Create activity_log table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT
      )
    `);

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully!",
      tables: ["sites", "plugins", "themes", "wp_users", "activity_log"],
    });
  } catch (error) {
    console.error("Setup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Setup failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
