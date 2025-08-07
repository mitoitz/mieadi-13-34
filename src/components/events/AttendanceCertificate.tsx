import { useState, useEffect } from "react";
import { Printer, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { thermalPrinter } from "@/services/thermal-printer.service";
import type { Event, EventAttendance } from "@/hooks/useEvents";

interface AttendanceCertificateProps {
  event: Event;
  attendances: EventAttendance[];
}

export function AttendanceCertificate({ event, attendances }: AttendanceCertificateProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [queueStatus, setQueueStatus] = useState({ total: 0, pending: 0, printing: 0, completed: 0, failed: 0, isPrinting: false });
  const { toast } = useToast();

  // Atualizar status da fila periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      // Update queue status if needed
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const generateCertificateContent = (attendance: EventAttendance) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    return `
╔══════════════════════════════════════════════════════════════╗
║                    COMPROVANTE DE PRESENÇA                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Evento: ${event.title.padEnd(48)} ║
║  ${event.description ? `Descrição: ${event.description.slice(0, 44).padEnd(44)}` : ''.padEnd(56)} ║
║                                                              ║
║  Participante: ${attendance.person_name.padEnd(42)} ║
║                                                              ║
║  Data: ${format(startDate, "dd/MM/yyyy", { locale: ptBR }).padEnd(48)} ║
║  Horário: ${format(startDate, "HH:mm", { locale: ptBR })} às ${format(endDate, "HH:mm", { locale: ptBR }).padEnd(35)} ║
║  ${event.location ? `Local: ${event.location.slice(0, 48).padEnd(48)}` : ''.padEnd(56)} ║
║                                                              ║
║  Confirmado em: ${format(new Date(attendance.confirmed_at), "dd/MM/yyyy HH:mm", { locale: ptBR }).padEnd(36)} ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Este comprovante foi gerado automaticamente pelo sistema.
Documento válido para comprovação de presença.

ID do Evento: ${event.id}
ID da Confirmação: ${attendance.id}
    `.trim();
  };

  const printCertificate = async (attendance: EventAttendance) => {
    try {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      
      await thermalPrinter.printReceipt({
        id: attendance.id,
        studentName: attendance.person_name,
        eventTitle: event.title,
        date: format(startDate, "dd/MM/yyyy"),
        time: `${format(startDate, "HH:mm")} às ${format(endDate, "HH:mm")}`,
        location: event.location,
        additionalInfo: { eventId: event.id, attendanceId: attendance.id }
      });
      
      toast({
        title: "Adicionado à fila",
        description: `Comprovante de ${attendance.person_name} adicionado à fila de impressão.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro na impressão",
        description: "Não foi possível adicionar à fila de impressão.",
        variant: "destructive",
      });
    }
  };

  const downloadCertificate = (attendance: EventAttendance) => {
    const certificateContent = generateCertificateContent(attendance);
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprovante-${attendance.person_name.replace(/\s+/g, '-')}-${event.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printAllCertificates = async () => {
    setIsPrinting(true);
    try {
      for (const attendance of attendances) {
        await printCertificate(attendance);
      }
      
      toast({
        title: "Todos adicionados à fila",
        description: `${attendances.length} comprovante(s) adicionado(s) à fila de impressão.`,
      });
    } catch (error) {
      toast({
        title: "Erro na impressão",
        description: "Erro ao adicionar comprovantes à fila.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span className="font-medium">Comprovantes de Presença</span>
          {queueStatus.total > 0 && (
            <Badge variant="outline">
              Fila: {queueStatus.pending + queueStatus.printing}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {queueStatus.isPrinting && (
            <Badge variant="default" className="animate-pulse">
              <Printer className="h-3 w-3 mr-1" />
              Imprimindo...
            </Badge>
          )}
          <Button
            onClick={printAllCertificates}
            disabled={isPrinting || attendances.length === 0}
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? "Adicionando..." : "Imprimir Todos"}
          </Button>
        </div>
      </div>

      {/* Status da fila de impressão */}
      {queueStatus.total > 0 && (
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>Pendentes: {queueStatus.pending}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Printer className="h-3 w-3" />
            <span>Imprimindo: {queueStatus.printing}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Concluídos: {queueStatus.completed}</span>
          </div>
          {queueStatus.failed > 0 && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>Falhas: {queueStatus.failed}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-32 overflow-y-auto">
        {attendances.map((attendance) => (
          <div key={attendance.id} className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm">{attendance.person_name}</span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadCertificate(attendance)}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                onClick={() => printCertificate(attendance)}
                disabled={isPrinting || queueStatus.isPrinting}
              >
                <Printer className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}