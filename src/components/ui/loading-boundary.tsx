import React, { Suspense } from "react";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingBoundary({ 
  children, 
  fallback, 
  size = "md", 
  text = "Carregando..." 
}: LoadingBoundaryProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size={size} text={text} />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// Hook para componentes que precisam de loading
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Omit<LoadingBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <LoadingBoundary {...loadingProps}>
        <Component {...props} />
      </LoadingBoundary>
    );
  };
}