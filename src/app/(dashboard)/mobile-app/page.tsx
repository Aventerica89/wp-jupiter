"use client";

import { Smartphone, Bell, Globe, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Globe,
    title: "Site Monitoring",
    description: "Check site status and uptime from anywhere",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Get alerted when sites go down or need updates",
  },
  {
    icon: Shield,
    title: "Security Alerts",
    description: "Instant notifications for security issues",
  },
];

export default function MobileAppPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Coming Soon
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            WP Jupiter Mobile
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Monitor and manage your WordPress sites on the go. Native apps for
            iOS and Android coming soon.
          </p>
        </div>

        {/* Phone Mockup */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="w-64 h-[500px] bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden">
              {/* Screen */}
              <div className="absolute inset-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] flex flex-col items-center justify-center">
                {/* Status bar */}
                <div className="absolute top-3 left-0 right-0 flex justify-center">
                  <div className="w-20 h-6 bg-black rounded-full" />
                </div>

                {/* Content */}
                <div className="text-center px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">WP Jupiter</h3>
                  <p className="text-slate-400 text-sm">
                    Mobile app in development
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <feature.icon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card>
          <CardHeader>
            <CardTitle>Get Notified</CardTitle>
            <CardDescription>
              Be the first to know when the mobile app launches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button>
                Notify Me
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
