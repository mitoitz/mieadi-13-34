import * as React from "react";
import { cn } from "@/lib/utils";

interface MieadiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-24 w-24"
};

export function MieadiLogo({ 
  className, 
  size = "md", 
  showText = true 
}: MieadiLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img 
        src="/lovable-uploads/3781b316-2d9c-4e52-9847-bbf43a15c4fe.png"
        alt="MIEADI - Ministério Eclesiástico da Assembleia de Deus em Ipiranga"
        className={cn(sizeClasses[size], "object-contain")}
      />
      {showText && (
        <div className="flex flex-col">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            MIEADI
          </h1>
          <p className="text-xs text-muted-foreground">
            Sistema Acadêmico
          </p>
        </div>
      )}
    </div>
  );
}