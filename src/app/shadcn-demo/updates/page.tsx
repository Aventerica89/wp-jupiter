"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Palette, RefreshCw, CheckCircle } from "lucide-react";
import Link from "next/link";

interface PendingUpdate {
  id: string;
  siteId: number;
  siteName: string;
  siteUrl: string;
  type: "plugin" | "theme";
  name: string;
  slug: string;
  currentVersion: string;
  newVersion: string;
  isActive: boolean;
}

interface UpdatesResponse {
  updates: PendingUpdate[];
  summary: {
    totalUpdates: number;
    pluginUpdates: number;
    themeUpdates: number;
    siteCount: number;
  };
}

export default function UpdatesPage() {
  const [data, setData] = useState<UpdatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);

  const fetchUpdates = async () => {
    try {
      const res = await fetch("/api/updates");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch updates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const toggleSelected = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.updates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.updates.map((u) => u.id)));
    }
  };

  const applyUpdates = async () => {
    if (selected.size === 0 || !data) return;
    setUpdating(true);

    try {
      const selectedUpdates = data.updates.filter((u) => selected.has(u.id));

      // Group updates by site
      const updatesBySite = selectedUpdates.reduce(
        (acc, update) => {
          if (!acc[update.siteId]) {
            acc[update.siteId] = { plugins: [], themes: [] };
          }
          if (update.type === "plugin") {
            acc[update.siteId].plugins.push(update.slug);
          } else {
            acc[update.siteId].themes.push(update.slug);
          }
          return acc;
        },
        {} as Record<number, { plugins: string[]; themes: string[] }>
      );

      // Apply updates via bulk API
      await fetch("/api/updates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatesBySite }),
      });

      // Refresh data
      setSelected(new Set());
      await fetchUpdates();
    } catch (error) {
      console.error("Failed to apply updates:", error);
    } finally {
      setUpdating(false);
    }
  };

  const summary = data?.summary;
  const updates = data?.updates || [];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Updates</h1>
          <p className="text-muted-foreground">
            Manage plugin and theme updates across all sites
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchUpdates}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={applyUpdates}
            disabled={selected.size === 0 || updating}
          >
            {updating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Update Selected ({selected.size})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalUpdates || 0}</div>
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
                {summary?.pluginUpdates || 0}
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
                {summary?.themeUpdates || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Affected</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.siteCount || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Updates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-semibold">All up to date!</h3>
              <p className="text-muted-foreground">
                No pending updates across your sites.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selected.size === updates.length && updates.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.map((update) => (
                  <TableRow key={update.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(update.id)}
                        onCheckedChange={() => toggleSelected(update.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{update.name}</TableCell>
                    <TableCell>
                      {update.type === "plugin" ? (
                        <Badge variant="secondary">
                          <Package className="mr-1 h-3 w-3" />
                          Plugin
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Palette className="mr-1 h-3 w-3" />
                          Theme
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/sites/${update.siteId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {update.siteName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {update.currentVersion}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{update.newVersion}</Badge>
                    </TableCell>
                    <TableCell>
                      {update.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
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
