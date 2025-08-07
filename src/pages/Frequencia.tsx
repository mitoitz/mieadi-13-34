
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AttendanceReports } from "@/components/attendance/AttendanceReports";
import { AttendanceManager } from "@/components/attendance/AttendanceManager";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";
import { EventAttendanceManager } from "@/components/attendance/EventAttendanceManager";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Printer,
  Settings
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RegistroFrequencia {
  id: string;
  pessoa: {
    id: string;
    nome: string;
    codigo: string;
    congregacao: string;
    foto?: string;
  };
  evento: string;
  tipo: "terça" | "evento" | "aula";
  data: Date;
  horaRegistro: string;
  presente: boolean;
  metodoRegistro: "manual";
}

const mockRegistros: RegistroFrequencia[] = [
  {
    id: "1",
    pessoa: {
      id: "1",
      nome: "João Silva",
      codigo: "001",
      congregacao: "Central",
      foto: undefined
    },
    evento: "Reunião de Terça-feira",
    tipo: "terça",
    data: new Date(),
    horaRegistro: "19:30",
    presente: true,
    metodoRegistro: "manual"
  },
  {
    id: "2",
    pessoa: {
      id: "2",
      nome: "Maria Santos",
      codigo: "002",
      congregacao: "Bela Vista",
      foto: undefined
    },
    evento: "Teologia Sistemática I",
    tipo: "aula",
    data: new Date(),
    horaRegistro: "20:15",
    presente: true,
    metodoRegistro: "manual"
  }
];

