"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRelativeTime, calculateUpdateCounts, type Site } from "@/lib/site-utils";
import { calculateHealthScore, type SiteHealth } from "@/lib/business-logic";

interface SiteWithHealth extends Site {
  wpVersion: string | null;
  lastChecked: string | null;
  sslValid?: boolean;
  sslExpiry?: string | null;
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

const CHART_COLORS = {
  online: "#22c55e",
  offline: "#ef4444",
  unknown: "#94a3b8",
  plugins: "#3b82f6",
  themes: "#a855f7",
};

export default function DashboardPage() {
  const [sites, setSites] = useState<SiteWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/sites");
      const data = await res.json();
      setSites(data);
    } catch (error) {
      console.error("Failed to fetch sites:", error);
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  const syncAllSites = async () => {
    setSyncing(true);
    toast.loading("Syncing all sites...", { id: "sync" });
    try {
      await fetch("/api/sync", { method: "POST" });
      await fetchSites();
      toast.success("All sites synced", { id: "sync" });
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Sync failed", { id: "sync" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Use TDD utility for calculations
  const counts = calculateUpdateCounts(sites);

  // Prepare chart data
  const statusChartData = [
    { name: "Online", value: counts.sitesOnline, color: CHART_COLORS.online },
    { name: "Offline", value: counts.sitesOffline, color: CHART_COLORS.offline },
    { name: "Unknown", value: sites.length - counts.sitesOnline - counts.sitesOffline, color: CHART_COLORS.unknown },
  ].filter((d) => d.value > 0);

  const updateChartData = [
    { name: "Plugins", value: counts.pluginUpdates, color: CHART_COLORS.plugins },
    { name: "Themes", value: counts.themeUpdates, color: CHART_COLORS.themes },
  ];

  // Calculate health scores for top sites
  const sitesWithHealth = sites.map((site) => {
    const health: SiteHealth = {
      status: site.status,
      sslValid: site.sslValid ?? true,
      sslExpiry: site.sslExpiry ? new Date(site.sslExpiry) : null,
      lastChecked: site.lastChecked ? new Date(site.lastChecked) : null,
      pluginUpdates: site.pluginUpdates,
      themeUpdates: site.themeUpdates,
    };
    return {
      ...site,
      healthScore: calculateHealthScore(health),
    };
  });

  // Top sites needing attention (lowest health scores)
  const sitesNeedingAttention = [...sitesWithHealth]
    .filter((s) => s.healthScore < 80)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

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
          value={counts.sitesOnline}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
        <StatCard
          title="Offline"
          value={counts.sitesOffline}
          icon={XCircle}
          iconColor="text-red-500"
        />
        <StatCard
          title="Updates Available"
          value={counts.totalUpdates}
          icon={AlertCircle}
          iconColor="text-amber-500"
        />
      </div>

      {/* Charts Row */}
      {sites.length > 0 && (
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                {statusChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Updates by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={updateChartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={60} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {updateChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Plugin Updates</span>
                  <span className="font-medium">{counts.pluginUpdates}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span>Theme Updates</span>
                  <span className="font-medium">{counts.themeUpdates}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sites Needing Attention */}
      {sitesNeedingAttention.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <CardTitle>Sites Needing Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {sitesNeedingAttention.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-6 px-6 transition-colors first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Globe className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Health: {site.healthScore}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        site.healthScore < 50
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {site.healthScore < 50 ? "Critical" : "Warning"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <p className="text-sm text-muted-foreground">
                        Checked {formatRelativeTime(site.lastChecked)}
                      </p>
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
    </div>
  );
}
