"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  MoreHorizontal,
  RefreshCw,
  ExternalLink,
  Package,
  Palette,
  Clock,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

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
    setSyncProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
    }, 200);

    try {
      await fetch(`/api/sites/${siteId}/plugins`);
      clearInterval(progressInterval);
      setSyncProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));
      await fetchSites();
    } catch (error) {
      console.error("Failed to sync site:", error);
    } finally {
      clearInterval(progressInterval);
      setSyncing(null);
      setSyncProgress(0);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openSiteDetails = (site: Site) => {
    setSelectedSite(site);
    setSheetOpen(true);
  };

  const filteredSites = sites.filter((site) => {
    if (statusFilter === "all") return true;
    return site.status === statusFilter;
  });

  const statusCounts = {
    all: sites.length,
    online: sites.filter((s) => s.status === "online").length,
    offline: sites.filter((s) => s.status === "offline").length,
    unknown: sites.filter((s) => s.status !== "online" && s.status !== "offline").length,
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sites</h1>
            <p className="text-muted-foreground">Manage your WordPress sites</p>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites ({statusCounts.all})</SelectItem>
                <SelectItem value="online">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Online ({statusCounts.online})
                  </span>
                </SelectItem>
                <SelectItem value="offline">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Offline ({statusCounts.offline})
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button asChild>
              <Link href="/sites/new">
                <Globe className="mr-2 h-4 w-4" />
                Add Site
              </Link>
            </Button>
          </div>
        </div>

        {/* Sync Progress */}
        {syncing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Syncing site...</span>
                  <span>{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} />
              </div>
            </CardContent>
          </Card>
        )}

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
            ) : filteredSites.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  {statusFilter === "all" ? "No sites yet" : "No sites match filter"}
                </h3>
                <p className="text-muted-foreground">
                  {statusFilter === "all"
                    ? "Add your first WordPress site to get started."
                    : "Try changing the filter to see more sites."}
                </p>
                {statusFilter === "all" && (
                  <Button asChild className="mt-4">
                    <Link href="/sites/new">Add Site</Link>
                  </Button>
                )}
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
                  {filteredSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  site.status === "online"
                                    ? "bg-green-500"
                                    : site.status === "offline"
                                      ? "bg-red-500"
                                      : "bg-gray-400"
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {site.status === "online"
                                  ? "Site is online and responding"
                                  : site.status === "offline"
                                    ? "Site is not responding"
                                    : "Status unknown"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <div>
                            <button
                              onClick={() => openSiteDetails(site)}
                              className="font-medium hover:underline text-left"
                            >
                              {site.name}
                            </button>
                            <p className="text-sm text-muted-foreground">{site.url}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {site.status === "online" ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="success">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Online
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Site responded to health check</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : site.status === "offline" ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Offline
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Site did not respond to health check</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant="secondary">Unknown</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-muted-foreground">
                              {site.wpVersion || "Unknown"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>WordPress version installed</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {site.pluginUpdates > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary">
                                  <Package className="mr-1 h-3 w-3" />
                                  {site.pluginUpdates}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{site.pluginUpdates} plugin updates available</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {site.themeUpdates > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline">
                                  <Palette className="mr-1 h-3 w-3" />
                                  {site.themeUpdates}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{site.themeUpdates} theme updates available</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {site.pluginUpdates === 0 && site.themeUpdates === 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-muted-foreground text-sm flex items-center">
                                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                                  Up to date
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>All plugins and themes are current</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-muted-foreground flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatDate(site.lastChecked)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Last synchronized with WordPress</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openSiteDetails(site)}>
                              <Info className="mr-2 h-4 w-4" />
                              View Details
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

        {/* Site Details Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{selectedSite?.name}</SheetTitle>
              <SheetDescription>{selectedSite?.url}</SheetDescription>
            </SheetHeader>

            {selectedSite && (
              <div className="py-6 space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="flex items-center gap-2">
                    {selectedSite.status === "online" ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-600">Online</span>
                      </>
                    ) : selectedSite.status === "offline" ? (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-600">Offline</span>
                      </>
                    ) : (
                      <>
                        <Info className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-600">Unknown</span>
                      </>
                    )}
                  </div>
                </div>

                {/* WordPress Version */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    WordPress Version
                  </h4>
                  <p className="font-medium">{selectedSite.wpVersion || "Unknown"}</p>
                </div>

                {/* Updates Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Updates</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Plugins</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {selectedSite.pluginUpdates}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Themes</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {selectedSite.themeUpdates}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last Synced */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Last Synced
                  </h4>
                  <p className="font-medium">{formatDate(selectedSite.lastChecked)}</p>
                </div>
              </div>
            )}

            <SheetFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => selectedSite && syncSite(selectedSite.id)}
                disabled={syncing === selectedSite?.id}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    syncing === selectedSite?.id ? "animate-spin" : ""
                  }`}
                />
                Sync Now
              </Button>
              <Button asChild className="w-full">
                <Link href={`/sites/${selectedSite?.id}`}>View Full Details</Link>
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
