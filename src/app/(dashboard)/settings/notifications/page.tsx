"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Webhook, Plus } from "lucide-react";

interface NotificationSetting {
  id: number;
  type: "email" | "slack" | "discord" | "webhook";
  enabled: boolean;
  config: string | null;
  events: string | null;
  createdAt: string;
}

const NOTIFICATION_TYPES = [
  { value: "email", label: "Email", icon: Mail, color: "bg-blue-500" },
  { value: "slack", label: "Slack", icon: MessageSquare, color: "bg-purple-500" },
  { value: "discord", label: "Discord", icon: MessageSquare, color: "bg-indigo-500" },
  { value: "webhook", label: "Custom Webhook", icon: Webhook, color: "bg-green-500" },
];

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<string>("email");
  const [newConfig, setNewConfig] = useState<string>("");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''}`,
        },
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const createNotification = async () => {
    if (!newConfig.trim()) {
      toast.error("Configuration is required");
      return;
    }

    setCreating(true);
    try {
      let config: any = {};

      if (newType === "email") {
        config = { to: newConfig };
      } else {
        config = { webhookUrl: newConfig };
      }

      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''}`,
        },
        body: JSON.stringify({
          type: newType,
          enabled: true,
          config,
          events: ["site_offline", "updates_available", "security_issue"],
        }),
      });

      if (!res.ok) throw new Error("Failed to create notification");

      toast.success("Notification created");
      setNewConfig("");
      fetchSettings();
    } catch (error) {
      console.error("Failed to create notification:", error);
      toast.error("Failed to create notification");
    } finally {
      setCreating(false);
    }
  };

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Configure alerts for site events
        </p>
      </div>

      {/* Create Notification */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Add Notification Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2"
            >
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <Input
              placeholder={
                newType === "email"
                  ? "your@email.com"
                  : "https://hooks.slack.com/services/..."
              }
              value={newConfig}
              onChange={(e) => setNewConfig(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createNotification} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {newType === "email" && "Enter your email address"}
            {newType === "slack" && "Enter your Slack webhook URL"}
            {newType === "discord" && "Enter your Discord webhook URL"}
            {newType === "webhook" && "Enter your custom webhook URL"}
          </p>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Notifications ({settings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-muted-foreground">No notification channels configured.</p>
              <p className="text-sm text-muted-foreground">
                Add your first channel to receive alerts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.map((setting) => {
                const typeInfo = NOTIFICATION_TYPES.find((t) => t.value === setting.type);
                const Icon = typeInfo?.icon || Bell;
                const config = setting.config ? JSON.parse(setting.config) : {};

                return (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${typeInfo?.color || 'bg-slate-500'}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{typeInfo?.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {setting.type === "email" ? config.to : "Webhook configured"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={setting.enabled ? "success" : "secondary"}>
                      {setting.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="font-medium text-sm">Site Offline</p>
              <p className="text-xs text-muted-foreground">
                Triggered when a site goes offline
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium text-sm">Updates Available</p>
              <p className="text-xs text-muted-foreground">
                Plugin or theme updates detected
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium text-sm">Security Issues</p>
              <p className="text-xs text-muted-foreground">
                Security vulnerabilities found
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
