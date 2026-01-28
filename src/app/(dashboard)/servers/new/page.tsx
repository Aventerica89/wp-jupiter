"use client";

import { useEffect, useState } from "react";
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
import { Server, ExternalLink, FileText, HelpCircle, Users } from "lucide-react";

interface Provider {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  dashboardUrl: string | null;
  docsUrl: string | null;
  supportUrl: string | null;
  communityUrl: string | null;
}

export default function NewServerPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    externalId: "",
    region: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then(setProviders)
      .catch((err) => {
        console.error("Failed to fetch providers:", err);
        toast.error("Failed to load providers");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Server name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          providerId: selectedProvider?.id || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create server");
      }

      toast.success("Server added successfully");
      router.push("/servers");
    } catch (error) {
      console.error("Failed to create server:", error);
      toast.error("Failed to add server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Add Server</h1>
        <p className="text-muted-foreground">
          Register a new hosting server to organize your sites
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Hosting Provider</CardTitle>
            <CardDescription>
              Select your hosting provider for quick access to dashboards and support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setSelectedProvider(
                    selectedProvider?.id === provider.id ? null : provider
                  )}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-slate-300 ${
                    selectedProvider?.id === provider.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200"
                  }`}
                >
                  {provider.logoUrl ? (
                    <div className="flex h-10 w-10 items-center justify-center">
                      <img
                        src={provider.logoUrl}
                        alt={provider.name}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                  ) : (
                    <Server className="h-8 w-8 text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-center">{provider.name}</span>
                </button>
              ))}
            </div>

            {/* Provider Links */}
            {selectedProvider && (
              <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
                {selectedProvider.dashboardUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedProvider.dashboardUrl!, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                )}
                {selectedProvider.docsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedProvider.docsUrl!, "_blank")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Docs
                  </Button>
                )}
                {selectedProvider.supportUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedProvider.supportUrl!, "_blank")}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Support
                  </Button>
                )}
                {selectedProvider.communityUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedProvider.communityUrl!, "_blank")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Community
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Server Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Server className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle>Server Details</CardTitle>
                <CardDescription>
                  Add your server information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Server Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Production Server 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ipAddress" className="mb-1.5 block text-sm font-medium">
                    IP Address
                  </label>
                  <Input
                    id="ipAddress"
                    type="text"
                    placeholder="192.168.1.1"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="region" className="mb-1.5 block text-sm font-medium">
                    Region
                  </label>
                  <Input
                    id="region"
                    type="text"
                    placeholder="us-east-1, London, etc."
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="externalId" className="mb-1.5 block text-sm font-medium">
                  Provider Server ID
                </label>
                <Input
                  id="externalId"
                  type="text"
                  placeholder="Used to generate dashboard links"
                  value={formData.externalId}
                  onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Find this in your provider's dashboard URL (e.g., /servers/12345)
                </p>
              </div>

              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Any notes about this server..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Server"}
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
