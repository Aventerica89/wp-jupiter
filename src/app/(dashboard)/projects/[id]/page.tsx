"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FolderOpen,
  Globe,
  ExternalLink,
  CheckCircle,
  XCircle,
  Star,
  Edit,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface Site {
  id: number;
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  wpVersion: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  lastChecked: string | null;
  pluginUpdates: number;
  themeUpdates: number;
  serverName: string | null;
  providerName: string | null;
  providerLogo: string | null;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  sites: Site[];
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setProject(data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const activeSites = project.sites.filter((s) => !s.isArchived);
  const sitesOnline = activeSites.filter((s) => s.status === "online").length;
  const totalUpdates = activeSites.reduce(
    (sum, s) => sum + s.pluginUpdates + s.themeUpdates,
    0
  );

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: project.color + "20" }}
            >
              <FolderOpen className="h-6 w-6" style={{ color: project.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sites</p>
                <p className="mt-2 text-3xl font-semibold">{activeSites.length}</p>
              </div>
              <Globe className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="mt-2 text-3xl font-semibold">{sitesOnline}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Updates
                </p>
                <p className="mt-2 text-3xl font-semibold">{totalUpdates}</p>
              </div>
              <Badge variant={totalUpdates > 0 ? "warning" : "secondary"}>
                {totalUpdates > 0 ? "Pending" : "Up to date"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites List */}
      <Card>
        <CardHeader>
          <CardTitle>Sites in this Project</CardTitle>
        </CardHeader>
        <CardContent>
          {activeSites.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No sites assigned to this project yet.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Edit a site to assign it to this project.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {activeSites.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Globe className="h-5 w-5 text-slate-600" />
                      {site.isFavorite && (
                        <Star className="absolute -top-1 -right-1 h-4 w-4 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {site.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {site.pluginUpdates + site.themeUpdates > 0 && (
                      <Badge variant="warning">
                        {site.pluginUpdates + site.themeUpdates} updates
                      </Badge>
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
                      {site.status}
                    </Badge>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Open ${site.name} in new tab`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(site.url, "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
