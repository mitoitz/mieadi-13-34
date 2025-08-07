
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportViewer } from "@/components/ui/report-viewer";
import { 
  FileText, 
  Download, 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  PieChart,
  BarChart3,
  Eye,
  Printer
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReportData {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageGrade: number;
}

export function Relatorios() {
  const [reportData, setReportData] = useState<ReportData>({
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    averageGrade: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<{ title: string; content: React.ReactNode } | null>(null);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      // Carregar dados dos estudantes
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'aluno');

      if (studentsError) throw studentsError;

      // Carregar dados das turmas
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id');

      if (classesError) throw classesError;

      // Carregar dados das disciplinas
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id');

      if (subjectsError) throw subjectsError;

      // Carregar dados das matrículas usando a tabela enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('status, final_grade');

      if (enrollmentsError) throw enrollmentsError;

      const activeEnrollments = enrollments?.filter(e => e.status === 'ativa').length || 0;
      const completedEnrollments = enrollments?.filter(e => e.status === 'inativa').length || 0;
      const gradesArray = enrollments?.filter(e => e.final_grade !== null && e.final_grade !== undefined).map(e => e.final_grade) || [];
      const averageGrade = gradesArray.length > 0 
        ? gradesArray.reduce((sum, grade) => sum + grade, 0) / gradesArray.length 
        : 0;

      setReportData({
        totalStudents: students?.length || 0,
        totalClasses: classes?.length || 0,
        totalSubjects: subjects?.length || 0,
        activeEnrollments,
        completedEnrollments,
        averageGrade
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error("Erro ao carregar dados dos relatórios");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    try {
      toast.info(`Gerando relatório de ${type}...`);
      
      // Aqui você implementaria a lógica para gerar o relatório
      // Por exemplo, usando uma biblioteca como jsPDF ou exportando para Excel
      
      setTimeout(() => {
        toast.success(`Relatório de ${type} gerado com sucesso!`);
      }, 2000);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Erro ao gerar relatório");
    }
  };

  const viewReport = (reportId: string) => {
    const report = reportTypes.find(r => r.id === reportId);
    if (!report) return;

    let content: React.ReactNode;
    
    switch (reportId) {
      case "students":
        content = (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Relatório de Alunos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Total de Alunos:</strong> {reportData.totalStudents}</p>
                <p><strong>Período:</strong> {selectedPeriod}</p>
              </div>
              <div>
                <p><strong>Matrículas Ativas:</strong> {reportData.activeEnrollments}</p>
                <p><strong>Média Geral:</strong> {reportData.averageGrade.toFixed(1)}</p>
              </div>
            </div>
          </div>
        );
        break;
      case "classes":
        content = (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Relatório de Turmas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Total de Turmas:</strong> {reportData.totalClasses}</p>
                <p><strong>Disciplinas:</strong> {reportData.totalSubjects}</p>
              </div>
              <div>
                <p><strong>Matrículas Ativas:</strong> {reportData.activeEnrollments}</p>
                <p><strong>Concluídas:</strong> {reportData.completedEnrollments}</p>
              </div>
            </div>
          </div>
        );
        break;
      default:
        content = (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Relatório em desenvolvimento</h3>
            <p className="text-muted-foreground">
              Este relatório será implementado em breve.
            </p>
          </div>
        );
    }

    setCurrentReport({ title: report.title, content });
    setViewerOpen(true);
  };

  const reportTypes = [
    {
      id: "students",
      title: "Relatório de Alunos",
      description: "Lista completa de todos os alunos cadastrados",
      icon: Users,
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: "classes",
      title: "Relatório de Turmas",
      description: "Informações sobre todas as turmas ativas",
      icon: BookOpen,
      color: "bg-green-100 text-green-800"
    },
    {
      id: "enrollments",
      title: "Relatório de Matrículas",
      description: "Status e dados das matrículas",
      icon: Calendar,
      color: "bg-purple-100 text-purple-800"
    },
    {
      id: "performance",
      title: "Relatório de Desempenho",
      description: "Notas e performance dos alunos",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-800"
    },
    {
      id: "attendance",
      title: "Relatório de Frequência",
      description: "Dados de presença e faltas",
      icon: Calendar,
      color: "bg-red-100 text-red-800",
      route: "/relatorios-frequencia"
    },
    {
      id: "financial",
      title: "Relatório Financeiro",
      description: "Pagamentos e inadimplência",
      icon: PieChart,
      color: "bg-yellow-100 text-yellow-800"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">Visualize e gere relatórios do sistema</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="quarter">Último trimestre</SelectItem>
            <SelectItem value="year">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Alunos cadastrados no sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalClasses}</div>
                <p className="text-xs text-muted-foreground">
                  Turmas ativas no sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Disciplinas</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalSubjects}</div>
                <p className="text-xs text-muted-foreground">
                  Disciplinas cadastradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.activeEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Matrículas em andamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matrículas Concluídas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.completedEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Matrículas finalizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.averageGrade.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Nota média dos alunos
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                   <CardContent className="space-y-3">
                     {report.route ? (
                       <Button 
                         onClick={() => window.location.href = report.route} 
                         className="w-full"
                         size="sm"
                       >
                         <Eye className="h-4 w-4 mr-2" />
                         Ver Relatório Detalhado
                       </Button>
                     ) : (
                       <Button 
                         onClick={() => generateReport(report.id)} 
                         className="w-full"
                         size="sm"
                       >
                         <Download className="h-4 w-4 mr-2" />
                         Gerar Relatório
                       </Button>
                     )}
                     <div className="flex gap-2">
                       <Button 
                         onClick={() => viewReport(report.id)} 
                         variant="outline" 
                         size="sm"
                         className="flex-1"
                       >
                         <Eye className="h-4 w-4 mr-2" />
                         Visualizar
                       </Button>
                       <Button 
                         onClick={() => {
                           viewReport(report.id);
                           setTimeout(() => window.print(), 500);
                         }} 
                         variant="outline" 
                         size="sm"
                         className="flex-1"
                       >
                         <Printer className="h-4 w-4 mr-2" />
                         Imprimir
                       </Button>
                     </div>
                   </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise de Desempenho
                </CardTitle>
                <CardDescription>
                  Gráficos e métricas de desempenho dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Análises em Desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Em breve você terá acesso a análises detalhadas com gráficos interativos.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Dados
                </CardTitle>
                <CardDescription>
                  Visualização da distribuição de alunos, turmas e disciplinas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Gráficos em Desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Em breve você terá acesso a gráficos de distribuição detalhados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {currentReport && (
        <ReportViewer
          title={currentReport.title}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        >
          {currentReport.content}
        </ReportViewer>
      )}
    </div>
  );
}
