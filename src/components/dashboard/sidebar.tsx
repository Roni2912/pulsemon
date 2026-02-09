"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Monitor,
  AlertCircle,
  BarChart3,
  Globe,
  Settings,
  Menu,
  X,
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
          "fixed top-0 left-0 z-50 h-screen bg-background border-r transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-0 lg:w-16"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            {isOpen ? (
              <Link href="/dashboard" className="flex items-center space-x-3">
                <Image 
                  src="/logo.png" 
                  alt="PulseMon Logo" 
                  width={40} 
                  height={40}
                  className="h-10 w-10"
                />
                <span className="font-bold text-xl">PulseMon</span>
              </Link>
            ) : (
              <Link href="/dashboard" className="flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="PulseMon Logo" 
                  width={32} 
                  height={32}
                  className="h-8 w-8"
                />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn("ml-auto", !isOpen && "hidden lg:flex")}
            >
              {isOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    !isOpen && "lg:justify-center"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className="p-4">
            {isOpen ? (
              <div className="text-xs text-muted-foreground">
                <p>© 2024 PulseMon</p>
                <p>v1.0.0</p>
              </div>
            ) : (
              <div className="h-8" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
