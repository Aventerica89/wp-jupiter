import type { Metadata } from "next";
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
        <div className="min-h-screen bg-slate-50">
          <nav className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                  <a href="/" className="text-xl font-bold text-slate-900">
                    WP Manager
                  </a>
                  <div className="flex gap-4">
                    <a
                      href="/dashboard"
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Dashboard
                    </a>
                    <a
                      href="/sites"
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Sites
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
