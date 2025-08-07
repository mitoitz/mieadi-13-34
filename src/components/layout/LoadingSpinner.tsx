import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text = "Carregando..." }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-login-bg to-muted/50">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className={cn(
            "border-2 border-primary border-t-transparent rounded-full animate-spin",
            sizeClasses[size],
            className
          )} />
          <div className="absolute inset-0 rounded-full bg-gradient-glow animate-glow-pulse opacity-30" />
        </div>
        <div className="space-y-2">
          <p className={cn("text-muted-foreground font-medium", textSizes[size])}>
            {text}
          </p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}