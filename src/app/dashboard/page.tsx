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
  ArrowRight,
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

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-slate-400",
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
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
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your WordPress sites
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={syncAllSites} disabled={syncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync All"}
          </Button>
          <Button asChild>
            <Link href="/sites/new">Add Site</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sites"
          value={sites.length}
          icon={Globe}
          iconColor="text-slate-400"
        />
        <StatCard
          title="Online"
          value={onlineSites}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
        <StatCard
          title="Offline"
          value={offlineSites}
          icon={XCircle}
          iconColor="text-red-500"
        />
        <StatCard
          title="Updates Available"
          value={totalUpdates}
          icon={AlertCircle}
          iconColor="text-amber-500"
        />
      </div>

      {/* Recent Sites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Sites</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sites">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No sites added yet.</p>
              <Button asChild className="mt-4">
                <Link href="/sites/new">Add Your First Site</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {sites.slice(0, 5).map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Globe className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-muted-foreground">{site.url}</p>
                    </div>
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

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {sites.length === 0
              ? "Add your first WordPress site to get started."
              : `Manage ${sites.length} site${sites.length !== 1 ? "s" : ""} from your dashboard.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
