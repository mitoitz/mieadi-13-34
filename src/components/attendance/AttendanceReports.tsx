import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ReportViewer, ReportActions } from "@/components/ui/report-viewer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//import { useAttendanceReport } from "@/hooks/useReportsData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  FileBarChart,
  Download,
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Eye,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAttendanceReport } from "@/hooks/useAttendanceReport";

const mockAttendanceData = [
  { date: "01/01", presentes: 85, ausentes: 15, total: 100 },
  { date: "02/01", presentes: 92, ausentes: 8, total: 100 },
  { date: "03/01", presentes: 78, ausentes: 22, total: 100 },
  { date: "04/01", presentes: 88, ausentes: 12, total: 100 },
  { date: "05/01", presentes: 95, ausentes: 5, total: 100 },
  { date: "06/01", presentes: 82, ausentes: 18, total: 100 },
  { date: "07/01", presentes: 90, ausentes: 10, total: 100 }
];

const mockEventAttendance = [
  { name: "Reunião de Terça", value: 78, color: "#3b82f6" },
  { name: "Culto de Domingo", value: 92, color: "#10b981" },
  { name: "Escola Dominical", value: 65, color: "#f59e0b" },
  { name: "Eventos Especiais", value: 55, color: "#8b5cf6" }
];

const mockMonthlyTrend = [
  { month: "Jan", attendance: 85 },
  { month: "Fev", attendance: 88 },
  { month: "Mar", attendance: 82 },
  { month: "Abr", attendance: 90 },
  { month: "Mai", attendance: 87 },
  { month: "Jun", attendance: 92 }
];

export function AttendanceReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [eventType, setEventType] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentReportContent, setCurrentReportContent] = useState<React.ReactNode>(null);

  const { toast } = useToast();

  // Buscar dados reais do banco
  const days = selectedPeriod === "7days" ? 7 : selectedPeriod === "90days" ? 90 : 30;
  const { data: reportData, isLoading } = useAttendanceReport(days);

  // Usar dados reais ou gerar dados baseados na data atual
  const dailyAttendance = reportData?.dailyAttendance || [];
  const eventAttendance = reportData?.eventAttendance || [];
  const monthlyTrend = reportData?.monthlyTrend || [];
  const stats = reportData?.stats || {
    averageAttendance: 0,
    totalPresent: 0,
    totalAbsent: 0,
    eventsHeld: 0
  };

  const exportReport = (type: 'pdf' | 'excel') => {
    toast({
      title: "Exportando relatório",
      description: `Relatório de frequência será exportado em formato ${type.toUpperCase()}.`,
    });
  };

  const generateDetailedReport = () => {
    toast({
      title: "Gerando relatório detalhado",
      description: "O relatório será gerado e enviado por email.",
    });
  };

  const viewReport = () => {
    const content = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Frequência Média</h4>
            <div className="text-2xl font-bold text-blue-600">87%</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Total de Presentes</h4>
            <div className="text-2xl font-bold text-green-600">2,847</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Total de Ausentes</h4>
            <div className="text-2xl font-bold text-red-600">423</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Eventos Realizados</h4>
            <div className="text-2xl font-bold text-purple-600">24</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold">Frequência por Tipo de Evento</h4>
          {eventAttendance.map((event, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="font-medium">{event.name}</div>
              <div className="text-center" style={{ color: event.color }}>{event.value}%</div>
              <div className="text-center">
                <Badge variant="outline" style={{ borderColor: event.color }}>
                  {event.value > 80 ? 'Excelente' : event.value > 60 ? 'Bom' : 'Precisa melhorar'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    
    setCurrentReportContent(content);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Frequência</h2>
          <p className="text-muted-foreground">Análise completa de presença e participação</p>
        </div>
        <ReportActions
          reportTitle="Relatório de Frequência"
          onView={viewReport}
          onPrint={() => {
            viewReport();
            setTimeout(() => window.print(), 500);
          }}
          onDownload={() => exportReport('pdf')}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                <SelectItem value="terca">Reunião de Terça</SelectItem>
                <SelectItem value="domingo">Culto de Domingo</SelectItem>
                <SelectItem value="escola">Escola Dominical</SelectItem>
                <SelectItem value="especiais">Eventos Especiais</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frequência Média</p>
                <p className="text-3xl font-bold">87%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="default" className="text-xs">
                +5% vs mês anterior
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Presentes</p>
                <p className="text-3xl font-bold">2,847</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Último mês
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Ausentes</p>
                <p className="text-3xl font-bold">423</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                13% do total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos Realizados</p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Este mês
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Frequência Diária</TabsTrigger>
          <TabsTrigger value="events">Por Tipo de Evento</TabsTrigger>
          <TabsTrigger value="trends">Tendências Mensais</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequência Diária - Presentes vs Ausentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dailyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="presentes" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981"
                    name="Presentes"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ausentes" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#ef4444"
                    name="Ausentes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Maior presença:</span>
                    <Badge variant="default">95 pessoas (05/01)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Menor presença:</span>
                    <Badge variant="destructive">78 pessoas (03/01)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Média de presença:</span>
                    <Badge variant="secondary">87 pessoas</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxa de crescimento:</span>
                    <Badge variant="default">+5.8%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dias da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { day: "Domingo", attendance: 95, color: "bg-green-500" },
                    { day: "Terça-feira", attendance: 82, color: "bg-blue-500" },
                    { day: "Quarta-feira", attendance: 65, color: "bg-yellow-500" },
                    { day: "Sexta-feira", attendance: 70, color: "bg-purple-500" }
                  ].map((item) => (
                    <div key={item.day} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm flex-1">{item.day}</span>
                      <span className="text-sm font-medium">{item.attendance}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequência por Tipo de Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventAttendance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventAttendance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  <h4 className="font-semibold">Detalhamento por Evento</h4>
                  {eventAttendance.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline">{item.value}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Frequência - Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Frequência (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análise de Tendências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600">Crescimento</h4>
                  <p className="text-2xl font-bold">+7%</p>
                  <p className="text-sm text-muted-foreground">vs período anterior</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-blue-600">Estabilidade</h4>
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-sm text-muted-foreground">frequência consistente</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-semibold text-purple-600">Meta</h4>
                  <p className="text-2xl font-bold">90%</p>
                  <p className="text-sm text-muted-foreground">objetivo 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {currentReportContent && (
        <ReportViewer
          title="Relatório de Frequência"
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        >
          {currentReportContent}
        </ReportViewer>
      )}
    </div>
  );
}