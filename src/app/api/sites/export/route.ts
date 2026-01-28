import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/sites/export - Export sites as CSV
export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get("format") || "csv";
    const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";

    const allSites = await db.query.sites.findMany({
      with: {
        plugins: true,
        themes: true,
        server: {
          with: {
            provider: true,
          },
        },
        project: true,
      },
    });

    // Filter archived sites unless requested
    const sites = includeArchived
      ? allSites
      : allSites.filter((s) => !s.isArchived);

    if (format === "json") {
      // JSON export (without sensitive data)
      const jsonData = sites.map((site) => ({
        id: site.id,
        name: site.name,
        url: site.url,
        status: site.status,
        wpVersion: site.wpVersion,
        phpVersion: site.phpVersion,
        sslExpiry: site.sslExpiry,
        lastChecked: site.lastChecked,
        notes: site.notes,
        isFavorite: site.isFavorite,
        isArchived: site.isArchived,
        createdAt: site.createdAt,
        server: site.server?.name || null,
        serverIp: site.server?.ipAddress || null,
        provider: site.server?.provider?.name || null,
        project: site.project?.name || null,
        pluginCount: site.plugins.length,
        themeCount: site.themes.length,
        pluginUpdates: site.plugins.filter((p) => p.updateAvailable).length,
        themeUpdates: site.themes.filter((t) => t.updateAvailable).length,
      }));

      return NextResponse.json(jsonData, {
        headers: {
          "Content-Disposition": `attachment; filename="wp-manager-sites-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    // CSV export
    const headers = [
      "ID",
      "Name",
      "URL",
      "Status",
      "WP Version",
      "PHP Version",
      "SSL Expiry",
      "Last Checked",
      "Server",
      "Server IP",
      "Provider",
      "Project",
      "Plugin Count",
      "Theme Count",
      "Plugin Updates",
      "Theme Updates",
      "Favorite",
      "Archived",
      "Created At",
      "Notes",
    ];

    const rows = sites.map((site) => [
      site.id,
      `"${(site.name || "").replace(/"/g, '""')}"`,
      site.url,
      site.status,
      site.wpVersion || "",
      site.phpVersion || "",
      site.sslExpiry || "",
      site.lastChecked || "",
      site.server?.name || "",
      site.server?.ipAddress || "",
      site.server?.provider?.name || "",
      site.project?.name || "",
      site.plugins.length,
      site.themes.length,
      site.plugins.filter((p) => p.updateAvailable).length,
      site.themes.filter((t) => t.updateAvailable).length,
      site.isFavorite ? "Yes" : "No",
      site.isArchived ? "Yes" : "No",
      site.createdAt,
      `"${(site.notes || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wp-manager-sites-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
