"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Palette, Smartphone, Sparkles, ChevronUp } from "lucide-react";

const menuItems = [
  {
    href: "/style-guide",
    label: "Style Guide",
    icon: Palette,
    description: "Current design system",
  },
  {
    href: "/style-guide-v2",
    label: "Style Guide V2",
    icon: Sparkles,
    description: "Purple gradient theme",
  },
  {
    href: "/mobile-app",
    label: "Mobile App",
    icon: Smartphone,
    description: "Coming soon",
  },
];

export function DevButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div ref={menuRef} className="fixed bottom-4 right-4 z-50">
      {/* Menu */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group"
              >
                <item.icon className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all border border-slate-700 hover:border-slate-600"
        title="Developer Tools"
      >
        {isOpen ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <Palette className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
