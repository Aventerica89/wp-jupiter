"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Site {
  id: number;
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  wpVersion: string | null;
  lastChecked: string | null;
  pluginUpdates: number;
  themeUpdates: number;
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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

  const syncAllSites = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await fetchSites();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const totalUpdates = sites.reduce(
    (sum, site) => sum + site.pluginUpdates + site.themeUpdates,
    0
  );
  const onlineSites = sites.filter((s) => s.status === "online").length;
  const offlineSites = sites.filter((s) => s.status === "offline").length;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncAllSites} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync All"}
          </Button>
          <Button asChild>
            <Link href="/sites/new">Add Site</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Sites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold">{sites.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{onlineSites}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{offlineSites}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Updates Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{totalUpdates}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites List */}
      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500">No sites added yet.</p>
              <Button asChild className="mt-4">
                <Link href="/sites/new">Add Your First Site</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sites.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{site.name}</p>
                    <p className="text-sm text-slate-500">{site.url}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {site.pluginUpdates + site.themeUpdates > 0 && (
                      <Badge variant="warning">
                        {site.pluginUpdates + site.themeUpdates} updates
                      </Badge>
                    )}
                    <Badge
                      variant={
                        site.status === "online"
                          ? "success"
                          : site.status === "offline"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {site.status}
                    </Badge>
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
