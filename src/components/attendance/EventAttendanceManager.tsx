import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { 
  Calendar,
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  UserPlus,
  Settings,
  BookOpen
} from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useEnrollmentData } from "@/hooks/useEnrollmentData";
import { eventsService } from "@/services/events.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventMaterial {
  id: string;
  title: string;
  description?: string;
  material_type: string;
  file_url?: string;
}

export function EventAttendanceManager() {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [materials, setMaterials] = useState<EventMaterial[]>([]);
  
  const { events, isLoading: eventsLoading } = useEvents();
  const { students, classes, loading: dataLoading } = useEnrollmentData();

  // Carregar dados quando componente monta
  useEffect(() => {
    loadMaterials();
  }, []);

  // Carregar frequência quando evento é selecionado
  useEffect(() => {
    if (selectedEvent) {
      loadEventAttendance();
    }
  }, [selectedEvent]);

  const loadMaterials = async () => {
    try {
      // Simulação de materiais - pode ser substituído por chamada real ao banco
      const mockMaterials = [
        { id: "1", title: "Apostila - Teologia Sistemática", material_type: "document" },
        { id: "2", title: "Slides - Hermenêutica Bíblica", material_type: "presentation" },
        { id: "3", title: "Vídeo - Homilética Prática", material_type: "video" }
      ];
      setMaterials(mockMaterials);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    }
  };

  const loadEventAttendance = async () => {
    if (!selectedEvent) return;
    
    try {
      const records = await eventsService.buscarFrequenciaEvento(selectedEvent);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Erro ao carregar frequência:', error);
      toast.error("Erro ao carregar registros de frequência");
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'presente' | 'ausente') => {
    if (!selectedEvent) {
      toast.error("Selecione um evento primeiro");
      return;
    }

    setIsRecording(true);
    try {
      await eventsService.registrarFrequencia({
        student_id: studentId,
        event_id: selectedEvent,
        status,
        verification_method: 'manual',
        notes: attendanceNotes,
        check_in_time: status === 'presente' ? new Date().toISOString() : undefined
      });

      await loadEventAttendance();
      toast.success(`Frequência registrada: ${status}`);
      setAttendanceNotes("");
    } catch (error) {
      console.error('Erro ao registrar frequência:', error);
      toast.error("Erro ao registrar frequência");
    } finally {
      setIsRecording(false);
    }
  };

  const selectedEventData = events.find(e => e.id === selectedEvent);
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStatus = (studentId: string) => {
    return attendanceRecords.find(record => record.student_id === studentId);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start_datetime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-6">
      {/* Seleção de Evento e Material */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração da Frequência
          </CardTitle>
          <p className="text-muted-foreground">
            Selecione o evento e material antes de iniciar o controle de presença
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-select">Selecionar Evento/Aula</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um evento ou aula" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 font-semibold text-sm text-muted-foreground border-b">
                    Eventos de Hoje
                  </div>
                  {todayEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(event.start_datetime), "HH:mm", { locale: ptBR })} - {event.event_type}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="p-2 font-semibold text-sm text-muted-foreground border-b">
                    Todos os Eventos
                  </div>
                  {events.filter(e => !todayEvents.includes(e)).map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(event.start_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="material-select">Material do Dia (Opcional)</Label>
              <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o material utilizado" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{material.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {material.material_type}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedEventData && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Evento Selecionado</span>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Título:</strong> {selectedEventData.title}</div>
                <div><strong>Data/Hora:</strong> {format(new Date(selectedEventData.start_datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                {selectedEventData.description && (
                  <div><strong>Descrição:</strong> {selectedEventData.description}</div>
                )}
                <div><strong>Presenças:</strong> {attendanceRecords.length} registradas</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controle de Frequência */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Controle de Presença
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alunos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {attendanceRecords.filter(r => r.status === 'presente').length} de {filteredStudents.length} presentes
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const attendance = getAttendanceStatus(student.id);
                
                return (
                  <Card key={student.id} className={`transition-colors ${
                    attendance?.status === 'presente' ? 'border-green-200 bg-green-50/50' :
                    attendance?.status === 'ausente' ? 'border-red-200 bg-red-50/50' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.email}
                            </div>
                            {attendance && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Registrado em {format(new Date(attendance.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {attendance ? (
                            <Badge variant={attendance.status === 'presente' ? 'default' : 'destructive'}>
                              {attendance.status === 'presente' ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Presente</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Ausente</>
                              )}
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, 'presente')}
                                disabled={isRecording}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Presente
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAttendance(student.id, 'ausente')}
                                disabled={isRecording}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Ausente
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente ajustar o termo de busca." : "Não há alunos disponíveis para este evento."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedEvent && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um Evento</h3>
            <p className="text-muted-foreground">
              Escolha um evento ou aula acima para iniciar o controle de frequência
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notas para Frequência */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione observações sobre esta sessão de frequência..."
              value={attendanceNotes}
              onChange={(e) => setAttendanceNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}