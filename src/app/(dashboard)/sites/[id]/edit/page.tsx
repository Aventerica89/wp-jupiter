"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Trash2, Settings } from "lucide-react";

interface Site {
  id: number;
  name: string;
  url: string;
  apiUsername: string;
  serverId: number | null;
  projectId: number | null;
  notes: string | null;
}

interface ServerOption {
  id: number;
  name: string;
  providerName: string | null;
}

interface ProjectOption {
  id: number;
  name: string;
  color: string;
}

export default function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [serverId, setServerId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, serversRes, projectsRes] = await Promise.all([
          fetch(`/api/sites/${id}`),
          fetch("/api/servers"),
          fetch("/api/projects"),
        ]);
        const siteData = await siteRes.json();
        const serversData = await serversRes.json();
        const projectsData = await projectsRes.json();

        setSite(siteData);
        setServers(serversData);
        setProjects(projectsData);
        setName(siteData.name);
        setUrl(siteData.url);
        setApiUsername(siteData.apiUsername || "");
        setServerId(siteData.serverId || null);
        setProjectId(siteData.projectId || null);
        setNotes(siteData.notes || "");
      } catch (err) {
        setError("Failed to load site");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, string | number | null> = {
        name,
        url,
        apiUsername,
        serverId,
        projectId,
        notes: notes || null,
      };
      if (apiPassword) {
        body.apiPassword = apiPassword;
      }

      const res = await fetch(`/api/sites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update site");
      }

      toast.success("Site updated");
      router.push(`/sites/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this site?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Site deleted");
      router.push("/sites");
    } catch (err) {
      setError("Failed to delete site");
      toast.error("Failed to delete site");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Site not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Site</h1>
        <p className="text-muted-foreground">
          Update settings for {site.name}
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Settings className="h-5 w-5 text-slate-600" />
              </div>
              <CardTitle>Site Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="site-name" className="text-sm font-medium">Site Name</label>
                <Input
                  id="site-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My WordPress Site"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="site-url" className="text-sm font-medium">Site URL</label>
                <Input
                  id="site-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>

              {/* Server Selection */}
              <div className="space-y-1.5">
                <label htmlFor="server-select" className="text-sm font-medium">Server</label>
                <select
                  id="server-select"
                  value={serverId || ""}
                  onChange={(e) => setServerId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">No server assigned</option>
                  {servers.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name}
                      {server.providerName ? ` (${server.providerName})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Assign this site to a server for organization
                </p>
              </div>

              {/* Project Selection */}
              <div className="space-y-1.5">
                <label htmlFor="project-select" className="text-sm font-medium">Project</label>
                <select
                  id="project-select"
                  value={projectId || ""}
                  onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">No project assigned</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Group this site with others in a project
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="api-username" className="text-sm font-medium">API Username</label>
                <Input
                  id="api-username"
                  value={apiUsername}
                  onChange={(e) => setApiUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  WordPress username with admin access
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="api-password" className="text-sm font-medium">
                  API Password / Secret Key
                </label>
                <Input
                  id="api-password"
                  type="password"
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
                <p className="text-xs text-muted-foreground">
                  Application Password or WP Manager Connector secret key. Leave
                  blank to keep the current value.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="site-notes" className="text-sm font-medium">Notes</label>
                <textarea
                  id="site-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this site..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <p className="text-xs text-muted-foreground">
                  Add notes or changelog entries for this site
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete Site"}
                </Button>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/sites/${id}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
