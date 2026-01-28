import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { DevButton } from "@/components/dev-button";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "WP Manager - WordPress Site Dashboard",
  description: "Manage all your WordPress sites from one dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 bg-slate-50 lg:h-screen lg:overflow-y-auto">
            {children}
          </main>
        </div>
        <DevButton />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
