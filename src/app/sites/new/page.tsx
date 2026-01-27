"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe } from "lucide-react";

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      url: formData.get("url"),
      apiUsername: formData.get("apiUsername"),
      apiPassword: formData.get("apiPassword"),
    };

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add site");
      }

      router.push("/sites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add site");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Add Site</h1>
        <p className="text-muted-foreground">
          Connect a new WordPress site to your dashboard
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Globe className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle>Site Details</CardTitle>
                <CardDescription>
                  Connect using Application Passwords (requires WP 5.6+)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Site Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="My WordPress Site"
                />
              </div>

              <div>
                <label
                  htmlFor="url"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Site URL
                </label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="apiUsername"
                  className="mb-1.5 block text-sm font-medium"
                >
                  WordPress Username
                </label>
                <Input
                  id="apiUsername"
                  name="apiUsername"
                  type="text"
                  required
                  placeholder="admin"
                />
              </div>

              <div>
                <label
                  htmlFor="apiPassword"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Application Password
                </label>
                <Input
                  id="apiPassword"
                  name="apiPassword"
                  type="password"
                  required
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Generate at: WP Admin → Users → Profile → Application
                  Passwords
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Site"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
