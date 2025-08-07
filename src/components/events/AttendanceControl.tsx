import { useState } from "react";
import { Search, UserCheck, Printer, Users, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEvents } from "@/hooks/useEvents";
import { AttendanceCertificate } from "./AttendanceCertificate";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface AttendanceControlProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceControl({ eventId, open, onOpenChange }: AttendanceControlProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const { events, confirmAttendance, getEventAttendances } = useEvents();
  
  const event = events.find(e => e.id === eventId);
  const attendances = getEventAttendances(eventId);
  
  // Buscar pessoas/perfis do banco de dados
  const { data: people = [] } = useQuery({
    queryKey: ['profiles-for-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, email')
        .eq('status', 'ativo')
        .order('full_name');

      if (error) {
        console.error('Erro ao buscar perfis:', error);
        return [];
      }

      return data.map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.email || 'Nome não informado',
        document: profile.cpf || 'CPF não informado'
      }));
    },
    enabled: open // Só buscar quando o dialog estiver aberto
  });

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.document.includes(searchTerm)
  );

  const isPersonPresent = (personId: string) => {
    return attendances.some(att => att.student_id === personId || att.person_id === personId);
  };

  const handleConfirmAttendance = async (personId: string, personName: string) => {
    if (isPersonPresent(personId)) return;
    
    setIsConfirming(true);
    try {
      await confirmAttendance(eventId, personId, personName);
      // A impressão automática é simulada no hook useEvents
    } catch (error) {
      console.error("Erro ao confirmar presença:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Controle de Presença</DialogTitle>
          <DialogDescription>
            {event.title} - {attendances.length} pessoa(s) confirmada(s)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Total Presentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendances.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Printer className="h-4 w-4 mr-2" />
                  Comprovantes Impressos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendances.filter(att => att.certificate_printed).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {filteredPeople.map((person) => {
                const isPresent = isPersonPresent(person.id);
                const attendance = attendances.find(att => 
                  att.student_id === person.id || att.person_id === person.id
                );
                
                return (
                  <Card key={person.id} className={isPresent ? "border-green-200 bg-green-50/50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{person.name}</div>
                          <div className="text-sm text-muted-foreground">{person.document}</div>
                          {isPresent && attendance && (
                            <div className="text-xs text-green-600 mt-1">
                              Confirmado em {new Date(attendance.confirmed_at).toLocaleString("pt-BR")}
                              {attendance.certificate_printed && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  <Printer className="h-3 w-3 mr-1" />
                                  Impresso
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isPresent ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Presente
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmAttendance(person.id, person.name)}
                              disabled={isConfirming}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Confirmar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
          
          {attendances.length > 0 && (
            <div className="pt-4 border-t">
              <AttendanceCertificate 
                event={event}
                attendances={attendances}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}