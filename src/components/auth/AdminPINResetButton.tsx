import { PINResetDialog } from "./PINResetDialog";
import { useAuth } from "@/hooks/useAuth";

export function AdminPINResetButton() {
  const { user } = useAuth();

  // Get user role from auth context
  const userRole = user?.role || '';

  return <PINResetDialog userRole={userRole} />;
}