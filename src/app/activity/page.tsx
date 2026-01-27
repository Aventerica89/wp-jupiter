"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  Settings,
  Trash2,
  RefreshCcw,
  Heart,
  Package,
  Palette,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface ActivityLog {
  id: number;
  siteId: number | null;
  siteName: string | null;
  siteUrl: string | null;
  action: string;
  status: "success" | "failed" | "info";
  details: string | null;
  createdAt: string;
}

interface ActivityResponse {
  logs: ActivityLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const actionIcons: Record<string, React.ReactNode> = {
  site_added: <Plus className="h-4 w-4" />,
  site_updated: <Settings className="h-4 w-4" />,
  site_deleted: <Trash2 className="h-4 w-4" />,
  site_sync: <RefreshCcw className="h-4 w-4" />,
  health_check: <Heart className="h-4 w-4" />,
  plugin_updated: <Package className="h-4 w-4" />,
  theme_updated: <Palette className="h-4 w-4" />,
  bulk_update_started: <RefreshCw className="h-4 w-4" />,
  bulk_update_completed: <CheckCircle className="h-4 w-4" />,
  error: <AlertTriangle className="h-4 w-4" />,
};

const actionLabels: Record<string, string> = {
  site_added: "Site Added",
  site_updated: "Site Updated",
  site_deleted: "Site Deleted",
  site_sync: "Site Synced",
  health_check: "Health Check",
  plugin_updated: "Plugin Updated",
  theme_updated: "Theme Updated",
  bulk_update_started: "Bulk Update Started",
  bulk_update_completed: "Bulk Update Completed",
  error: "Error",
};

const statusConfig = {
  success: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default function ActivityPage() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/activity?limit=100");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Loading activity...</p>
      </div>
    );
  }

  const logs = data?.logs || [];

  // Group logs by date
  const groupedLogs = logs.reduce<Record<string, ActivityLog[]>>((acc, log) => {
    const date = new Date(log.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  // Count by status
  const statusCounts = logs.reduce(
    (acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500">
            Track all actions across your sites
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchActivity(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold">{data?.pagination.total || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                {statusCounts.success || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">
                {statusCounts.failed || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No activity logged yet. Actions like syncing sites, health checks,
              and updates will appear here.
            </p>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date}>
                  <h3 className="mb-4 text-sm font-medium text-slate-500">
                    {date}
                  </h3>
                  <div className="space-y-4">
                    {dayLogs.map((log) => {
                      const config = statusConfig[log.status];
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-4 rounded-lg border border-slate-100 p-4"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor} ${config.color}`}
                          >
                            {actionIcons[log.action] || (
                              <Activity className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {actionLabels[log.action] || log.action}
                              </span>
                              <Badge
                                variant={
                                  log.status === "success"
                                    ? "success"
                                    : log.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {log.status}
                              </Badge>
                            </div>
                            {log.details && (
                              <p className="mt-1 text-sm text-slate-600">
                                {log.details}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                              <span>{formatRelativeTime(log.createdAt)}</span>
                              {log.siteName && (
                                <Link
                                  href={`/sites/${log.siteId}`}
                                  className="flex items-center gap-1 hover:text-blue-600"
                                >
                                  {log.siteName}
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
