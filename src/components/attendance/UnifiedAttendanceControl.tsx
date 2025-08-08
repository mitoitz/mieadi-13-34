import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  User, 
  CheckCircle, 
  Clock,
  UserCheck,
  Users,
  Eye,
  Activity,
  Calendar,
  BookOpen,
  QrCode,
  Camera,
  Scan
} from "lucide-react";
import { QRCodeScanner } from "./QRCodeScanner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Person {
  id: string;
  full_name: string;
  cpf: string;
  qr_code?: string;
  photo_url?: string;
  role: string;
  congregation_id?: string;
  badge_number?: string;
}

interface AttendanceRecord {
  id: string;
  person: Person;
  method: 'manual' | 'qr_code';
  timestamp: string;
  verification_data?: any;
  subject_name?: string;
  event_title?: string;
}

interface TodaySubject {
  id: string;
  name: string;
  code: string;
  class_id: string;
  class_name: string;
  professor_name: string;
}

interface EventOption {
  id: string;
  title: string;
  description?: string;
}

interface UnifiedAttendanceControlProps {
  eventId?: string;
  classId?: string;
  onAttendanceUpdate?: (records: AttendanceRecord[]) => void;
}

export function UnifiedAttendanceControl({ 
  eventId, 
  classId, 
  onAttendanceUpdate 
}: UnifiedAttendanceControlProps) {
  const [activeTab, setActiveTab] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [todaySubjects, setTodaySubjects] = useState<TodaySubject[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventOption[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  
  const { toast } = useToast();

  // Load existing attendance records and today's subjects
  useEffect(() => {
    loadAttendanceRecords();
    loadTodaySubjects();
    loadAvailableEvents();
  }, [eventId, classId]);

  const loadTodaySubjects = async () => {
    if (classId) return; // Se já tem classId, não precisa buscar disciplinas
    
    setIsLoadingSubjects(true);
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          class_id,
          classes!inner (
            id,
            name,
            professor_id,
            class_subjects!inner (
              subject_id,
              subjects!inner (
                id,
                name,
                code
              )
            )
          )
        `)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;

       const subjects: TodaySubject[] = (data || []).map(schedule => {
         const classInfo = Array.isArray(schedule.classes) ? schedule.classes[0] : schedule.classes;
         const classSubjects = classInfo?.class_subjects ? (Array.isArray(classInfo.class_subjects) ? classInfo.class_subjects : [classInfo.class_subjects]) : [];
         const subjectInfo = classSubjects?.[0] ? (Array.isArray(classSubjects[0].subjects) ? classSubjects[0].subjects[0] : classSubjects[0].subjects) : null;
         const professorInfo = classInfo ? (Array.isArray(classInfo.profiles) ? classInfo.profiles[0] : classInfo.profiles) : null;
         
         return {
           id: subjectInfo?.id || '',
           name: subjectInfo?.name || '',
           code: subjectInfo?.code || '',
           class_id: classInfo?.id || '',
           class_name: classInfo?.name || '',
           professor_name: professorInfo?.full_name || ''
         };
       }).filter(subject => subject.id);

      setTodaySubjects(subjects);
    } catch (error: any) {
      console.error('Error loading today subjects:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const loadAvailableEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_type')
        .eq('event_type', 'evento')
        .gte('start_datetime', today)
        .lte('start_datetime', today + 'T23:59:59');

      if (error) throw error;

      const events: EventOption[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined
      }));

      setAvailableEvents(events);
    } catch (error: any) {
      console.error('Error loading available events:', error);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          check_in_time,
          verification_method,
          student_id,
          event_id,
          class_id,
          notes,
          student:profiles (
            id,
            full_name,
            cpf,
            photo_url,
            role,
            badge_number
          ),
          event:events (
            title
          ),
          class:classes (
            name
          )
        `)
        .order('check_in_time', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const records: AttendanceRecord[] = (data || []).map(record => {
        const profile = (record as any).student;
        const event = (record as any).event;
        const classInfo = (record as any).class;
        
        return {
          id: record.id,
          person: {
            id: profile?.id || '',
            full_name: profile?.full_name || '',
            cpf: profile?.cpf || '',
            photo_url: profile?.photo_url || '',
            role: profile?.role || '',
            badge_number: profile?.badge_number || ''
          },
          method: 'manual' as const,
          timestamp: record.check_in_time,
          verification_data: {},
          subject_name: classInfo?.name,
          event_title: event?.title
        };
      });

      setAttendanceRecords(records);
      onAttendanceUpdate?.(records);
    } catch (error: any) {
      console.error('Error loading attendance records:', error);
    }
  };

  const searchPeople = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Usar função otimizada do banco para busca
      const { data, error } = await supabase
        .rpc('search_people', { search_term: term });

      if (error) throw error;
      
      // Filtrar apenas pessoas ativas e converter para o formato esperado
      const activePeople: Person[] = (data || [])
        .filter(person => person.status === 'ativo')
        .map(person => ({
          id: person.id,
          full_name: person.full_name,
          cpf: person.cpf || '',
          qr_code: person.qr_code,
          photo_url: person.photo_url,
          role: person.role,
          congregation_id: person.congregation_name,
          badge_number: person.badge_number
        }))
        .slice(0, 20); // Limitar a 20 resultados

      setSearchResults(activePeople);
    } catch (error: any) {
      console.error('Error searching people:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar pessoas",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for QR Code scanning
  const handleQRCodeScan = async (qrData: string) => {
    try {
      console.log('QR Code escaneado:', qrData);
      
      let person = null;
      
      // Extract user ID from QR code format: MIEADI_USER_{userId}
      if (qrData.startsWith('MIEADI_USER_')) {
        const userId = qrData.replace('MIEADI_USER_', '');
        
        // Search for person by user ID
        const { data: personData, error } = await supabase
          .from('profiles')
          .select('id, full_name, cpf, photo_url, role, badge_number')
          .eq('id', userId)
          .eq('status', 'ativo')
          .single();
          
        if (error || !personData) {
          toast({
            title: "QR Code inválido",
            description: "Usuário não encontrado no sistema",
            variant: "destructive"
          });
          return;
        }
        
        person = personData;
      } else {
        // Try to find person by badge number or QR code
        const { data: personData, error } = await supabase
          .from('profiles')
          .select('id, full_name, cpf, photo_url, role, badge_number')
          .or(`badge_number.eq.${qrData},qr_code.eq.${qrData}`)
          .eq('status', 'ativo')
          .single();
          
        if (error || !personData) {
          toast({
            title: "QR Code não reconhecido",
            description: "Pessoa não encontrada no sistema",
            variant: "destructive"
          });
          return;
        }
        
        person = personData;
      }

      // Check for duplicate attendance before marking
      const today = new Date().toISOString().split('T')[0];
      const currentEventId = eventId || selectedEvent;
      const currentClassId = classId || (selectedSubject ? todaySubjects.find(s => s.id === selectedSubject)?.class_id : undefined);
      
      const existingRecord = attendanceRecords.find(
        record => record.person.id === person.id && 
        record.timestamp.startsWith(today) &&
        (!currentEventId || record.verification_data?.event_id === currentEventId) &&
        (!currentClassId || record.verification_data?.class_id === currentClassId)
      );

      if (existingRecord) {
        toast({
          title: "Presença já registrada",
          description: `${person.full_name} já teve presença registrada hoje via ${getMethodName(existingRecord.method)}`,
          variant: "default"
        });
        return;
      }
      
      await markAttendance(person, 'qr_code', { qr_data: qrData });
    } catch (error: any) {
      console.error('Erro ao processar QR Code:', error);
      toast({
        title: "Erro no QR Code",
        description: error.message || "Não foi possível processar o QR Code",
        variant: "destructive"
      });
    }
  };


  const markAttendance = async (person: Person, method: 'manual' | 'qr_code', verificationData?: any) => {
    try {
      // Check context and validate selection
      if (!classId && !eventId) {
        // For students, require subject selection
        if (person.role === 'aluno' && !selectedSubject && todaySubjects.length > 0) {
          toast({
            title: "Selecione a disciplina",
            description: "Para alunos, é necessário selecionar a disciplina do dia",
            variant: "destructive"
          });
          return;
        }
        
        // For non-class attendance, require event selection if no subject
        if (!selectedSubject && !selectedEvent && availableEvents.length > 0) {
          toast({
            title: "Selecione o evento",
            description: "É necessário selecionar o evento para registrar a presença",
            variant: "destructive"
          });
          return;
        }
      }

      // Determine current context
      const today = new Date().toISOString().split('T')[0];
      const currentEventId = eventId || selectedEvent;
      const currentClassId = classId || (selectedSubject ? todaySubjects.find(s => s.id === selectedSubject)?.class_id : undefined);
      
      // Check for existing attendance in database (more reliable than memory)
      let duplicateQuery = supabase
        .from('attendance_records')
        .select('id, check_in_time')
        .eq('student_id', person.id)
        .gte('check_in_time', today + 'T00:00:00.000Z')
        .lt('check_in_time', today + 'T23:59:59.999Z');

      // Add context-specific filters
      if (currentEventId) {
        duplicateQuery = duplicateQuery.eq('event_id', currentEventId);
      }
      if (currentClassId) {
        duplicateQuery = duplicateQuery.eq('class_id', currentClassId);
      }

      const { data: existingAttendance, error: checkError } = await duplicateQuery;

      if (checkError) {
        console.error('Error checking existing attendance:', checkError);
        throw checkError;
      }

      if (existingAttendance && existingAttendance.length > 0) {
        const existingTime = new Date(existingAttendance[0].check_in_time).toLocaleTimeString('pt-BR');
        toast({
          title: "Presença já registrada",
          description: `${person.full_name} já teve presença registrada hoje às ${existingTime}`,
          variant: "destructive"
        });
        return;
      }

      // Also check in memory records as backup
      const existingRecord = attendanceRecords.find(
        record => record.person.id === person.id && 
        record.timestamp.startsWith(today) &&
        (currentEventId ? record.verification_data?.event_id === currentEventId : true) &&
        (currentClassId ? record.verification_data?.class_id === currentClassId : true)
      );

      if (existingRecord) {
        toast({
          title: "Presença já registrada",
          description: `${person.full_name} já teve presença registrada hoje`,
          variant: "destructive"
        });
        return;
      }

      // Prepare attendance data
      const selectedSubjectData = selectedSubject ? todaySubjects.find(s => s.id === selectedSubject) : null;
      const selectedEventData = selectedEvent ? availableEvents.find(e => e.id === selectedEvent) : null;
      
      const attendanceData = {
        student_id: person.id,
        event_id: currentEventId || null,
        class_id: currentClassId || null,
        status: 'presente',
        check_in_time: new Date().toISOString(),
        verification_method: method,
        attendance_type: 'presenca',
        notes: `Presença registrada via ${method} - ${selectedSubjectData ? `Disciplina: ${selectedSubjectData.name}` : selectedEventData ? `Evento: ${selectedEventData.title}` : 'Manual'}`,
        location_data: {
          ...verificationData,
          subject_id: selectedSubject || null,
          event_id: currentEventId || null,
          class_id: currentClassId || null
        }
      };

      console.log('Registrando presença:', attendanceData);

      const { data: insertedData, error } = await supabase
        .from('attendance_records')
        .insert(attendanceData)
        .select();

      if (error) {
        console.error('Erro ao inserir registro:', error);
        throw error;
      }

      console.log('Presença registrada com sucesso:', insertedData);

      // Create new record for UI
      const newRecord: AttendanceRecord = {
        id: insertedData[0]?.id || `temp-${Date.now()}`,
        person,
        method,
        timestamp: new Date().toISOString(),
        verification_data: verificationData,
        subject_name: selectedSubjectData?.name,
        event_title: selectedEventData?.title
      };

      const updatedRecords = [newRecord, ...attendanceRecords];
      setAttendanceRecords(updatedRecords);
      onAttendanceUpdate?.(updatedRecords);

      // Show success notification
      const contextInfo = selectedSubjectData ? selectedSubjectData.name : selectedEventData ? selectedEventData.title : 'Presença manual';
      
      toast({
        title: "✅ Presença confirmada!",
        description: `${person.full_name} - ${contextInfo} às ${new Date().toLocaleTimeString()}`,
        duration: 4000,
      });

      // Clear search and selections
      if (method === 'manual') {
        setSearchTerm("");
        setSearchResults([]);
        setSelectedPerson(null);
      }

      // Reload to get fresh data
      setTimeout(() => {
        loadAttendanceRecords();
      }, 500);

    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Erro ao marcar presença",
        description: error.message || "Não foi possível registrar a presença",
        variant: "destructive"
      });
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'manual':
        return <User className="w-4 h-4 text-green-600" />;
      case 'qr_code':
        return <QrCode className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'manual':
        return 'Manual';
      case 'qr_code':
        return 'QR Code';
      default:
        return 'Desconhecido';
    }
  };

  // Get today's records for statistics
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(record => 
    record.timestamp.startsWith(today)
  );

  return (
    <div className="w-full space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {todayRecords.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Hoje</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {todayRecords.filter(r => r.method === 'manual').length}
                </p>
                <p className="text-sm text-muted-foreground">Via Manual</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {attendanceRecords.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Geral</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Dialog open={showAttendanceHistory} onOpenChange={setShowAttendanceHistory}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Histórico
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Histórico de Presença</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {attendanceRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={record.person.photo_url} />
                        <AvatarFallback>
                          {record.person.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{record.person.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.person.badge_number && `#${record.person.badge_number} • `}
                          {record.person.cpf}
                        </p>
                        {(record.subject_name || record.event_title) && (
                          <p className="text-xs text-primary">
                            {record.subject_name ? `Disciplina: ${record.subject_name}` : `Evento: ${record.event_title}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {getMethodIcon(record.method)}
                      <span>{getMethodName(record.method)}</span>
                      <span className="text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Control */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Busca Manual
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code
          </TabsTrigger>
        </TabsList>

        {/* Search and Register Tab */}
        <TabsContent value="search" className="space-y-4">
          {/* Context Selection */}
          {!classId && !eventId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Contexto da Presença
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject Selection for Students */}
                {todaySubjects.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="subject-select">Disciplina do Dia (para alunos)</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingSubjects ? "Carregando..." : "Selecione a disciplina"} />
                      </SelectTrigger>
                      <SelectContent>
                        {todaySubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{subject.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {subject.code} - {subject.class_name} - Prof. {subject.professor_name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Event Selection */}
                {availableEvents.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="event-select">Evento (quando não for aula)</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{event.title}</span>
                              {event.description && (
                                <span className="text-sm text-muted-foreground">{event.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Current Context Display */}
                {(selectedSubject || selectedEvent) && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">Contexto Selecionado:</span>
                    </div>
                    {selectedSubject && (
                      <p className="text-sm mt-1">
                        Disciplina: {todaySubjects.find(s => s.id === selectedSubject)?.name}
                      </p>
                    )}
                    {selectedEvent && (
                      <p className="text-sm mt-1">
                        Evento: {availableEvents.find(e => e.id === selectedEvent)?.title}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar e Registrar Presença
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite nome, CPF ou número da credencial..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchPeople(e.target.value);
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={() => searchPeople(searchTerm)}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((person) => {
                    const isAlreadyMarked = todayRecords.some(record => record.person.id === person.id);
                    
                    return (
                      <div
                        key={person.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={person.photo_url} />
                            <AvatarFallback>
                              {person.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{person.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {person.badge_number && `#${person.badge_number} • `}
                              CPF: {person.cpf} • {person.role}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isAlreadyMarked ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Presente
                            </Badge>
                          ) : (
                            <Button 
                              onClick={() => {
                                setSelectedPerson(person);
                                markAttendance(person, 'manual');
                              }}
                              size="sm"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Marcar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {searchTerm && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma pessoa encontrada para "{searchTerm}"</p>
                  <p className="text-sm">Tente buscar por nome, CPF ou número da credencial</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Code Tab */}
        <TabsContent value="qr" className="space-y-4">
          {/* Context Selection - Same as manual */}
          {!classId && !eventId && (selectedSubject || selectedEvent || todaySubjects.length > 0 || availableEvents.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Contexto da Presença
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject Selection for Students */}
                {todaySubjects.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="subject-select-qr">Disciplina do Dia (para alunos)</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingSubjects ? "Carregando..." : "Selecione a disciplina"} />
                      </SelectTrigger>
                      <SelectContent>
                        {todaySubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{subject.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {subject.code} - {subject.class_name} - Prof. {subject.professor_name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Event Selection */}
                {availableEvents.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="event-select-qr">Evento (quando não for aula)</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{event.title}</span>
                              {event.description && (
                                <span className="text-sm text-muted-foreground">{event.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Current Context Display */}
                {(selectedSubject || selectedEvent) && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">Contexto Selecionado:</span>
                    </div>
                    {selectedSubject && (
                      <p className="text-sm mt-1">
                        Disciplina: {todaySubjects.find(s => s.id === selectedSubject)?.name}
                      </p>
                    )}
                    {selectedEvent && (
                      <p className="text-sm mt-1">
                        Evento: {availableEvents.find(e => e.id === selectedEvent)?.title}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <QRCodeScanner 
            onScanResult={handleQRCodeScan}
            onError={(error) => {
              toast({
                title: "Erro no QR Code",
                description: error,
                variant: "destructive"
              });
            }}
          />
        </TabsContent>

      </Tabs>

      {/* Recent Activity */}
      {todayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade Recente (Hoje)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todayRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={record.person.photo_url} />
                      <AvatarFallback className="text-xs">
                        {record.person.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{record.person.full_name}</span>
                    {getMethodIcon(record.method)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(record.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}