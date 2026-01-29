"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Palette,
  Users,
  Shield,
  Clock,
  Database,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface SettingsSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  available: boolean;
}

const settingsSections: SettingsSection[] = [
  {
    title: "Notifications",
    description: "Configure email, Slack, Discord, and webhook notifications",
    icon: Bell,
    href: "/settings/notifications",
    available: true,
  },
  {
    title: "Appearance",
    description: "Customize branding, colors, and white-label settings",
    icon: Palette,
    href: "/settings/appearance",
    badge: "Coming Soon",
    available: false,
  },
  {
    title: "Team & Users",
    description: "Manage team members and their permissions",
    icon: Users,
    href: "/settings/team",
    badge: "Coming Soon",
    available: false,
  },
  {
    title: "Security",
    description: "Configure security scanning and vulnerability alerts",
    icon: Shield,
    href: "/settings/security",
    badge: "Coming Soon",
    available: false,
  },
  {
    title: "Scheduled Jobs",
    description: "Set up automatic syncing and backup schedules",
    icon: Clock,
    href: "/settings/schedules",
    badge: "Coming Soon",
    available: false,
  },
  {
    title: "Database",
    description: "View database stats and perform maintenance",
    icon: Database,
    href: "/settings/database",
    badge: "Coming Soon",
    available: false,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-8">
      <Breadcrumb items={[{ label: "Settings" }]} />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your WP Manager preferences and configuration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          const content = (
            <Card
              className={`transition-colors ${
                section.available
                  ? "hover:border-primary/50 cursor-pointer"
                  : "opacity-60"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  {section.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-3 text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  {section.available ? (
                    <>
                      <span>Configure</span>
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <span>Not available yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );

          if (section.available) {
            return (
              <Link key={section.href} href={section.href}>
                {content}
              </Link>
            );
          }

          return <div key={section.href}>{content}</div>;
        })}
      </div>
    </div>
  );
}
