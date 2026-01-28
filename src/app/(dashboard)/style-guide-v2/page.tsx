"use client";

import { useState } from "react";
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
  Sparkles,
  Zap,
  Shield,
  Rocket,
} from "lucide-react";

// Custom components for the V2 design system
function V2Button({
  variant = "primary",
  size = "default",
  children,
  disabled = false,
  className = "",
  onClick,
}: {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glow";
  size?: "sm" | "default" | "lg";
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 hover:border-slate-600",
    outline:
      "border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400",
    ghost: "text-slate-300 hover:text-white hover:bg-slate-800/50",
    glow: "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.7)] hover:scale-[1.02] active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function V2Badge({
  variant = "default",
  children,
}: {
  variant?: "default" | "success" | "warning" | "error" | "info" | "gradient";
  children: React.ReactNode;
}) {
  const variants = {
    default: "bg-slate-700 text-slate-200",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    error: "bg-red-500/20 text-red-400 border border-red-500/30",
    info: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    gradient:
      "bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-purple-300 border border-purple-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

function V2Card({
  children,
  variant = "default",
  hover = true,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "gradient" | "glow" | "bordered";
  hover?: boolean;
  className?: string;
}) {
  const variants = {
    default: "bg-slate-800/50 border border-slate-700/50",
    gradient:
      "bg-gradient-to-br from-slate-800 via-slate-800/95 to-purple-900/30 border border-purple-500/20",
    glow: "bg-slate-800/50 border border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    bordered: "bg-slate-900/50 border-2 border-slate-700",
  };

  const hoverStyles = hover
    ? "hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
    : "";

  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 ${variants[variant]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
}

function V2Input({
  placeholder,
  icon: Icon,
  type = "text",
}: {
  placeholder: string;
  icon?: React.ElementType;
  type?: string;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 ${Icon ? "pl-12 pr-4" : "px-4"}`}
      />
    </div>
  );
}

function V2Progress({ value }: { value: number }) {
  return (
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

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
        <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          {title}
        </h2>
        {description && (
          <p className="text-slate-400 mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function StyleGuideV2Page() {
  const [showPassword, setShowPassword] = useState(false);
  const [progress, setProgress] = useState(65);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Design System V2</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Style Guide V2
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Modern purple gradient theme with glassmorphism effects
          </p>
          <p className="text-slate-500 mt-4 text-sm">
            Inspired by{" "}
            <a
              href="https://uiverse.io/MuhammadHasann/fast-badger-70"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              uiverse.io/MuhammadHasann/fast-badger-70
            </a>
          </p>
        </div>

        <div className="space-y-16">
          {/* Buttons */}
          <Section
            title="Buttons"
            description="Gradient buttons with glow effects and smooth animations"
          >
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  Variants
                </h3>
                <div className="flex flex-wrap gap-4">
                  <V2Button variant="primary">Primary</V2Button>
                  <V2Button variant="secondary">Secondary</V2Button>
                  <V2Button variant="outline">Outline</V2Button>
                  <V2Button variant="ghost">Ghost</V2Button>
                  <V2Button variant="glow">Glow Effect</V2Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  Sizes
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <V2Button size="sm">Small</V2Button>
                  <V2Button size="default">Default</V2Button>
                  <V2Button size="lg">Large</V2Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  With Icons
                </h3>
                <div className="flex flex-wrap gap-4">
                  <V2Button variant="primary">
                    <Plus className="h-4 w-4" />
                    Add Site
                  </V2Button>
                  <V2Button variant="outline">
                    <RefreshCw className="h-4 w-4" />
                    Sync All
                  </V2Button>
                  <V2Button variant="glow">
                    <Rocket className="h-4 w-4" />
                    Launch
                  </V2Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  States
                </h3>
                <div className="flex flex-wrap gap-4">
                  <V2Button>Active</V2Button>
                  <V2Button disabled>Disabled</V2Button>
                  <V2Button variant="primary">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading
                  </V2Button>
                </div>
              </div>
            </div>
          </Section>

          {/* Badges */}
          <Section title="Badges" description="Status indicators with subtle glows">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  Variants
                </h3>
                <div className="flex flex-wrap gap-3">
                  <V2Badge>Default</V2Badge>
                  <V2Badge variant="success">Success</V2Badge>
                  <V2Badge variant="warning">Warning</V2Badge>
                  <V2Badge variant="error">Error</V2Badge>
                  <V2Badge variant="info">Info</V2Badge>
                  <V2Badge variant="gradient">Gradient</V2Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  Use Cases
                </h3>
                <div className="flex flex-wrap gap-3">
                  <V2Badge variant="success">Online</V2Badge>
                  <V2Badge variant="error">Offline</V2Badge>
                  <V2Badge variant="warning">3 Updates</V2Badge>
                  <V2Badge variant="gradient">WordPress 6.4</V2Badge>
                  <V2Badge>PHP 8.2</V2Badge>
                </div>
              </div>
            </div>
          </Section>

          {/* Cards */}
          <Section
            title="Cards"
            description="Glassmorphism containers with gradient accents"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <V2Card variant="default">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Default Card
                </h3>
                <p className="text-slate-400 text-sm">
                  A subtle card with translucent background and hover effects.
                </p>
              </V2Card>

              <V2Card variant="gradient">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    Gradient Card
                  </h3>
                  <V2Badge variant="success">Online</V2Badge>
                </div>
                <p className="text-slate-400 text-sm mb-4">example.com</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">WordPress</span>
                    <span className="text-slate-300">6.4.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PHP</span>
                    <span className="text-slate-300">8.2</span>
                  </div>
                </div>
              </V2Card>

              <V2Card variant="glow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Zap className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Glow Card</h3>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                  12
                </div>
                <p className="text-sm text-slate-400">Total Sites</p>
              </V2Card>
            </div>

            {/* Feature Card */}
            <V2Card variant="gradient" className="mt-6">
              <div className="flex items-start gap-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-purple-500/25">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Feature Highlight Card
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    A larger card layout perfect for showcasing features or services
                    with an icon accent and call-to-action.
                  </p>
                  <V2Button variant="primary" size="sm">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </V2Button>
                </div>
              </div>
            </V2Card>
          </Section>

          {/* Form Controls */}
          <Section title="Form Controls" description="Inputs with focus glow effects">
            <div className="grid gap-8 lg:grid-cols-2">
              <V2Card variant="default">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Text Inputs
                </h3>
                <div className="space-y-4">
                  <V2Input placeholder="Default input" />
                  <V2Input type="email" placeholder="Email address" />
                  <V2Input type="password" placeholder="Password" />
                </div>
              </V2Card>

              <V2Card variant="default">
                <h3 className="text-lg font-semibold text-white mb-4">
                  With Icons
                </h3>
                <div className="space-y-4">
                  <V2Input placeholder="Search sites..." icon={Search} />
                  <V2Input placeholder="https://example.com" icon={Globe} />
                  <V2Input placeholder="Enter email" icon={Mail} />
                </div>
              </V2Card>
            </div>
          </Section>

          {/* Checkbox */}
          <Section title="Checkbox" description="Custom styled selection controls">
            <V2Card variant="default">
              <div className="space-y-4">
                {[
                  { label: "Enable auto-sync", checked: true },
                  { label: "Send notifications", checked: false },
                  { label: "Dark mode (always)", checked: true },
                ].map((item, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        item.checked
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 border-purple-500"
                          : "border-slate-600 group-hover:border-purple-500/50"
                      }`}
                    >
                      {item.checked && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-slate-300 text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </V2Card>
          </Section>

          {/* Progress */}
          <Section title="Progress" description="Gradient progress bars with glow">
            <V2Card variant="default">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Syncing sites...</span>
                    <span className="text-purple-400">{progress}%</span>
                  </div>
                  <V2Progress value={progress} />
                </div>
                <div className="flex gap-4">
                  <V2Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    Decrease
                  </V2Button>
                  <V2Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    Increase
                  </V2Button>
                </div>
              </div>
            </V2Card>
          </Section>

          {/* Alerts */}
          <Section title="Alerts" description="Contextual messages with gradient borders">
            <div className="space-y-4 max-w-2xl">
              <div className="flex gap-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <Info className="h-5 w-5 text-blue-400 shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-300">Information</h4>
                  <p className="text-sm text-blue-200/70">
                    This is an informational message.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-medium text-emerald-300">Success</h4>
                  <p className="text-sm text-emerald-200/70">
                    All sites have been synced successfully.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-300">Warning</h4>
                  <p className="text-sm text-amber-200/70">
                    3 plugins have updates available.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <X className="h-5 w-5 text-red-400 shrink-0" />
                <div>
                  <h4 className="font-medium text-red-300">Error</h4>
                  <p className="text-sm text-red-200/70">
                    Failed to connect. Check credentials.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Icons */}
          <Section title="Icons" description="Lucide React with gradient backgrounds">
            <V2Card variant="default">
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
                  Zap,
                  Shield,
                ].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <Icon className="h-5 w-5 text-slate-400 hover:text-purple-400 transition-colors" />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Visit{" "}
                <a
                  href="https://lucide.dev/icons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                >
                  lucide.dev
                </a>{" "}
                for the full library.
              </p>
            </V2Card>
          </Section>

          {/* Color Palette */}
          <Section
            title="Color Palette"
            description="Primary purple gradient with dark slate backgrounds"
          >
            <V2Card variant="default">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/25" />
                  <p className="text-xs text-slate-400">Primary Gradient</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-purple-500" />
                  <p className="text-xs text-slate-400">purple-500</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-violet-600" />
                  <p className="text-xs text-slate-400">violet-600</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-slate-800 border border-slate-700" />
                  <p className="text-xs text-slate-400">slate-800</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-slate-900 border border-slate-700" />
                  <p className="text-xs text-slate-400">slate-900</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-slate-950 border border-slate-800" />
                  <p className="text-xs text-slate-400">slate-950</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-emerald-500" />
                  <p className="text-xs text-slate-400">emerald-500 (success)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-red-500" />
                  <p className="text-xs text-slate-400">red-500 (error)</p>
                </div>
              </div>
            </V2Card>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-800">
          <p className="text-center text-slate-500 text-sm">
            WP Manager Design System V2 - Purple Gradient Theme
          </p>
        </div>
      </div>
    </div>
  );
}
