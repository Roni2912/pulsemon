import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger" | "warning";
  className?: string;
}

const variantStyles = {
  default: "text-primary",
  success: "text-green-600 dark:text-green-500",
  danger: "text-red-600 dark:text-red-500",
  warning: "text-yellow-600 dark:text-yellow-500",
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn("text-3xl font-bold", variantStyles[variant])}>
              {value}
            </p>
          </div>
          <Icon className={cn("h-8 w-8", variantStyles[variant])} />
        </div>
      </CardContent>
    </Card>
  );
}
