"use client";

import Link from "next/link";
import { Palette } from "lucide-react";

export function DevButton() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Link
      href="/style-guide"
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-colors"
      title="Style Guide"
    >
      <Palette className="h-5 w-5" />
    </Link>
  );
}
