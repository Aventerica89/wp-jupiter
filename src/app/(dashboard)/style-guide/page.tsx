"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Globe,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Info,
  ChevronRight,
  Search,
  Bell,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [progress, setProgress] = useState(45);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight">Style Guide</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            UI components built with shadcn/ui for WP Jupiter
          </p>
        </div>

        <div className="space-y-16">
          {/* Buttons */}
          <Section
            title="Buttons"
            description="Various button variants and sizes"
          >
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Variants
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Sizes
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <Plus />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  With Icons
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button>
                    <Plus />
                    Add Site
                  </Button>
                  <Button variant="outline">
                    <RefreshCw />
                    Sync All
                  </Button>
                  <Button variant="secondary">
                    Learn more
                    <ArrowRight />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  States
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button disabled>Disabled</Button>
                  <Button>
                    <RefreshCw className="animate-spin" />
                    Loading
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {/* Badges */}
          <Section title="Badges" description="Status indicators and labels">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Variants
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Use Cases
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-green-600 text-white">Online</Badge>
                  <Badge variant="destructive">Offline</Badge>
                  <Badge className="bg-amber-500 text-white">3 Updates</Badge>
                  <Badge variant="secondary">WordPress 6.4</Badge>
                  <Badge variant="outline">PHP 8.2</Badge>
                </div>
              </div>
            </div>
          </Section>

          {/* Cards */}
          <Section
            title="Cards"
            description="Content containers with various layouts"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>A simple card component</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cards can contain any content and are great for grouping
                    related information.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Site Card</CardTitle>
                    <Badge className="bg-green-600 text-white">Online</Badge>
                  </div>
                  <CardDescription>example.com</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">WordPress</span>
                      <span>6.4.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PHP</span>
                      <span>8.2</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stats Card</CardTitle>
                  <CardDescription>Quick overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">12</div>
                  <p className="text-sm text-muted-foreground">Total Sites</p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Form Controls */}
          <Section title="Form Controls" description="Input fields and forms">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Text Inputs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Default input" />
                  <Input placeholder="Disabled input" disabled />
                  <Input type="email" placeholder="Email address" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>With Icons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Search sites..." />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="https://example.com" />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Checkbox */}
          <Section title="Checkbox" description="Selection controls">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Accept terms and conditions
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="newsletter" defaultChecked />
                    <label
                      htmlFor="newsletter"
                      className="text-sm font-medium leading-none"
                    >
                      Subscribe to newsletter
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="disabled" disabled />
                    <label
                      htmlFor="disabled"
                      className="text-sm font-medium leading-none opacity-50"
                    >
                      Disabled option
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Progress */}
          <Section title="Progress" description="Progress indicators">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Syncing sites...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    Decrease
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    Increase
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Alerts */}
          <Section title="Alerts" description="Contextual feedback messages">
            <div className="space-y-4 max-w-2xl">
              <div className="flex gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Information</h4>
                  <p className="text-sm text-blue-700">
                    This is an informational message.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <Check className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900">Success</h4>
                  <p className="text-sm text-green-700">
                    All sites have been synced successfully.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900">Warning</h4>
                  <p className="text-sm text-amber-700">
                    3 plugins have updates available.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <X className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Error</h4>
                  <p className="text-sm text-red-700">
                    Failed to connect. Check credentials.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Icons */}
          <Section title="Icons" description="Lucide React icon library">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-6 gap-4 sm:grid-cols-9">
                  {[
                    Globe,
                    Settings,
                    RefreshCw,
                    Plus,
                    Trash2,
                    Check,
                    X,
                    AlertCircle,
                    Info,
                    ChevronRight,
                    Search,
                    Bell,
                    User,
                    Lock,
                    Mail,
                    Eye,
                    EyeOff,
                    ArrowRight,
                  ].map((Icon, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Visit{" "}
                  <a
                    href="https://lucide.dev/icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    lucide.dev
                  </a>{" "}
                  for the full library.
                </p>
              </CardContent>
            </Card>
          </Section>
        </div>
      </div>
    </div>
  );
}
