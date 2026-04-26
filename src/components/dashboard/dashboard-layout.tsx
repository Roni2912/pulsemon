"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/monitors": "Monitors",
  "/incidents": "Incidents",
  "/statistics": "Statistics",
  "/status-pages": "Status Pages",
  "/settings": "Settings",
  "/profile": "Profile",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Then prefix match (e.g. /dashboard/monitors/abc → Monitors)
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== "/dashboard" && pathname.startsWith(path)) return title;
  }
  return "Dashboard";
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  email: string;
  name?: string;
}

export function DashboardLayout({ children, email, name }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          "lg:pl-[var(--sidebar-collapsed-width)]",
          sidebarOpen && "lg:pl-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-lg px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">{pageTitle}</h1>
          </div>
          <UserMenu email={email} name={name} />
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 page-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
