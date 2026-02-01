"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Palette, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
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
  const [updateProgress, setUpdateProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

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

  const toggleAll = (updates: PendingUpdate[]) => {
    if (selected.size === updates.length && updates.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(updates.map((u) => u.id)));
    }
  };

  const getFilteredUpdates = () => {
    if (!data) return [];
    if (activeTab === "plugins") return data.updates.filter((u) => u.type === "plugin");
    if (activeTab === "themes") return data.updates.filter((u) => u.type === "theme");
    return data.updates;
  };

  const applyUpdates = async () => {
    if (selected.size === 0 || !data) return;
    setShowConfirmDialog(false);
    setUpdating(true);
    setUpdateProgress(0);

    try {
      const selectedUpdates = data.updates.filter((u) => selected.has(u.id));
      const total = selectedUpdates.length;

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

      // Simulate progress (in real implementation, this would be websocket/SSE)
      const progressInterval = setInterval(() => {
        setUpdateProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Apply updates via bulk API
      await fetch("/api/updates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatesBySite }),
      });

      clearInterval(progressInterval);
      setUpdateProgress(100);

      // Brief delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh data
      setSelected(new Set());
      await fetchUpdates();
    } catch (error) {
      console.error("Failed to apply updates:", error);
    } finally {
      setUpdating(false);
      setUpdateProgress(0);
    }
  };

  const summary = data?.summary;
  const filteredUpdates = getFilteredUpdates();
  const selectedInView = filteredUpdates.filter((u) => selected.has(u.id)).length;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Updates</h1>
            <p className="text-muted-foreground">
              Manage plugin and theme updates across all sites
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUpdates} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={selected.size === 0 || updating}
                >
                  {updating ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Update Selected ({selected.size})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Apply all selected updates</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Progress bar when updating */}
        {updating && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Applying updates...</span>
                  <span>{updateProgress}%</span>
                </div>
                <Progress value={updateProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Updates pending across all sites</p>
                </TooltipContent>
              </Tooltip>
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
              <Tooltip>
                <TooltipTrigger>
                  <Package className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>WordPress plugin updates available</p>
                </TooltipContent>
              </Tooltip>
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
              <Tooltip>
                <TooltipTrigger>
                  <Palette className="h-4 w-4 text-purple-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>WordPress theme updates available</p>
                </TooltipContent>
              </Tooltip>
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

        {/* Updates Table with Tabs */}
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
            ) : data?.updates.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-semibold">All up to date!</h3>
                <p className="text-muted-foreground">
                  No pending updates across your sites.
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    All ({data?.updates.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="plugins">
                    <Package className="mr-1 h-3 w-3" />
                    Plugins ({summary?.pluginUpdates || 0})
                  </TabsTrigger>
                  <TabsTrigger value="themes">
                    <Palette className="mr-1 h-3 w-3" />
                    Themes ({summary?.themeUpdates || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              selectedInView === filteredUpdates.length &&
                              filteredUpdates.length > 0
                            }
                            onCheckedChange={() => toggleAll(filteredUpdates)}
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
                      {filteredUpdates.map((update) => (
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
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="success">{update.newVersion}</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Update from {update.currentVersion} to {update.newVersion}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                {update.isActive ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {update.isActive
                                    ? "Currently active on the site"
                                    : "Installed but not active"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Updates</DialogTitle>
              <DialogDescription>
                You are about to update {selected.size} item
                {selected.size !== 1 ? "s" : ""} across your WordPress sites.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This action will update the selected plugins and themes to their
                latest versions. Make sure you have backups before proceeding.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={applyUpdates}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Apply Updates
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
