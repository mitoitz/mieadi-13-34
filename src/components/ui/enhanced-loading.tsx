import { cn } from "@/lib/utils";
import { Loader2, Wifi, AlertCircle, CheckCircle } from "lucide-react";

interface EnhancedLoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "wave";
  text?: string;
  description?: string;
  className?: string;
  overlay?: boolean;
  status?: "loading" | "success" | "error";
}

const sizeConfig = {
  sm: { icon: "h-4 w-4", text: "text-sm" },
  md: { icon: "h-6 w-6", text: "text-base" },
  lg: { icon: "h-8 w-8", text: "text-lg" },
  xl: { icon: "h-12 w-12", text: "text-xl" },
};

export function EnhancedLoading({
  size = "md",
  variant = "spinner",
  text,
  description,
  className,
  overlay = false,
  status = "loading",
}: EnhancedLoadingProps) {
  const config = sizeConfig[size];

  const getIcon = () => {
    if (status === "success") {
      return <CheckCircle className={cn(config.icon, "text-green-600")} />;
    }
    if (status === "error") {
      return <AlertCircle className={cn(config.icon, "text-red-600")} />;
    }

    switch (variant) {
      case "spinner":
        return <Loader2 className={cn(config.icon, "animate-spin")} />;
      case "dots":
        return (
          <div className="flex space-x-1">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        );
      case "pulse":
        return (
          <div className={cn(config.icon, "bg-primary rounded-full animate-pulse")} />
        );
      case "wave":
        return <Wifi className={cn(config.icon, "animate-pulse")} />;
      default:
        return <Loader2 className={cn(config.icon, "animate-spin")} />;
    }
  };

  const getText = () => {
    if (status === "success") return "Concluído com sucesso!";
    if (status === "error") return "Ocorreu um erro";
    return text || "Carregando...";
  };

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3 p-6",
      className
    )}>
      {getIcon()}
      {(text || status !== "loading") && (
        <div className="text-center">
          <p className={cn("font-medium", config.text)}>
            {getText()}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-center min-h-screen">
          {content}
        </div>
      </div>
    );
  }

  return content;
}