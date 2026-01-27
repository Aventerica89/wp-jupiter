"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Trash2, Settings } from "lucide-react";

interface Site {
  id: number;
  name: string;
  url: string;
  apiUsername: string;
}

export default function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/sites/${id}`);
        const data = await res.json();
        setSite(data);
        setName(data.name);
        setUrl(data.url);
        setApiUsername(data.apiUsername || "");
      } catch (err) {
        setError("Failed to load site");
      } finally {
        setLoading(false);
      }
    };
    fetchSite();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, string> = { name, url, apiUsername };
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

      router.push(`/sites/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
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
      router.push("/sites");
    } catch (err) {
      setError("Failed to delete site");
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
                <label className="text-sm font-medium">Site Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My WordPress Site"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Site URL</label>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">API Username</label>
                <Input
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
                <label className="text-sm font-medium">
                  API Password / Secret Key
                </label>
                <Input
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
