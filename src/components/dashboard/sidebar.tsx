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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-background border-r transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "w-64" : "w-0 lg:w-20"
        )}
      >
        <div className={cn(
          "flex flex-col h-full w-64 lg:w-auto",
          !isOpen && "lg:w-20"
        )}>
          {/* Header - matches dashboard header height */}
          <div className={cn(
            "flex items-center h-16 border-b",
            isOpen ? "justify-between px-4" : "justify-center"
          )}>
            {isOpen ? (
              <>
                <Link href="/dashboard" className="flex items-center">
                  <Image 
                    src="/logo1.png" 
                    alt="PulseMon" 
                    width={180} 
                    height={45}
                    className="w-auto h-auto max-h-28"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="hover:bg-transparent flex-shrink-0"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="hover:bg-transparent hidden lg:flex w-full h-full rounded-none p-0"
              >
                <Menu className="h-10 w-10" />
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
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    !isOpen && "lg:justify-center lg:px-0"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive && "text-primary-foreground"
                  )} />
                  {isOpen && <span className="font-medium text-sm">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
