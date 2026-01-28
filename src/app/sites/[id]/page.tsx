"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Package,
  Palette,
  Settings,
  Globe,
  Heart,
  Server,
} from "lucide-react";

interface Plugin {
  id: number;
  name: string;
  slug: string;
  version: string;
  updateAvailable: boolean;
  newVersion: string | null;
  isActive: boolean;
}

interface Theme {
  id: number;
  name: string;
  slug: string;
  version: string;
  updateAvailable: boolean;
  newVersion: string | null;
  isActive: boolean;
}

interface Site {
  id: number;
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  wpVersion: string | null;
  phpVersion: string | null;
  sslExpiry: string | null;
  lastChecked: string | null;
  notes: string | null;
  serverId: number | null;
  serverName: string | null;
  serverIp: string | null;
  providerName: string | null;
  providerSlug: string | null;
  providerLogo: string | null;
  plugins: Plugin[];
  themes: Theme[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-slate-400",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const fetchSite = async () => {
    try {
      const res = await fetch(`/api/sites/${id}`);
      const data = await res.json();
      setSite(data);
    } catch (error) {
      console.error("Failed to fetch site:", error);
      toast.error("Failed to load site");
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      await fetch(`/api/sites/${id}/health`);
      await fetchSite();
      toast.success("Health check complete");
    } catch (error) {
      console.error("Health check failed:", error);
      toast.error("Health check failed");
    } finally {
      setCheckingHealth(false);
    }
  };

  const syncPlugins = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/sites/${id}/plugins`);
      await fetchSite();
      toast.success("Sync complete");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSite();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Site not found</p>
      </div>
    );
  }

  const pluginsWithUpdates = site.plugins.filter((p) => p.updateAvailable);
  const themesWithUpdates = site.themes.filter((t) => t.updateAvailable);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
            <Globe className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              {site.url}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={checkHealth}
            disabled={checkingHealth}
          >
            <Heart className={`mr-2 h-4 w-4 ${checkingHealth ? "animate-pulse" : ""}`} />
            {checkingHealth ? "Checking..." : "Health Check"}
          </Button>
          <Button variant="outline" onClick={syncPlugins} disabled={syncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/sites/${id}/edit`}>
              <Settings className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Server Info Banner */}
      {site.serverId && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <Link
              href={`/servers/${site.serverId}`}
              className="flex items-center justify-between hover:bg-slate-50 -mx-6 px-6 py-2 rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                {site.providerLogo ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border p-1">
                    <img
                      src={site.providerLogo}
                      alt={site.providerName || ""}
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Server className="h-5 w-5 text-slate-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{site.serverName}</p>
                  <p className="text-sm text-muted-foreground">
                    {site.providerName || "Custom Server"}
                    {site.serverIp && ` • ${site.serverIp}`}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">View Server</Badge>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-2 flex items-center gap-2">
                  {site.status === "online" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-2xl font-semibold capitalize">
                    {site.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <StatCard
          title="WordPress"
          value={site.wpVersion || "Unknown"}
          icon={Globe}
          iconColor="text-blue-500"
        />

        <StatCard
          title="Plugin Updates"
          value={pluginsWithUpdates.length}
          icon={Package}
          iconColor={pluginsWithUpdates.length > 0 ? "text-amber-500" : "text-slate-400"}
        />

        <StatCard
          title="Theme Updates"
          value={themesWithUpdates.length}
          icon={Palette}
          iconColor={themesWithUpdates.length > 0 ? "text-amber-500" : "text-slate-400"}
        />
      </div>

      {/* Notes */}
      {site.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{site.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Plugins */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Plugins ({site.plugins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {site.plugins.length === 0 ? (
            <p className="text-muted-foreground">
              No plugins synced yet. Click Sync to fetch plugins.
            </p>
          ) : (
            <div className="divide-y">
              {site.plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">{plugin.name}</p>
                    <p className="text-sm text-muted-foreground">
                      v{plugin.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {plugin.updateAvailable && (
                      <Badge variant="warning">
                        Update to {plugin.newVersion}
                      </Badge>
                    )}
                    <Badge variant={plugin.isActive ? "success" : "secondary"}>
                      {plugin.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Themes ({site.themes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {site.themes.length === 0 ? (
            <p className="text-muted-foreground">
              No themes synced yet. Click Sync to fetch themes.
            </p>
          ) : (
            <div className="divide-y">
              {site.themes.map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-sm text-muted-foreground">
                      v{theme.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {theme.updateAvailable && (
                      <Badge variant="warning">
                        Update to {theme.newVersion}
                      </Badge>
                    )}
                    <Badge variant={theme.isActive ? "success" : "secondary"}>
                      {theme.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
