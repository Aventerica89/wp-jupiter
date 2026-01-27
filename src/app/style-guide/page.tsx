"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useState } from "react";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900 border-b border-slate-200 pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorSwatch({
  name,
  color,
  textColor = "text-white",
}: {
  name: string;
  color: string;
  textColor?: string;
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`h-16 w-full rounded-lg ${color} ${textColor} flex items-center justify-center text-sm font-medium shadow-sm`}
      >
        {name}
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Style Guide</h1>
        <p className="mt-2 text-lg text-slate-600">
          WP Manager design system and component library
        </p>
      </div>

      <div className="space-y-16">
        {/* Colors */}
        <Section title="Colors">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Primary (Slate)
              </h3>
              <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
                <ColorSwatch name="50" color="bg-slate-50" textColor="text-slate-900" />
                <ColorSwatch name="100" color="bg-slate-100" textColor="text-slate-900" />
                <ColorSwatch name="200" color="bg-slate-200" textColor="text-slate-900" />
                <ColorSwatch name="300" color="bg-slate-300" textColor="text-slate-900" />
                <ColorSwatch name="400" color="bg-slate-400" textColor="text-slate-900" />
                <ColorSwatch name="500" color="bg-slate-500" />
                <ColorSwatch name="600" color="bg-slate-600" />
                <ColorSwatch name="700" color="bg-slate-700" />
                <ColorSwatch name="800" color="bg-slate-800" />
                <ColorSwatch name="900" color="bg-slate-900" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Semantic
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ColorSwatch name="Success" color="bg-green-500" />
                <ColorSwatch name="Warning" color="bg-yellow-500" textColor="text-slate-900" />
                <ColorSwatch name="Error" color="bg-red-500" />
                <ColorSwatch name="Info" color="bg-blue-500" />
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-6 bg-white rounded-lg border border-slate-200 p-6">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Heading 1
              </span>
              <h1 className="text-4xl font-bold text-slate-900">
                The quick brown fox jumps over the lazy dog
              </h1>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Heading 2
              </span>
              <h2 className="text-3xl font-semibold text-slate-900">
                The quick brown fox jumps over the lazy dog
              </h2>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Heading 3
              </span>
              <h3 className="text-2xl font-semibold text-slate-900">
                The quick brown fox jumps over the lazy dog
              </h3>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Heading 4
              </span>
              <h4 className="text-xl font-medium text-slate-900">
                The quick brown fox jumps over the lazy dog
              </h4>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Body
              </span>
              <p className="text-base text-slate-700">
                The quick brown fox jumps over the lazy dog. Lorem ipsum dolor
                sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Small
              </span>
              <p className="text-sm text-slate-600">
                The quick brown fox jumps over the lazy dog. Lorem ipsum dolor
                sit amet, consectetur adipiscing elit.
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Code
              </span>
              <code className="block font-mono text-sm bg-slate-100 text-slate-800 p-3 rounded-md">
                const wpManager = new WordPressManager(config);
              </code>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                With Icons
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Site
                </Button>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync All
                </Button>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button variant="secondary">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                States
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Use Cases
              </h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">Online</Badge>
                <Badge variant="destructive">Offline</Badge>
                <Badge variant="warning">3 Updates</Badge>
                <Badge variant="secondary">WordPress 6.4</Badge>
                <Badge variant="outline">PHP 8.2</Badge>
              </div>
            </div>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Form Controls">
          <div className="space-y-6 max-w-md">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Text Inputs
              </h3>
              <div className="space-y-3">
                <Input placeholder="Default input" />
                <Input placeholder="Disabled input" disabled />
                <Input type="email" placeholder="Email address" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                With Labels
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Site URL
                  </label>
                  <Input placeholder="https://example.com" />
                  <p className="text-sm text-slate-500">
                    Enter the full URL of your WordPress site
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                With Icons
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input className="pl-10" placeholder="Search sites..." />
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input className="pl-10" placeholder="https://example.com" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input className="pl-10" type="email" placeholder="admin@example.com" />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>A simple card with header and content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  This is the card content area where you can place any content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Site Card</CardTitle>
                  <Badge variant="success">Online</Badge>
                </div>
                <CardDescription>example.com</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">WordPress</span>
                    <span className="text-slate-900">6.4.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PHP</span>
                    <span className="text-slate-900">8.2</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">12</div>
                <p className="text-sm text-slate-500">Total Sites</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Alerts */}
        <Section title="Alerts">
          <div className="space-y-4 max-w-2xl">
            <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Information</h4>
                <p className="text-sm text-blue-700 mt-1">
                  This is an informational message for the user.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Success</h4>
                <p className="text-sm text-green-700 mt-1">
                  All sites have been synced successfully.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  3 plugins have updates available.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1">
                  Failed to connect to the site. Please check the credentials.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Icons */}
        <Section title="Icons">
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Using Lucide React icons. Visit{" "}
              <a
                href="https://lucide.dev/icons"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                lucide.dev
              </a>{" "}
              for the full library.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Globe, name: "Globe" },
                { icon: Settings, name: "Settings" },
                { icon: RefreshCw, name: "RefreshCw" },
                { icon: Plus, name: "Plus" },
                { icon: Trash2, name: "Trash2" },
                { icon: Check, name: "Check" },
                { icon: X, name: "X" },
                { icon: AlertCircle, name: "AlertCircle" },
                { icon: Info, name: "Info" },
                { icon: ChevronRight, name: "ChevronRight" },
                { icon: Search, name: "Search" },
                { icon: Bell, name: "Bell" },
                { icon: User, name: "User" },
                { icon: Lock, name: "Lock" },
                { icon: Mail, name: "Mail" },
              ].map(({ icon: Icon, name }) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white"
                >
                  <Icon className="h-5 w-5 text-slate-700" />
                  <span className="text-xs text-slate-500">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Spacing">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Using Tailwind default 4px base scale (p-1 = 4px, p-2 = 8px, p-4 = 16px, etc.)
            </p>
            <div className="flex flex-wrap items-end gap-4">
              {[1, 2, 3, 4, 6, 8, 12, 16].map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <div
                    className="bg-blue-500 rounded"
                    style={{ width: size * 4, height: size * 4 }}
                  />
                  <span className="text-xs text-slate-500">p-{size}</span>
                  <span className="text-xs text-slate-400">{size * 4}px</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius">
          <div className="flex flex-wrap gap-6">
            {[
              { name: "rounded-sm", value: "0.125rem" },
              { name: "rounded", value: "0.25rem" },
              { name: "rounded-md", value: "0.375rem" },
              { name: "rounded-lg", value: "0.5rem" },
              { name: "rounded-xl", value: "0.75rem" },
              { name: "rounded-2xl", value: "1rem" },
              { name: "rounded-full", value: "9999px" },
            ].map(({ name, value }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-16 bg-slate-900 ${name}`} />
                <span className="text-xs text-slate-700">{name}</span>
                <span className="text-xs text-slate-400">{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadows */}
        <Section title="Shadows">
          <div className="flex flex-wrap gap-8">
            {["shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl"].map(
              (shadow) => (
                <div key={shadow} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-16 w-16 bg-white rounded-lg ${shadow}`}
                  />
                  <span className="text-xs text-slate-700">{shadow}</span>
                </div>
              )
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
