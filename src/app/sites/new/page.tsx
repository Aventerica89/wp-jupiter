"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { validateSiteData, type SiteInput } from "@/lib/validation";

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    const formData = new FormData(e.currentTarget);
    const rawData: SiteInput = {
      name: formData.get("name") as string,
      url: formData.get("url") as string,
      apiUsername: formData.get("apiUsername") as string,
      apiPassword: formData.get("apiPassword") as string,
    };

    // Client-side validation using TDD utility
    const validation = validateSiteData(rawData);
    if (!validation.valid) {
      setErrors(validation.errors || ["Invalid input"]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add site");
      }

      toast.success("Site added successfully", {
        description: `${validation.data?.name} has been connected.`,
      });
      router.push("/sites");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add site";
      setErrors([message]);
      toast.error("Failed to add site", {
        description: message,
      });
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
              {errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <ul className="list-disc pl-4 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
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
                  type="text"
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
