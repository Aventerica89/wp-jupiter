"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  ExternalLink,
  Trash2,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { calculateUpdateCounts, type Site } from "@/lib/site-utils";

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

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteSite = async (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this site?")) return;

    try {
      await fetch(`/api/sites/${id}`, { method: "DELETE" });
      setSites(sites.filter((s) => s.id !== id));
      toast.success("Site deleted", {
        description: `${name} has been removed.`,
      });
    } catch (error) {
      console.error("Failed to delete site:", error);
      toast.error("Failed to delete site");
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Use TDD utility for calculations
  const counts = calculateUpdateCounts(sites);

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
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            Manage your WordPress sites
          </p>
        </div>
        <Button asChild>
          <Link href="/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Link>
        </Button>
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

      {/* Sites Grid */}
      {sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sites added yet.</p>
            <Button asChild className="mt-4">
              <Link href="/sites/new">Add Your First Site</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="group relative">
              <Link href={`/sites/${site.id}`} className="block">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Globe className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{site.name}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                          {site.url}
                        </p>
                      </div>
                    </div>
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
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {site.pluginUpdates > 0 && (
                      <Badge variant="warning">
                        {site.pluginUpdates} plugin{site.pluginUpdates !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {site.themeUpdates > 0 && (
                      <Badge variant="warning">
                        {site.themeUpdates} theme{site.themeUpdates !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {site.pluginUpdates === 0 && site.themeUpdates === 0 && (
                      <span className="text-sm text-muted-foreground">Up to date</span>
                    )}
                  </div>
                </CardContent>
              </Link>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(site.url, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={(e) => deleteSite(site.id, site.name, e)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
