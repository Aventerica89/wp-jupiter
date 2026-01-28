"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Server,
  Globe,
  ExternalLink,
  Trash2,
  FileText,
  HelpCircle,
  Users,
  Copy,
} from "lucide-react";

interface ServerWithProvider {
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
  siteCount: number;
}

interface Provider {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
}

function getServerDashboardUrl(server: ServerWithProvider): string {
  if (!server.providerDashboard || !server.serverUrlPattern || !server.externalId) {
    return "";
  }
  const path = server.serverUrlPattern.replace("{serverId}", server.externalId);
  return `${server.providerDashboard}${path}`;
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerWithProvider[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"provider" | "none">("provider");

  const fetchData = async () => {
    try {
      const [serversRes, providersRes] = await Promise.all([
        fetch("/api/servers"),
        fetch("/api/providers"),
      ]);
      const serversData = await serversRes.json();
      const providersData = await providersRes.json();
      setServers(serversData);
      setProviders(providersData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  };

  const deleteServer = async (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`Delete server "${name}"? Sites will be unlinked but not deleted.`)) return;

    try {
      await fetch(`/api/servers/${id}`, { method: "DELETE" });
      setServers(servers.filter((s) => s.id !== id));
      toast.success("Server deleted", {
        description: `${name} has been removed.`,
      });
    } catch (error) {
      console.error("Failed to delete server:", error);
      toast.error("Failed to delete server");
    }
  };

  const copyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    toast.success("IP copied to clipboard");
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group servers by provider
  const groupedServers = servers.reduce((acc, server) => {
    const key = server.providerSlug || "unassigned";
    if (!acc[key]) {
      acc[key] = {
        providerName: server.providerName || "Unassigned",
        providerLogo: server.providerLogo,
        servers: [],
      };
    }
    acc[key].servers.push(server);
    return acc;
  }, {} as Record<string, { providerName: string; providerLogo: string | null; servers: ServerWithProvider[] }>);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Servers</h1>
          <p className="text-muted-foreground">
            Manage your hosting servers and providers
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setGroupBy(groupBy === "provider" ? "none" : "provider")}
          >
            {groupBy === "provider" ? "Ungroup" : "Group by Provider"}
          </Button>
          <Button asChild>
            <Link href="/servers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Server
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Servers</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">{servers.length}</p>
              </div>
              <Server className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Providers</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {Object.keys(groupedServers).filter(k => k !== "unassigned").length}
                </p>
              </div>
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sites</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {servers.reduce((sum, s) => sum + s.siteCount, 0)}
                </p>
              </div>
              <Globe className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servers */}
      {servers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-muted-foreground">No servers added yet.</p>
            <Button asChild className="mt-4">
              <Link href="/servers/new">Add Your First Server</Link>
            </Button>
          </CardContent>
        </Card>
      ) : groupBy === "provider" ? (
        // Grouped by provider
        <div className="space-y-8">
          {Object.entries(groupedServers).map(([slug, group]) => (
            <div key={slug}>
              <div className="mb-4 flex items-center gap-3">
                {group.providerLogo && (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-white p-1 shadow-sm">
                    <img
                      src={group.providerLogo}
                      alt={group.providerName}
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                )}
                <h2 className="text-lg font-semibold">{group.providerName}</h2>
                <Badge variant="secondary">{group.servers.length} server{group.servers.length !== 1 ? "s" : ""}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.servers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onDelete={deleteServer}
                    onCopyIp={copyIp}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat list
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onDelete={deleteServer}
              onCopyIp={copyIp}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServerCard({
  server,
  onDelete,
  onCopyIp,
}: {
  server: ServerWithProvider;
  onDelete: (id: number, name: string, e: React.MouseEvent) => void;
  onCopyIp: (ip: string) => void;
}) {
  const dashboardUrl = getServerDashboardUrl(server);

  return (
    <Card className="group relative">
      <Link href={`/servers/${server.id}`} className="block">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                {server.providerLogo ? (
                  <img
                    src={server.providerLogo}
                    alt={server.providerName || ""}
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <Server className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">{server.name}</CardTitle>
                {server.region && (
                  <p className="text-sm text-muted-foreground">{server.region}</p>
                )}
              </div>
            </div>
            <Badge variant="secondary">
              {server.siteCount} site{server.siteCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {server.ipAddress && (
              <div className="flex items-center gap-2">
                <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                  {server.ipAddress}
                </code>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    onCopyIp(server.ipAddress!);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            {server.providerName && !server.providerLogo && (
              <p className="text-sm text-muted-foreground">{server.providerName}</p>
            )}
          </div>
        </CardContent>
      </Link>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {dashboardUrl && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              window.open(dashboardUrl, "_blank");
            }}
            title="Open in provider dashboard"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={(e) => onDelete(server.id, server.name, e)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </Card>
  );
}
