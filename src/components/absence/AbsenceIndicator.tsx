import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AbsenceIndicatorProps {
  personName: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  className?: string;
}

export function AbsenceIndicator({ 
  personName, 
  reason, 
  startDate, 
  endDate, 
  isActive,
  className = "" 
}: AbsenceIndicatorProps) {
  if (!isActive) return null;

  const today = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  // Verificar se está no período de ausência
  const isCurrentlyAbsent = start && end && today >= start && today <= end;
  
  // Calcular dias restantes
  const daysRemaining = end ? Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-orange-800">
                {personName} - Ausência Programada
              </h4>
              <Badge variant={isCurrentlyAbsent ? "destructive" : "secondary"}>
                {isCurrentlyAbsent ? "Ausente" : "Programada"}
              </Badge>
            </div>
            
            {reason && (
              <p className="text-sm text-orange-700">
                <strong>Motivo:</strong> {reason}
              </p>
            )}
            
            {start && end && (
              <div className="flex items-center gap-4 text-sm text-orange-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(start, 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                    {format(end, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                
                {isCurrentlyAbsent && daysRemaining !== null && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {daysRemaining > 0 
                        ? `${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''}`
                        : 'Último dia'
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
              <strong>Durante este período:</strong> Não serão geradas notificações de ausência automática
              e o controle de presença será desconsiderado temporariamente.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AbsenceStatusBadgeProps {
  isAbsent: boolean;
  reason?: string;
  endDate?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AbsenceStatusBadge({ 
  isAbsent, 
  reason, 
  endDate,
  size = 'md' 
}: AbsenceStatusBadgeProps) {
  if (!isAbsent) return null;

  const today = new Date();
  const end = endDate ? new Date(endDate) : null;
  const daysRemaining = end ? Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge 
      variant="secondary" 
      className={`bg-orange-100 text-orange-800 border-orange-300 ${sizeClasses[size]}`}
      title={reason || 'Pessoa ausente'}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Ausente
      {daysRemaining !== null && daysRemaining > 0 && (
        <span className="ml-1">({daysRemaining}d)</span>
      )}
    </Badge>
  );
}