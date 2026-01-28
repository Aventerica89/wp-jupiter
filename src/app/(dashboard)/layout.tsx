import { Sidebar } from "@/components/sidebar";
import { DevButton } from "@/components/dev-button";
import { CommandPalette } from "@/components/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 bg-slate-50 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
      <DevButton />
      <CommandPalette />
    </div>
  );
}
