"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  ExternalLink,
  Trash2,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Archive,
  FileDown,
  Search,
  Filter,
  X,
  Tag as TagIcon,
  RefreshCw,
  ArchiveRestore,
} from "lucide-react";
import { calculateUpdateCounts, type Site } from "@/lib/site-utils";
import { Skeleton, SkeletonCard, SkeletonSiteCard } from "@/components/ui/skeleton";

interface SiteWithTags extends Site {
  tags?: Array<{ id: number; name: string; color: string }>;
}

interface Tag {
  id: number;
  name: string;
  color: string;
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

export default function SitesPage() {
  const [sites, setSites] = useState<SiteWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  useEffect(() => {
    fetchSites();
    fetchTags();
  }, []);

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

  const toggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sites/${id}/favorite`, { method: "POST" });
      const data = await res.json();
      setSites(sites.map((s) =>
        s.id === id ? { ...s, isFavorite: data.isFavorite } : s
      ).sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      }));
      toast.success(data.isFavorite ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite");
    }
  };

  const archiveSite = async (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/sites/${id}/archive`, { method: "POST" });
      setSites(sites.filter((s) => s.id !== id));
      toast.success("Site archived", {
        description: `${name} has been archived.`,
      });
    } catch (error) {
      console.error("Failed to archive site:", error);
      toast.error("Failed to archive site");
    }
  };

  const toggleSelectSite = (siteId: number) => {
    setSelectedSites(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSites.length === filteredSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(filteredSites.map(s => s.id));
    }
  };

  const executeBulkAction = async (action: string, params?: any) => {
    if (selectedSites.length === 0) {
      toast.error("No sites selected");
      return;
    }

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/sites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          siteIds: selectedSites,
          ...params,
        }),
      });

      if (!res.ok) throw new Error("Bulk action failed");

      const result = await res.json();
      toast.success(`Bulk action completed`, {
        description: `${result.results.success} sites updated successfully`,
      });

      setSelectedSites([]);
      fetchSites();
    } catch (error) {
      console.error("Bulk action failed:", error);
      toast.error("Bulk action failed");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Filter sites
  const filteredSites = sites.filter(site => {
    // Search filter
    if (searchQuery && !site.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !site.url.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && site.status !== statusFilter) {
      return false;
    }

    // Tag filter
    if (tagFilter !== "all") {
      const hasTag = site.tags?.some(t => t.id === parseInt(tagFilter));
      if (!hasTag) return false;
    }

    return true;
  });

  // Use TDD utility for calculations
  const counts = calculateUpdateCounts(filteredSites);

  if (loading) {
    return (
      <div className="p-8">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Search/Filter Skeleton */}
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Sites Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonSiteCard />
          <SkeletonSiteCard />
          <SkeletonSiteCard />
          <SkeletonSiteCard />
          <SkeletonSiteCard />
          <SkeletonSiteCard />
        </div>
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link href="/tags">
              <TagIcon className="mr-2 h-4 w-4" />
              Manage Tags
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link href="/sites/archived">
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex" asChild>
            <a href="/api/sites/export?format=csv" download>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sites/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Site</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || statusFilter !== "all" || tagFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTagFilter("all");
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedSites.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-blue-900 text-sm sm:text-base">
                  {selectedSites.length} site{selectedSites.length !== 1 ? "s" : ""} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleSelectAll}
                  className="text-xs sm:text-sm"
                >
                  {selectedSites.length === filteredSites.length ? "Deselect" : "Select All"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeBulkAction("sync")}
                  disabled={bulkActionLoading}
                  title="Sync selected sites"
                >
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sync</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeBulkAction("favorite")}
                  disabled={bulkActionLoading}
                  title="Favorite selected sites"
                >
                  <Star className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Favorite</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeBulkAction("archive")}
                  disabled={bulkActionLoading}
                  title="Archive selected sites"
                >
                  <Archive className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Archive</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const tagId = prompt("Enter tag ID to add:");
                    if (tagId) executeBulkAction("addTag", { tagId: parseInt(tagId) });
                  }}
                  disabled={bulkActionLoading}
                  title="Add tag to selected sites"
                  className="hidden md:flex"
                >
                  <TagIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Tag</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete ${selectedSites.length} sites?`)) {
                      executeBulkAction("delete");
                    }
                  }}
                  disabled={bulkActionLoading}
                  title="Delete selected sites"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sites"
          value={filteredSites.length}
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
      {filteredSites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              {sites.length === 0 ? (
                <Globe className="h-8 w-8 text-slate-400" />
              ) : (
                <Search className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">
              {sites.length === 0 ? "No sites yet" : "No matching sites"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {sites.length === 0
                ? "Add your first WordPress site to start monitoring and managing it from one place."
                : "Try adjusting your search or filter criteria to find what you're looking for."}
            </p>
            {sites.length === 0 ? (
              <Button asChild>
                <Link href="/sites/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Site
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTagFilter("all");
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site) => (
            <Card key={site.id} className="group relative">
              {/* Checkbox for selection */}
              <div className="absolute left-3 top-3 z-10">
                <Checkbox
                  checked={selectedSites.includes(site.id)}
                  onCheckedChange={() => toggleSelectSite(site.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <Link href={`/sites/${site.id}`} className="block">
                <CardHeader className="pl-12">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Globe className="h-5 w-5 text-slate-600" />
                        {site.isFavorite && (
                          <Star className="absolute -top-1 -right-1 h-4 w-4 fill-amber-400 text-amber-400" />
                        )}
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
                  <div className="mb-3 flex flex-wrap items-center gap-2">
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
                  {/* Tags */}
                  {site.tags && site.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {site.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          style={{
                            backgroundColor: tag.color,
                            color: "#fff",
                            fontSize: "0.7rem",
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Link>
              <div className="absolute right-2 top-2 flex gap-0.5 rounded-lg bg-white/80 backdrop-blur-sm p-0.5 shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={site.isFavorite ? `Remove ${site.name} from favorites` : `Add ${site.name} to favorites`}
                  onClick={(e) => toggleFavorite(site.id, e)}
                >
                  <Star className={`h-3.5 w-3.5 ${site.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`Open ${site.name} in new tab`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(site.url, "_blank");
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`Archive ${site.name}`}
                  onClick={(e) => archiveSite(site.id, site.name, e)}
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`Delete ${site.name}`}
                  onClick={(e) => deleteSite(site.id, site.name, e)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
