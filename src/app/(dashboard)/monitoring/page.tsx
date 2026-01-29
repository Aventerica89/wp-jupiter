"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
} from "lucide-react";

interface Site {
  id: number;
  name: string;
  url: string;
  status: string;
}

interface UptimeStats {
  siteId: number;
  siteName: string;
  uptimePercentage: number;
  avgResponseTime: number;
  totalChecks: number;
  downChecks: number;
}

export default function MonitoringPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [uptimeStats, setUptimeStats] = useState<UptimeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchData = async () => {
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

  useEffect(() => {
    fetchData();
  }, []);

  const runUptimeCheck = async () => {
    setChecking(true);
    toast.loading("Running uptime checks...", { id: "uptime-check" });

    try {
      const res = await fetch("/api/uptime/check", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      toast.success(`Checked ${data.checked} sites`, { id: "uptime-check" });
      fetchData();
    } catch (error) {
      console.error("Uptime check failed:", error);
      toast.error("Uptime check failed", { id: "uptime-check" });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const onlineSites = sites.filter((s) => s.status === "online").length;
  const offlineSites = sites.filter((s) => s.status === "offline").length;
  const uptimePercentage =
    sites.length > 0 ? ((onlineSites / sites.length) * 100).toFixed(1) : "0";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">
            Uptime, performance, and security monitoring
          </p>
        </div>
        <Button onClick={runUptimeCheck} disabled={checking}>
          <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          Run Check
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Uptime
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {uptimePercentage}%
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Online Sites
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {onlineSites}
                </p>
              </div>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Offline Sites
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {offlineSites}
                </p>
              </div>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Response
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  --<span className="text-lg">ms</span>
                </p>
              </div>
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Site Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sites.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No sites added yet.
              </p>
            ) : (
              sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-muted-foreground">{site.url}</p>
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
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Sections */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Scanning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automated security vulnerability scanning coming soon.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Page load times and performance tracking coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
