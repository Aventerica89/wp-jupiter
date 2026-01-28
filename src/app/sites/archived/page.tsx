"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Archive,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Site {
  id: number;
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  pluginUpdates: number;
  themeUpdates: number;
  isArchived: boolean;
  lastChecked: string | null;
  serverName: string | null;
  providerName: string | null;
}

export default function ArchivedSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/sites?includeArchived=true");
      const data = await res.json();
      // Filter to only archived sites
      setSites(data.filter((s: Site) => s.isArchived));
    } catch (error) {
      console.error("Failed to fetch sites:", error);
      toast.error("Failed to load archived sites");
    } finally {
      setLoading(false);
    }
  };

  const unarchiveSite = async (id: number, name: string) => {
    try {
      await fetch(`/api/sites/${id}/archive`, { method: "POST" });
      setSites(sites.filter((s) => s.id !== id));
      toast.success("Site restored", {
        description: `${name} has been moved back to active sites.`,
      });
    } catch (error) {
      console.error("Failed to unarchive site:", error);
      toast.error("Failed to restore site");
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

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
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sites
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Archived Sites
            </h1>
            <p className="text-muted-foreground">
              {sites.length} archived site{sites.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Sites List */}
      {sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No archived sites.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/sites">View Active Sites</Link>
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
                        <Globe className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{site.name}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                          {site.url}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Archive className="mr-1 h-3 w-3" />
                      Archived
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {site.status === "online" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize">{site.status}</span>
                    {site.serverName && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>{site.serverName}</span>
                      </>
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
                  title="Open site"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    unarchiveSite(site.id, site.name);
                  }}
                  title="Restore site"
                >
                  <Archive className="h-4 w-4 text-amber-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
