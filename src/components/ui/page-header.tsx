import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  showBackButton = false,
  backButtonText = "Voltar",
  children,
  className,
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("space-y-6 animate-fade-in-up", className)}>
      {/* Header principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-2 -ml-2 hover:bg-primary/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backButtonText}
            </Button>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gradient">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground lg:text-lg">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Conteúdo adicional */}
      {children && (
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          {children}
        </div>
      )}
    </div>
  );
}