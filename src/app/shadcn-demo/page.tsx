"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, CheckCircle, Package, Palette } from "lucide-react";
import Link from "next/link";

interface Site {
  id: number;
  name: string;
  url: string;
  status: string;
  pluginUpdates: number;
  themeUpdates: number;
  wpVersion: string | null;
  lastChecked: string | null;
}

export default function Page() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch("/api/sites");
        const data = await res.json();
        setSites(data);
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const stats = {
    total: sites.length,
    online: sites.filter((s) => s.status === "online").length,
    offline: sites.filter((s) => s.status === "offline").length,
    pluginUpdates: sites.reduce((acc, s) => acc + (s.pluginUpdates || 0), 0),
    themeUpdates: sites.reduce((acc, s) => acc + (s.themeUpdates || 0), 0),
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {stats.online}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugin Updates</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {stats.pluginUpdates}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Theme Updates</CardTitle>
            <Palette className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">
                {stats.themeUpdates}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sites List */}
      <Card>
        <CardHeader>
          <CardTitle>Your WordPress Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No sites yet. Add your first WordPress site!
            </p>
          ) : (
            <div className="space-y-4">
              {sites.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        site.status === "online"
                          ? "bg-green-500"
                          : site.status === "offline"
                            ? "bg-red-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-muted-foreground">{site.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {site.pluginUpdates > 0 && (
                      <Badge variant="secondary">
                        {site.pluginUpdates} plugin
                        {site.pluginUpdates !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {site.themeUpdates > 0 && (
                      <Badge variant="outline">
                        {site.themeUpdates} theme
                        {site.themeUpdates !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {site.status === "online" ? (
                      <Badge variant="success">Online</Badge>
                    ) : site.status === "offline" ? (
                      <Badge variant="destructive">Offline</Badge>
                    ) : (
                      <Badge variant="secondary">Unknown</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
