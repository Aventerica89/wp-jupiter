"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Globe,
  Server,
  LayoutDashboard,
  Download,
  Activity,
  Settings,
  Search,
  Package,
  Palette,
  FolderOpen,
  FileDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "site" | "server" | "plugin" | "theme" | "project";
  id: number;
  name: string;
  url?: string;
  description?: string;
  parentId?: number;
  parentName?: string;
}

interface CommandItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

const NAVIGATION_COMMANDS: CommandItem[] = [
  {
    id: "dashboard",
    name: "Go to Dashboard",
    icon: LayoutDashboard,
    action: () => {},
    keywords: ["home", "overview"],
  },
  {
    id: "sites",
    name: "Go to Sites",
    icon: Globe,
    action: () => {},
    keywords: ["wordpress", "websites"],
  },
  {
    id: "servers",
    name: "Go to Servers",
    icon: Server,
    action: () => {},
    keywords: ["hosting", "infrastructure"],
  },
  {
    id: "updates",
    name: "Go to Updates",
    icon: Download,
    action: () => {},
    keywords: ["plugins", "themes"],
  },
  {
    id: "activity",
    name: "Go to Activity",
    icon: Activity,
    action: () => {},
    keywords: ["log", "history"],
  },
  {
    id: "settings",
    name: "Go to Settings",
    icon: Settings,
    action: () => {},
    keywords: ["config", "preferences"],
  },
];

const ACTION_COMMANDS: CommandItem[] = [
  {
    id: "new-site",
    name: "Add New Site",
    icon: Plus,
    action: () => {},
    keywords: ["create", "wordpress"],
  },
  {
    id: "new-server",
    name: "Add New Server",
    icon: Plus,
    action: () => {},
    keywords: ["create", "hosting"],
  },
  {
    id: "export-csv",
    name: "Export Sites as CSV",
    icon: FileDown,
    action: () => {},
    keywords: ["download", "backup"],
  },
  {
    id: "export-json",
    name: "Export Sites as JSON",
    icon: FileDown,
    action: () => {},
    keywords: ["download", "backup"],
  },
];

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  site: Globe,
  server: Server,
  plugin: Package,
  theme: Palette,
  project: FolderOpen,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation commands with router actions
  const navigationCommands = NAVIGATION_COMMANDS.map((cmd) => ({
    ...cmd,
    action: () => {
      router.push(`/${cmd.id === "dashboard" ? cmd.id : cmd.id}`);
      setOpen(false);
    },
  }));

  // Action commands with actual actions
  const actionCommands = ACTION_COMMANDS.map((cmd) => ({
    ...cmd,
    action: () => {
      if (cmd.id === "new-site") {
        router.push("/sites/new");
      } else if (cmd.id === "new-server") {
        router.push("/servers/new");
      } else if (cmd.id === "export-csv") {
        window.open("/api/sites/export?format=csv", "_blank");
      } else if (cmd.id === "export-json") {
        window.open("/api/sites/export?format=json", "_blank");
      }
      setOpen(false);
    },
  }));

  // Filter commands based on query
  const filteredCommands = [...navigationCommands, ...actionCommands].filter(
    (cmd) => {
      if (!query) return true;
      const searchText = query.toLowerCase();
      return (
        cmd.name.toLowerCase().includes(searchText) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(searchText))
      );
    }
  );

  // Search API for sites, servers, plugins, themes
  const searchApi = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchApi(query);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchApi]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Calculate total items
  const totalItems = filteredCommands.length + results.length;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < filteredCommands.length) {
        filteredCommands[selectedIndex].action();
      } else {
        const result = results[selectedIndex - filteredCommands.length];
        if (result) {
          navigateToResult(result);
        }
      }
    }
  };

  const navigateToResult = (result: SearchResult) => {
    switch (result.type) {
      case "site":
        router.push(`/sites/${result.id}`);
        break;
      case "server":
        router.push(`/servers/${result.id}`);
        break;
      case "plugin":
      case "theme":
        if (result.parentId) {
          router.push(`/sites/${result.parentId}`);
        }
        break;
      case "project":
        router.push(`/projects/${result.id}`);
        break;
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search sites, servers, plugins... or type a command"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {/* Commands */}
          {filteredCommands.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Commands
              </p>
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm",
                    selectedIndex === index
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <cmd.icon className="h-4 w-4" />
                  {cmd.name}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-2 border-t">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Search Results
              </p>
              {results.map((result, index) => {
                const Icon = TYPE_ICONS[result.type] || Globe;
                const itemIndex = filteredCommands.length + index;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => navigateToResult(result)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm",
                      selectedIndex === itemIndex
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex-1 text-left">
                      <p>{result.name}</p>
                      {result.parentName && (
                        <p className="text-xs text-muted-foreground">
                          in {result.parentName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {result.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {/* Empty state */}
          {query.length >= 2 && !loading && results.length === 0 && filteredCommands.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <kbd className="rounded border px-1.5 py-0.5">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex gap-2">
            <kbd className="rounded border px-1.5 py-0.5">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex gap-2">
            <kbd className="rounded border px-1.5 py-0.5">⌘K</kbd>
            <span>Toggle</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
