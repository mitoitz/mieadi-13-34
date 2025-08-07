import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  className?: string;
  variant?: "default" | "primary" | "secondary" | "accent";
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  className,
  variant = "default"
}: DashboardCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-primary";
      case "secondary":
        return "border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-secondary";
      case "accent":
        return "border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10";
      default:
        return "border-border hover:shadow-elegant";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-primary text-white";
      case "secondary":
        return "bg-gradient-secondary text-white";
      case "accent":
        return "bg-gradient-accent text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:-translate-y-1",
      getVariantStyles(),
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center",
          getIconStyles()
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{value}</div>
        
        {description && (
          <p className="text-xs text-muted-foreground mb-2">
            {description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          {trend && (
            <div className={cn(
              "text-xs font-medium flex items-center gap-1",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <span>{trend.isPositive ? "↗" : "↘"}</span>
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </div>
          )}
          
          {badge && (
            <Badge variant={badge.variant || "default"} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}