"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Site</CardTitle>
          <CardDescription>
            Connect a WordPress site using Application Passwords (requires WP 5.6+)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-slate-700"
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
                className="mb-1 block text-sm font-medium text-slate-700"
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
                className="mb-1 block text-sm font-medium text-slate-700"
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
                className="mb-1 block text-sm font-medium text-slate-700"
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
              <p className="mt-1 text-xs text-slate-500">
                Generate at: WP Admin → Users → Profile → Application Passwords
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Site"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
