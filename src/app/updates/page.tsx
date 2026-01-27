"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpdateTable } from "@/components/updates/update-table";
import { BulkUpdateDialog } from "@/components/updates/bulk-update-dialog";
import {
  RefreshCw,
  Package,
  Palette,
  ArrowLeft,
  Download,
  Globe,
} from "lucide-react";

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">Loading updates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Available Updates
            </h1>
            <p className="mt-1 text-slate-500">
              Manage and apply updates across all your sites
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncAll} disabled={syncing}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync All Sites"}
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
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{summary.totalUpdates}</span>
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
                <span className="text-2xl font-bold">
                  {summary.pluginUpdates}
                </span>
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
                <span className="text-2xl font-bold">
                  {summary.themeUpdates}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Sites Affected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-slate-400" />
                <span className="text-2xl font-bold">{summary.siteCount}</span>
              </div>
            </CardContent>
          </Card>
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
