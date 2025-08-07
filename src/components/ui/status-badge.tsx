import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue' | 'completed';
  text?: string;
  className?: string;
}

const statusConfig = {
  active: { variant: 'success' as const, text: 'Ativo' },
  inactive: { variant: 'secondary' as const, text: 'Inativo' },
  pending: { variant: 'warning' as const, text: 'Pendente' },
  approved: { variant: 'success' as const, text: 'Aprovado' },
  rejected: { variant: 'destructive' as const, text: 'Rejeitado' },
  paid: { variant: 'success' as const, text: 'Pago' },
  overdue: { variant: 'destructive' as const, text: 'Atrasado' },
  completed: { variant: 'info' as const, text: 'Concluído' },
};

export function StatusBadge({ status, text, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn("text-xs font-medium", className)}
    >
      {text || config.text}
    </Badge>
  );
}