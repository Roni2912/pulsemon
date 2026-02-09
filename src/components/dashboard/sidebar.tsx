"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Monitor,
  AlertCircle,
  BarChart3,
  Globe,
  Settings,
  Menu,
  ChevronLeft,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Monitors", href: "/dashboard/monitors", icon: Monitor },
  { name: "Incidents", href: "/dashboard/incidents", icon: AlertCircle },
  { name: "Statistics", href: "/dashboard/statistics", icon: BarChart3 },
  { name: "Status Pages", href: "/dashboard/status-pages", icon: Globe },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen gradient-sidebar border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "w-64" : "w-0 lg:w-[var(--sidebar-collapsed-width)]"
        )}
      >
        <div className={cn(
          "flex flex-col h-full w-64 lg:w-auto",
          !isOpen && "lg:w-[var(--sidebar-collapsed-width)]"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center h-16 border-b border-[hsl(var(--sidebar-border))] overflow-hidden",
            isOpen ? "justify-between px-4" : "justify-center"
          )}>
            {isOpen ? (
              <>
                <Link href="/dashboard" className="flex items-center overflow-hidden">
                  <Image
                    src="/logo1.png"
                    alt="PulseMon"
                    width={200}
                    height={130}
                    className="h-20 w-auto object-contain"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] flex-shrink-0 h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] hidden lg:flex w-full h-full rounded-none p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm",
                    isActive
                      ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] shadow-sm"
                      : "text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]",
                    !isOpen && "lg:justify-center lg:px-0"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "h-[1.125rem] w-[1.125rem] flex-shrink-0",
                    isActive && "text-[hsl(var(--sidebar-active-foreground))]"
                  )} />
                  {isOpen && <span className="font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
