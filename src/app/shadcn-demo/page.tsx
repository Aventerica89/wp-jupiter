"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Globe, CheckCircle, Package, Palette, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from "recharts";

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

const statusChartConfig = {
  online: {
    label: "Online",
    color: "hsl(142, 76%, 36%)",
  },
  offline: {
    label: "Offline",
    color: "hsl(0, 84%, 60%)",
  },
  unknown: {
    label: "Unknown",
    color: "hsl(215, 14%, 50%)",
  },
} satisfies ChartConfig;

const updatesChartConfig = {
  plugins: {
    label: "Plugins",
    color: "hsl(217, 91%, 60%)",
  },
  themes: {
    label: "Themes",
    color: "hsl(280, 87%, 65%)",
  },
} satisfies ChartConfig;

export default function Page() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchSites();
  }, []);

  const stats = {
    total: sites.length,
    online: sites.filter((s) => s.status === "online").length,
    offline: sites.filter((s) => s.status === "offline").length,
    unknown: sites.filter((s) => s.status !== "online" && s.status !== "offline").length,
    pluginUpdates: sites.reduce((acc, s) => acc + (s.pluginUpdates || 0), 0),
    themeUpdates: sites.reduce((acc, s) => acc + (s.themeUpdates || 0), 0),
  };

  const statusChartData = [
    { name: "online", value: stats.online, fill: "var(--color-online)" },
    { name: "offline", value: stats.offline, fill: "var(--color-offline)" },
    { name: "unknown", value: stats.unknown, fill: "var(--color-unknown)" },
  ].filter((d) => d.value > 0);

  const updatesChartData = sites
    .filter((s) => s.pluginUpdates > 0 || s.themeUpdates > 0)
    .slice(0, 5)
    .map((s) => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + "..." : s.name,
      plugins: s.pluginUpdates,
      themes: s.themeUpdates,
    }));

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total WordPress sites managed</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sites responding to health checks</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {stats.online}
                </div>
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
                  <p>Total plugin updates available</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {stats.pluginUpdates}
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
                  <p>Total theme updates available</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-purple-600">
                  {stats.themeUpdates}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Site Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : stats.total === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No sites to display
                </div>
              ) : (
                <ChartContainer config={statusChartConfig} className="h-[200px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Updates Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Updates by Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : updatesChartData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>All sites up to date!</p>
                  </div>
                </div>
              ) : (
                <ChartContainer config={updatesChartConfig} className="h-[200px]">
                  <BarChart data={updatesChartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="plugins" fill="var(--color-plugins)" radius={4} />
                    <Bar dataKey="themes" fill="var(--color-themes)" radius={4} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sites List */}
        <Card>
          <CardHeader>
            <CardTitle>Your WordPress Sites</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : sites.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sites yet. Add your first WordPress site!
              </p>
            ) : (
              <div className="space-y-4">
                {sites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Tooltip>
                        <TooltipTrigger>
                          <div
                            className={`w-3 h-3 rounded-full ${
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
                              ? "Site is online"
                              : site.status === "offline"
                                ? "Site is offline"
                                : "Status unknown"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <div>
                        <p className="font-medium">{site.name}</p>
                        <p className="text-sm text-muted-foreground">{site.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {site.pluginUpdates > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary">
                              {site.pluginUpdates} plugin
                              {site.pluginUpdates !== 1 ? "s" : ""}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Plugin updates available</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {site.themeUpdates > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline">
                              {site.themeUpdates} theme
                              {site.themeUpdates !== 1 ? "s" : ""}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Theme updates available</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {site.status === "online" ? (
                        <Badge variant="success">Online</Badge>
                      ) : site.status === "offline" ? (
                        <Badge variant="destructive">Offline</Badge>
                      ) : (
                        <Badge variant="secondary">Unknown</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
