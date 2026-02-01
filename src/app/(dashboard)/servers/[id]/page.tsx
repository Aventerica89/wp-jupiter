"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Server,
  Globe,
  ExternalLink,
  FileText,
  HelpCircle,
  Users,
  Copy,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Site {
  id: number;
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  wpVersion: string | null;
  lastChecked: string | null;
}

interface ServerDetail {
  id: number;
  name: string;
  ipAddress: string | null;
  externalId: string | null;
  region: string | null;
  notes: string | null;
  providerId: number | null;
  providerName: string | null;
  providerSlug: string | null;
  providerLogo: string | null;
  providerDashboard: string | null;
  serverUrlPattern: string | null;
  docsUrl: string | null;
  supportUrl: string | null;
  communityUrl: string | null;
  sites: Site[];
}

function getServerDashboardUrl(server: ServerDetail): string {
  if (!server.providerDashboard || !server.serverUrlPattern || !server.externalId) {
    return "";
  }
  const path = server.serverUrlPattern.replace("{serverId}", server.externalId);
  return `${server.providerDashboard}${path}`;
}

export default function ServerDetailPage() {
  const params = useParams();
  const [server, setServer] = useState<ServerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/servers/${params.id}`)
      .then((res) => res.json())
      .then(setServer)
      .catch((err) => {
        console.error("Failed to fetch server:", err);
        toast.error("Failed to load server");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const copyIp = () => {
    if (server?.ipAddress) {
      navigator.clipboard.writeText(server.ipAddress);
      toast.success("IP copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Server not found.</p>
      </div>
    );
  }

  const dashboardUrl = getServerDashboardUrl(server);
  const onlineSites = server.sites.filter((s) => s.status === "online").length;

  return (
    <div className="p-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/servers">Servers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{server.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
            {server.providerLogo ? (
              <img
                src={server.providerLogo}
                alt={server.providerName || ""}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <Server className="h-8 w-8 text-slate-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{server.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {server.providerName && <span>{server.providerName}</span>}
              {server.region && (
                <>
                  <span>•</span>
                  <span>{server.region}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {dashboardUrl && (
            <Button variant="outline" onClick={() => window.open(dashboardUrl, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Dashboard
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/servers/${server.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Total Sites</p>
                <p className="mt-1 text-3xl font-semibold">{server.sites.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="mt-1 text-3xl font-semibold text-green-600">{onlineSites}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="mt-1 text-3xl font-semibold text-red-600">
                  {server.sites.length - onlineSites}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sites list */}
          <Card>
            <CardHeader>
              <CardTitle>Sites on this Server</CardTitle>
            </CardHeader>
            <CardContent>
              {server.sites.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No sites assigned to this server yet.
                </p>
              ) : (
                <div className="divide-y">
                  {server.sites.map((site) => (
                    <Link
                      key={site.id}
                      href={`/sites/${site.id}`}
                      className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-6 px-6 transition-colors first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                          <Globe className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium">{site.name}</p>
                          <p className="text-sm text-muted-foreground">{site.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {site.wpVersion && (
                          <span className="text-sm text-muted-foreground">WP {site.wpVersion}</span>
                        )}
                        <Badge
                          variant={
                            site.status === "online"
                              ? "success"
                              : site.status === "offline"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {site.status === "online" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {site.status === "offline" && <XCircle className="mr-1 h-3 w-3" />}
                          {site.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Server Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Server Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {server.ipAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                      {server.ipAddress}
                    </code>
                    <Button size="icon-sm" variant="ghost" onClick={copyIp}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {server.externalId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provider ID</p>
                  <p className="mt-1 text-sm">{server.externalId}</p>
                </div>
              )}
              {server.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{server.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Links */}
          {server.providerName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provider Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboardUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open(dashboardUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Server Dashboard
                  </Button>
                )}
                {server.docsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open(server.docsUrl!, "_blank")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Documentation
                  </Button>
                )}
                {server.supportUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open(server.supportUrl!, "_blank")}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Support
                  </Button>
                )}
                {server.communityUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open(server.communityUrl!, "_blank")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Community
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
