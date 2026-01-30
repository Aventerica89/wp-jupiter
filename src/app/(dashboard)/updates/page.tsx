"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpdateTable } from "@/components/updates/update-table";
import { BulkUpdateDialog } from "@/components/updates/bulk-update-dialog";
import {
  RefreshCw,
  Package,
  Palette,
  Download,
  Globe,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";

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

interface UpdateSummary {
  totalUpdates: number;
  pluginUpdates: number;
  themeUpdates: number;
  siteCount: number;
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

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [summary, setSummary] = useState<UpdateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);

  const fetchUpdates = async () => {
    try {
      const res = await fetch("/api/updates");
      const data = await res.json();
      setUpdates(data.updates);
      setSummary(data.summary);
    } catch (error) {
      console.error("Failed to fetch updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await fetchUpdates();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const selectedUpdates = updates.filter((u) => selectedIds.has(u.id));

  if (loading) {
    return (
      <div className="p-8">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <SkeletonTable rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Updates</h1>
          <p className="text-muted-foreground">
            Manage and apply updates across all your sites
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={syncAll} disabled={syncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync All"}
          </Button>
          <Button
            onClick={() => setShowDialog(true)}
            disabled={selectedIds.size === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Update Selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {summary && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Updates"
            value={summary.totalUpdates}
            icon={AlertCircle}
            iconColor="text-amber-500"
          />
          <StatCard
            title="Plugin Updates"
            value={summary.pluginUpdates}
            icon={Package}
            iconColor="text-blue-500"
          />
          <StatCard
            title="Theme Updates"
            value={summary.themeUpdates}
            icon={Palette}
            iconColor="text-purple-500"
          />
          <StatCard
            title="Sites Affected"
            value={summary.siteCount}
            icon={Globe}
            iconColor="text-slate-400"
          />
        </div>
      )}

      {/* Updates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateTable
            updates={updates}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </CardContent>
      </Card>

      {/* Bulk Update Dialog */}
      {showDialog && (
        <BulkUpdateDialog
          updates={selectedUpdates.map((u) => ({
            siteId: u.siteId,
            siteName: u.siteName,
            type: u.type,
            slug: u.slug,
            name: u.name,
          }))}
          onClose={() => setShowDialog(false)}
          onComplete={() => {
            setSelectedIds(new Set());
            fetchUpdates();
          }}
        />
      )}
    </div>
  );
}
