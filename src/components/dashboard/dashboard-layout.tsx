"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  email: string;
}

export function DashboardLayout({ children, email }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:pl-64" : "lg:pl-16"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <UserMenu email={email} />
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
