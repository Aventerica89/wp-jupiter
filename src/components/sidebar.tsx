"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Server,
  FolderOpen,
  Download,
  Activity,
  Settings,
  Menu,
  Tag,
  BarChart3,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sites", label: "Sites", icon: Globe },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/monitoring", label: "Monitoring", icon: BarChart3 },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/updates", label: "Updates", icon: Download },
  { href: "/activity", label: "Activity", icon: Activity },
];

const bottomItems = [
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/style-guide", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-slate-800 px-3 py-4">
        <ul className="space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User section */}
        <div className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">Admin</p>
            <p className="truncate text-xs text-slate-500">admin@example.com</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SidebarLogo() {
  return (
    <div className="flex h-16 items-center px-6">
      <Logo />
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between bg-slate-900 px-4 lg:hidden">
        <Logo />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 bg-slate-900 border-slate-800">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <SidebarLogo />
              <SidebarContent onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Spacer */}
      <div className="h-16 lg:hidden" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-60 flex-col bg-slate-900 text-slate-300">
        <SidebarLogo />
        <SidebarContent />
      </aside>
    </>
  );
}
