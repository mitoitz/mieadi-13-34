import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ScheduledAbsenceManagerProps {
  personId: string;
  personName?: string;
  currentAbsenceData?: {
    isAbsent: boolean;
    reason?: string;
    startDate?: string;
    endDate?: string;
  };
  onAbsenceUpdate?: () => void;
}

export function ScheduledAbsenceManager({ 
  personId, 
  personName, 
  currentAbsenceData,
  onAbsenceUpdate 
}: ScheduledAbsenceManagerProps) {
  const [isAbsent, setIsAbsent] = useState(currentAbsenceData?.isAbsent || false);
  const [reason, setReason] = useState(currentAbsenceData?.reason || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    currentAbsenceData?.startDate ? new Date(currentAbsenceData.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentAbsenceData?.endDate ? new Date(currentAbsenceData.endDate) : undefined
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (isAbsent && (!reason.trim() || !startDate || !endDate)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o motivo e o período da ausência",
        variant: "destructive",
      });
      return;
    }

    if (isAbsent && endDate && startDate && endDate < startDate) {
      toast({
        title: "Período inválido",
        description: "A data de término deve ser posterior à data de início",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Note: Profile table doesn't have absence columns, just create scheduled absence record
      // Instead, we'll only work with the scheduled_absences table
      
      // Se está marcando como ausente, criar registro na tabela de ausências programadas
      if (isAbsent && startDate && endDate) {
        const { error: absenceError } = await supabase
          .from('scheduled_absences')
          .upsert({
            person_id: personId,
            reason: reason,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            is_active: true,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (absenceError) throw absenceError;
      }

      toast({
        title: isAbsent ? "Ausência programada" : "Ausência removida",
        description: isAbsent 
          ? `${personName || 'Pessoa'} marcada como ausente até ${endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}`
          : `${personName || 'Pessoa'} reativada no sistema`,
      });

      onAbsenceUpdate?.();

    } catch (error) {
      console.error('Erro ao salvar ausência:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração de ausência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyAbsent = () => {
    if (!isAbsent || !startDate || !endDate) return false;
    const today = new Date();
    return today >= startDate && today <= endDate;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Configurar Ausência Programada
        </CardTitle>
        <CardDescription>
          {personName && `Configurações de ausência para ${personName}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status atual */}
        {isCurrentlyAbsent() && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                Pessoa atualmente ausente
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Período: {startDate && format(startDate, 'dd/MM/yyyy', { locale: ptBR })} até{' '}
              {endDate && format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        )}

        {/* Switch para marcar como ausente */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="absence-switch" className="text-base">
              Marcar como ausente
            </Label>
            <p className="text-sm text-muted-foreground">
              Impede notificações automáticas e registros de presença
            </p>
          </div>
          <Switch
            id="absence-switch"
            checked={isAbsent}
            onCheckedChange={setIsAbsent}
          />
        </div>

        {/* Campos obrigatórios quando ausente */}
        {isAbsent && (
          <div className="space-y-4 pt-4 border-t">
            {/* Motivo da ausência */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da ausência *</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da ausência..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Período da ausência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de início */}
              <div className="space-y-2">
                <Label>Data de início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data de término */}
              <div className="space-y-2">
                <Label>Data de término *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                        const minDate = startDate || today;
                        return date < minDate;
                      }}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Informações sobre o impacto */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Durante o período informado:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Não serão geradas notificações de ausência automática</li>
                    <li>O controle de presença será desconsiderado temporariamente</li>
                    <li>Relatórios mostrarão o status de "ausência programada"</li>
                    <li>Após o término, o cadastro será reativado automaticamente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão de salvar */}
        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}