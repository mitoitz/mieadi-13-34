import { ReactNode } from "react";
import { usePermissions, Permission } from "@/hooks/usePermissions";
import { UserType } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  // Permissões específicas
  permissions?: Permission[];
  requireAll?: boolean; // Se true, requer todas as permissões. Se false, requer apenas uma
  // Roles específicos
  roles?: UserType[];
  // Componente customizado para exibir quando não autorizado
  fallback?: ReactNode;
  // Se true, não exibe nada quando não autorizado (em vez de mostrar o fallback)
  hideWhenUnauthorized?: boolean;
}

export function PermissionGuard({
  children,
  permissions = [],
  requireAll = false,
  roles = [],
  fallback,
  hideWhenUnauthorized = false,
}: PermissionGuardProps) {
  const { isAuthenticated, hasPermission, hasAnyPermission, hasAllPermissions, isRole } = usePermissions();

  // Se não estiver autenticado, não autorizar
  if (!isAuthenticated) {
    if (hideWhenUnauthorized) return null;
    return fallback || <UnauthorizedFallback message="Você precisa estar logado para acessar esta funcionalidade." />;
  }

  // Verificar permissões específicas
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      if (hideWhenUnauthorized) return null;
      return fallback || <UnauthorizedFallback message="Você não tem permissão para acessar esta funcionalidade." />;
    }
  }

  // Verificar roles específicos
  if (roles.length > 0) {
    const hasRequiredRole = isRole(roles);

    if (!hasRequiredRole) {
      if (hideWhenUnauthorized) return null;
      return fallback || <UnauthorizedFallback message="Seu perfil não tem acesso a esta funcionalidade." />;
    }
  }

  // Se passou em todas as verificações, renderizar o conteúdo
  return <>{children}</>;
}

// Componente de fallback padrão
function UnauthorizedFallback({ message }: { message: string }) {
  return (
    <Alert className="max-w-md mx-auto">
      <Lock className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// HOC para facilitar o uso
export function withPermission(
  Component: React.ComponentType<any>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) {
  return function PermissionWrappedComponent(props: any) {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}