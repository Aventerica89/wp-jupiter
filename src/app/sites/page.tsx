"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Trash2 } from "lucide-react";

interface Site {
  id: number;
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  wpVersion: string | null;
  pluginUpdates: number;
  themeUpdates: number;
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
    } finally {
      setLoading(false);
    }
  };

  const deleteSite = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this site?")) return;

    try {
      await fetch(`/api/sites/${id}`, { method: "DELETE" });
      setSites(sites.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete site:", error);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-900">Sites</h1>
        <Button asChild>
          <a href="/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </a>
        </Button>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No sites added yet.</p>
            <Button asChild className="mt-4">
              <a href="/sites/new">Add Your First Site</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="group relative">
              <a href={`/sites/${site.id}`} className="block">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{site.name}</CardTitle>
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
                  <p className="mb-4 text-sm text-slate-500 truncate">
                    {site.url}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {site.pluginUpdates > 0 && (
                        <Badge variant="warning">
                          {site.pluginUpdates} plugin updates
                        </Badge>
                      )}
                      {site.themeUpdates > 0 && (
                        <Badge variant="warning">
                          {site.themeUpdates} theme updates
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </a>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(site.url, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => deleteSite(site.id, e)}
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
