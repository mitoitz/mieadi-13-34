import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, BookOpen, GraduationCap, 
  Calendar, Download, Filter, Eye, BarChart3, PieChart as PieChartIcon,
  Activity, Target, Award, Clock
} from 'lucide-react';
import { useReportsData } from '@/hooks/useReportsData';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

export function AdvancedReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: reportData, isLoading, error } = useReportsData({
    period: parseInt(selectedPeriod),
    metric: selectedMetric
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-destructive">Erro ao carregar relatórios: {error.message}</div>;

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  const mockAdvancedData = {
    performanceMetrics: [
      { month: 'Jan', attendance: 85, performance: 78, engagement: 82 },
      { month: 'Fev', attendance: 88, performance: 82, engagement: 85 },
      { month: 'Mar', attendance: 92, performance: 85, engagement: 89 },
      { month: 'Abr', attendance: 87, performance: 80, engagement: 84 },
      { month: 'Mai', attendance: 90, performance: 88, engagement: 91 },
      { month: 'Jun', attendance: 93, performance: 91, engagement: 94 }
    ],
    studentProgress: [
      { name: 'Excelente', value: 25, color: '#10b981' },
      { name: 'Bom', value: 35, color: '#3b82f6' },
      { name: 'Regular', value: 30, color: '#f59e0b' },
      { name: 'Precisa melhorar', value: 10, color: '#ef4444' }
    ],
    subjectPerformance: [
      { subject: 'Teologia', avgGrade: 8.5, students: 45, completion: 92 },
      { subject: 'História Bíblica', avgGrade: 7.8, students: 52, completion: 88 },
      { subject: 'Homilética', avgGrade: 8.2, students: 38, completion: 90 },
      { subject: 'Hermenêutica', avgGrade: 7.5, students: 41, completion: 85 },
      { subject: 'Apologética', avgGrade: 8.0, students: 35, completion: 87 }
    ],
    attendanceTrends: [
      { time: '08:00', attendance: 65 },
      { time: '09:00', attendance: 85 },
      { time: '10:00', attendance: 95 },
      { time: '11:00', attendance: 88 },
      { time: '14:00', attendance: 78 },
      { time: '15:00', attendance: 92 },
      { time: '16:00', attendance: 86 },
      { time: '19:00', attendance: 82 },
      { time: '20:00', attendance: 75 }
    ],
    teacherEffectiveness: [
      { teacher: 'Prof. João', satisfaction: 9.2, attendance: 94, completion: 91 },
      { teacher: 'Prof. Maria', satisfaction: 8.8, attendance: 92, completion: 89 },
      { teacher: 'Prof. Pedro', satisfaction: 8.5, attendance: 89, completion: 87 },
      { teacher: 'Prof. Ana', satisfaction: 9.0, attendance: 95, completion: 93 },
      { teacher: 'Prof. Carlos', satisfaction: 8.3, attendance: 87, completion: 85 }
    ],
    cohortAnalysis: [
      { cohort: '2024-1', retention: 95, completion: 88, satisfaction: 9.1 },
      { cohort: '2023-2', retention: 92, completion: 91, satisfaction: 8.9 },
      { cohort: '2023-1', retention: 89, completion: 87, satisfaction: 8.7 },
      { cohort: '2022-2', retention: 94, completion: 93, satisfaction: 9.2 },
      { cohort: '2022-1', retention: 91, completion: 89, satisfaction: 8.8 }
    ]
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exportando relatório em formato ${format.toUpperCase()}...`);
    // TODO: Implementar exportação real
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-muted-foreground">
            Análises detalhadas e insights do sistema acadêmico
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          
          <Button variant="outline" onClick={() => handleExportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">94.2%</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +2.1% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Satisfação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">8.9</div>
              <Award className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nota de 0 a 10
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">89.5%</div>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média dos últimos 6 meses
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">87.3%</div>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Participação ativa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="students">Estudantes</TabsTrigger>
          <TabsTrigger value="teachers">Professores</TabsTrigger>
          <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
          <TabsTrigger value="cohorts">Turmas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Performance</CardTitle>
                <CardDescription>
                  Evolução das métricas principais nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockAdvancedData.performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="attendance" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                      name="Frequência (%)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="performance" 
                      stackId="1"
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                      name="Performance (%)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagement" 
                      stackId="1"
                      stroke="#ffc658" 
                      fill="#ffc658" 
                      fillOpacity={0.6}
                      name="Engajamento (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Performance</CardTitle>
                <CardDescription>
                  Classificação dos estudantes por nível de desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockAdvancedData.studentProgress}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {mockAdvancedData.studentProgress.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance por Horário</CardTitle>
              <CardDescription>
                Frequência média por horário de aula
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockAdvancedData.attendanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#3b82f6" name="Frequência (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Progresso dos Estudantes</CardTitle>
              <CardDescription>
                Performance individual e tendências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAdvancedData.subjectPerformance.map((subject, index) => (
                  <div key={subject.subject} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full bg-${colors[index % colors.length]}`} />
                      <div>
                        <p className="font-medium">{subject.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {subject.students} estudantes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{subject.avgGrade}</p>
                        <p className="text-muted-foreground">Média</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{subject.completion}%</p>
                        <p className="text-muted-foreground">Conclusão</p>
                      </div>
                      <Badge 
                        variant={subject.avgGrade >= 8 ? "default" : subject.avgGrade >= 7 ? "secondary" : "destructive"}
                      >
                        {subject.avgGrade >= 8 ? "Excelente" : subject.avgGrade >= 7 ? "Bom" : "Regular"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Efetividade dos Professores</CardTitle>
              <CardDescription>
                Análise multidimensional da performance docente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={mockAdvancedData.teacherEffectiveness}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attendance" name="Frequência (%)" />
                  <YAxis dataKey="satisfaction" name="Satisfação" />
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => `Professor: ${mockAdvancedData.teacherEffectiveness[label]?.teacher}`}
                  />
                  <Scatter dataKey="completion" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Disciplina</CardTitle>
              <CardDescription>
                Análise comparativa entre disciplinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={mockAdvancedData.subjectPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar 
                    name="Nota Média" 
                    dataKey="avgGrade" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Coortes</CardTitle>
              <CardDescription>
                Comparação entre diferentes turmas e períodos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAdvancedData.cohortAnalysis.map((cohort, index) => (
                  <div key={cohort.cohort} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Turma {cohort.cohort}</h4>
                      <Badge variant="outline">
                        {cohort.satisfaction} ⭐
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{cohort.retention}%</div>
                        <div className="text-muted-foreground">Retenção</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{cohort.completion}%</div>
                        <div className="text-muted-foreground">Conclusão</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{cohort.satisfaction}</div>
                        <div className="text-muted-foreground">Satisfação</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}