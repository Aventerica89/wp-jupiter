"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  Palette,
  Settings,
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
  plugins: Plugin[];
  themes: Theme[];
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
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      await fetch(`/api/sites/${id}/health`);
      await fetchSite();
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setCheckingHealth(false);
    }
  };

  const syncPlugins = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/sites/${id}/plugins`);
      await fetchSite();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSite();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Site not found</p>
      </div>
    );
  }

  const pluginsWithUpdates = site.plugins.filter((p) => p.updateAvailable);
  const themesWithUpdates = site.themes.filter((t) => t.updateAvailable);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/sites"
          className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Sites
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{site.name}</h1>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              {site.url}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={checkHealth}
              disabled={checkingHealth}
            >
              {checkingHealth ? "Checking..." : "Check Health"}
            </Button>
            <Button variant="outline" onClick={syncPlugins} disabled={syncing}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync"}
            </Button>
            <Link href={`/sites/${id}/edit`}>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {site.status === "online" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-semibold capitalize">{site.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              WordPress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-semibold">
              {site.wpVersion || "Unknown"}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Plugin Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-400" />
              <span className="font-semibold">{pluginsWithUpdates.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Theme Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-slate-400" />
              <span className="font-semibold">{themesWithUpdates.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <p className="text-slate-500">
              No plugins synced yet. Click Sync to fetch plugins.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {site.plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{plugin.name}</p>
                    <p className="text-sm text-slate-500">v{plugin.version}</p>
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
            <p className="text-slate-500">
              No themes synced yet. Click Sync to fetch themes.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {site.themes.map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{theme.name}</p>
                    <p className="text-sm text-slate-500">v{theme.version}</p>
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
