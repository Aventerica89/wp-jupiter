"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, MoreHorizontal, RefreshCw, ExternalLink } from "lucide-react";
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

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);

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

  useEffect(() => {
    fetchSites();
  }, []);

  const syncSite = async (siteId: number) => {
    setSyncing(siteId);
    try {
      await fetch(`/api/sites/${siteId}/plugins`);
      await fetchSites();
    } catch (error) {
      console.error("Failed to sync site:", error);
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-muted-foreground">
            Manage your WordPress sites
          </p>
        </div>
        <Button asChild>
          <Link href="/sites/new">
            <Globe className="mr-2 h-4 w-4" />
            Add Site
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No sites yet</h3>
              <p className="text-muted-foreground">
                Add your first WordPress site to get started.
              </p>
              <Button asChild className="mt-4">
                <Link href="/sites/new">Add Site</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WP Version</TableHead>
                  <TableHead>Updates</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            site.status === "online"
                              ? "bg-green-500"
                              : site.status === "offline"
                                ? "bg-red-500"
                                : "bg-gray-400"
                          }`}
                        />
                        <div>
                          <Link
                            href={`/sites/${site.id}`}
                            className="font-medium hover:underline"
                          >
                            {site.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {site.url}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.status === "online" ? (
                        <Badge variant="success">Online</Badge>
                      ) : site.status === "offline" ? (
                        <Badge variant="destructive">Offline</Badge>
                      ) : (
                        <Badge variant="secondary">Unknown</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {site.wpVersion || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {site.pluginUpdates > 0 && (
                          <Badge variant="secondary">
                            {site.pluginUpdates} plugins
                          </Badge>
                        )}
                        {site.themeUpdates > 0 && (
                          <Badge variant="outline">
                            {site.themeUpdates} themes
                          </Badge>
                        )}
                        {site.pluginUpdates === 0 && site.themeUpdates === 0 && (
                          <span className="text-muted-foreground text-sm">
                            Up to date
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(site.lastChecked)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/sites/${site.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => syncSite(site.id)}
                            disabled={syncing === site.id}
                          >
                            <RefreshCw
                              className={`mr-2 h-4 w-4 ${
                                syncing === site.id ? "animate-spin" : ""
                              }`}
                            />
                            Sync Now
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Visit Site
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