export function Frequencia() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroFrequencia[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tipoEvento, setTipoEvento] = useState<string>("todos");
  const [loading, setLoading] = useState(false);

  // Carregar dados reais do banco
  useEffect(() => {
    loadAttendanceRecords();
  }, [selectedDate, tipoEvento]);

  const loadAttendanceRecords = async () => {
    setLoading(true);
    try {
      console.log('🔄 Carregando registros de frequência...');
      
      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          student_id,
          event_id,
          class_id,
          status,
          check_in_time,
          verification_method,
          notes,
          created_at,
          student:profiles(
            id,
            full_name,
            cpf,
            congregation_id,
            photo_url
          ),
          event:events(
            id,
            title,
            event_type
          ),
          class:classes(
            id,
            name
          )
        `);

      // Filtrar por data se selecionada
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.gte('created_at', `${dateStr}T00:00:00`)
                    .lt('created_at', `${dateStr}T23:59:59`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Erro ao carregar frequência:', error);
        toast.error("Erro ao carregar registros de frequência");
        return;
      }

      console.log('✅ Dados brutos recebidos:', data);
      console.log('✅ Registros carregados:', data?.length || 0);

      // Converter dados para o formato da interface
      const formattedRecords: RegistroFrequencia[] = (data || []).map(record => {
        console.log('🔍 Processando registro:', record);
        
         const eventObj = Array.isArray(record.event) ? record.event[0] : record.event;
         const classObj = Array.isArray(record.class) ? record.class[0] : record.class;
 
         return {
           id: record.id,
           pessoa: {
             id: (record.student as any)?.id || record.student_id,
             nome: (record.student as any)?.full_name || 'Nome não encontrado',
             codigo: (record.student as any)?.cpf?.substring(0, 6) || 'N/A',
             congregacao: 'Congregação',
             foto: (record.student as any)?.photo_url
           },
           evento: eventObj?.title || classObj?.name || 'Evento não identificado',
           tipo: eventObj?.event_type === 'aula' ? 'aula' : eventObj ? 'evento' : 'terça',
           data: new Date(record.created_at),
           horaRegistro: format(new Date(record.check_in_time || record.created_at), "HH:mm"),
           presente: record.status === 'presente',
           metodoRegistro: "manual"
         };
      });

      console.log('✅ Registros formatados:', formattedRecords);
      setRegistros(formattedRecords);
    } catch (error) {
      console.error('❌ Erro ao carregar frequência:', error);
      toast.error("Erro ao carregar registros");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceRecorded = (personId: string, method: string) => {
    console.log('🔄 Nova frequência registrada:', { personId, method });
    // Recarregar dados após novo registro
    loadAttendanceRecords();
    toast.success("Frequência registrada com sucesso!");
  };

  // Filtros e cálculos dos dados
  const filteredRegistros = registros.filter(registro => {
    const matchesSearch = registro.pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registro.pessoa.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registro.evento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || registro.data.toDateString() === selectedDate.toDateString();
    const matchesTipo = tipoEvento === "todos" || registro.tipo === tipoEvento;
    
    return matchesSearch && matchesDate && matchesTipo;
  });

  const totalPresentes = registros.filter(r => r.presente).length;
  const totalAusentes = registros.filter(r => !r.presente).length;
  const percentualPresenca = registros.length > 0 ? Math.round((totalPresentes / registros.length) * 100) : 0;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getMetodoIcon = (metodo: string) => {
    return <Clock className="w-4 h-4" />;
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "terça":
        return "Terça-feira";
      case "evento":
        return "Evento";
      case "aula":
        return "Aula";
      default:
        return tipo;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sistema Integrado de Presença</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Controle unificado com busca manual e registro de presença</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Presentes Hoje"
          value={totalPresentes.toString()}
          icon={CheckCircle}
          trend={{ value: 15, isPositive: true }}
        />
        <DashboardCard
          title="Ausentes Hoje"
          value={totalAusentes.toString()}
          icon={XCircle}
          trend={{ value: 5, isPositive: false }}
        />
        <DashboardCard
          title="% de Presença"
          value={`${percentualPresenca}%`}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard
          title="Registros Hoje"
          value={registros.length.toString()}
          icon={Clock}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      <Tabs defaultValue="controle-unificado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="controle-unificado">Controle Manual</TabsTrigger>
          <TabsTrigger value="registros">Histórico de Frequência</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="gerenciar">Upload TXT / Gerenciar</TabsTrigger>
        </TabsList>

        <TabsContent value="controle-unificado" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Controle Unificado de Presença</CardTitle>
                <p className="text-muted-foreground">
                  Sistema integrado com busca manual e registro de presença
                </p>
              </CardHeader>
              <CardContent>
                <AttendanceMarker onAttendanceMarked={handleAttendanceRecorded} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registros" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <CardTitle>Registros de Presença</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar pessoa ou evento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-[250px]"
                    />
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  <Select value={tipoEvento} onValueChange={setTipoEvento}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="terça">Terça-feira</SelectItem>
                      <SelectItem value="evento">Eventos</SelectItem>
                      <SelectItem value="aula">Aulas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando registros de frequência...</p>
                </div>
               ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 sm:p-4 font-medium text-sm">Pessoa</th>
                          <th className="text-left p-2 sm:p-4 font-medium text-sm hidden lg:table-cell">Evento/Aula</th>
                          <th className="text-left p-2 sm:p-4 font-medium text-sm hidden md:table-cell">Tipo</th>
                          <th className="text-left p-2 sm:p-4 font-medium text-sm">Data/Hora</th>
                          <th className="text-left p-2 sm:p-4 font-medium text-sm hidden sm:table-cell">Método</th>
                          <th className="text-left p-2 sm:p-4 font-medium text-sm">Status</th>
                          <th className="text-left p-2 sm:p-4 font-medium text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistros.map((registro) => (
                          <tr key={registro.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={registro.pessoa.foto} alt={registro.pessoa.nome} />
                                  <AvatarFallback>{getInitials(registro.pessoa.nome)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{registro.pessoa.nome}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Cód: {registro.pessoa.codigo} • {registro.pessoa.congregacao}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 hidden lg:table-cell">
                              <span className="text-sm">{registro.evento}</span>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <Badge variant="outline">
                                {getTipoLabel(registro.tipo)}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                <div>{format(registro.data, "dd/MM/yyyy", { locale: ptBR })}</div>
                                <div className="text-muted-foreground">{registro.horaRegistro}</div>
                              </div>
                            </td>
                            <td className="p-4 hidden sm:table-cell">
                              <div className="flex items-center gap-2">
                                {getMetodoIcon(registro.metodoRegistro)}
                                <span className="text-sm capitalize">{registro.metodoRegistro}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant={registro.presente ? "default" : "destructive"}>
                                {registro.presente ? "Presente" : "Ausente"}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Printer className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  Editar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredRegistros.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || selectedDate || tipoEvento !== "todos" 
                          ? "Tente ajustar os filtros de busca." 
                          : "Nenhum registro de frequência foi encontrado para hoje."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <AttendanceReports />
        </TabsContent>

        <TabsContent value="gerenciar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Upload TXT / Gerenciar Frequências
              </CardTitle>
              <p className="text-muted-foreground">
                Edite datas e turmas das frequências em lote ou faça upload de arquivos TXT
              </p>
            </CardHeader>
            <CardContent>
              <AttendanceManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
