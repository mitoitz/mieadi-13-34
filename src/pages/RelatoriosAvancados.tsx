import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  FileBarChart, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  BookOpen,
  Clock,
  GraduationCap
} from "lucide-react";

const mockFrequencyData = [
  { month: 'Jan', presentes: 85, ausentes: 15, total: 100 },
  { month: 'Fev', presentes: 78, ausentes: 22, total: 100 },
  { month: 'Mar', presentes: 92, ausentes: 8, total: 100 },
  { month: 'Abr', presentes: 88, ausentes: 12, total: 100 },
  { month: 'Mai', presentes: 95, ausentes: 5, total: 100 },
  { month: 'Jun', presentes: 82, ausentes: 18, total: 100 },
];

const mockGradesData = [
  { disciplina: 'Teologia Sistemática', media: 8.5, aprovados: 24, reprovados: 1 },
  { disciplina: 'Hermenêutica', media: 7.8, aprovados: 22, reprovados: 3 },
  { disciplina: 'História da Igreja', media: 9.1, aprovados: 25, reprovados: 0 },
  { disciplina: 'Homilética', media: 8.3, aprovados: 23, reprovados: 2 },
];

const mockFinancialData = [
  { mes: 'Jan', receita: 15000, despesas: 12000, lucro: 3000 },
  { mes: 'Fev', receita: 18000, despesas: 13500, lucro: 4500 },
  { mes: 'Mar', receita: 16500, despesas: 14000, lucro: 2500 },
  { mes: 'Abr', receita: 19000, despesas: 15000, lucro: 4000 },
  { mes: 'Mai', receita: 20500, despesas: 16000, lucro: 4500 },
  { mes: 'Jun', receita: 17800, despesas: 14500, lucro: 3300 },
];

const mockMembershipData = [
  { name: 'Membros Ativos', value: 150, color: '#10B981' },
  { name: 'Alunos', value: 45, color: '#3B82F6' },
  { name: 'Professores', value: 8, color: '#8B5CF6' },
  { name: 'Pastores', value: 3, color: '#F59E0B' },
];

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

export default function RelatoriosAvancados() {
  const [selectedPeriod, setSelectedPeriod] = useState("semestre");
  const [selectedCourse, setSelectedCourse] = useState("todos");

  const generateReport = (type: string) => {
    console.log(`Gerando relatório: ${type}`);
    // Aqui seria implementada a lógica de geração do relatório
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileBarChart className="h-8 w-8 text-primary" />
          Relatórios Avançados
        </h1>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="semestre">Semestre</SelectItem>
              <SelectItem value="ano">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Tudo
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Último Mês</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                  <SelectItem value="ano">Ano Letivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Cursos</SelectItem>
                  <SelectItem value="bacharel">Bacharel em Teologia</SelectItem>
                  <SelectItem value="tecnico">Técnico em Teologia</SelectItem>
                  <SelectItem value="obreiros">Curso de Obreiros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data Início</Label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Reports */}
      <Tabs defaultValue="frequency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="frequency">Frequência</TabsTrigger>
          <TabsTrigger value="grades">Notas & Desempenho</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="membership">Composição</TabsTrigger>
        </TabsList>

        {/* Frequency Reports */}
        <TabsContent value="frequency" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Frequência Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="presentes" stackId="1" stroke="#10B981" fill="#10B981" />
                    <Area type="monotone" dataKey="ausentes" stackId="1" stroke="#EF4444" fill="#EF4444" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Presença</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Presença Média</span>
                  <span className="text-2xl font-bold text-green-600">87%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Total de Aulas</span>
                  <span className="text-2xl font-bold text-blue-600">124</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium">Faltas Justificadas</span>
                  <span className="text-2xl font-bold text-yellow-600">23</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">Faltas Não Justificadas</span>
                  <span className="text-2xl font-bold text-red-600">8</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => generateReport('frequency-detailed')} className="h-12">
                  <Download className="h-4 w-4 mr-2" />
                  Relatório Detalhado de Frequência
                </Button>
                <Button onClick={() => generateReport('frequency-comparison')} variant="outline" className="h-12">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Comparativo Anual
                </Button>
                <Button onClick={() => generateReport('attendance-alerts')} variant="outline" className="h-12">
                  <Users className="h-4 w-4 mr-2" />
                  Alerta de Baixa Frequência
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Reports */}
        <TabsContent value="grades" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Média por Disciplina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockGradesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="disciplina" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="media" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Índices de Aprovação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockGradesData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.disciplina}</span>
                      <span className="text-sm text-gray-600">
                        {((item.aprovados / (item.aprovados + item.reprovados)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(item.aprovados / (item.aprovados + item.reprovados)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => generateReport('grades-detailed')} className="h-12">
                  <Download className="h-4 w-4 mr-2" />
                  Boletim Completo
                </Button>
                <Button onClick={() => generateReport('performance-analysis')} variant="outline" className="h-12">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Análise de Performance
                </Button>
                <Button onClick={() => generateReport('improvement-plan')} variant="outline" className="h-12">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Plano de Melhoria
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fluxo de Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockFinancialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
                    <Line type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="lucro" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">R$ 106.800</div>
                    <div className="text-sm text-gray-600">Receita Total</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">R$ 85.000</div>
                    <div className="text-sm text-gray-600">Despesas Total</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">R$ 21.800</div>
                    <div className="text-sm text-gray-600">Lucro Total</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">20.4%</div>
                    <div className="text-sm text-gray-600">Margem</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => generateReport('financial-detailed')} className="h-12">
                  <Download className="h-4 w-4 mr-2" />
                  Relatório Financeiro Completo
                </Button>
                <Button onClick={() => generateReport('cashflow-projection')} variant="outline" className="h-12">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Projeção de Fluxo
                </Button>
                <Button onClick={() => generateReport('payment-tracking')} variant="outline" className="h-12">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Controle de Inadimplência
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Reports */}
        <TabsContent value="membership" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Composição da Comunidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockMembershipData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockMembershipData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockMembershipData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{item.value}</div>
                      <div className="text-sm text-gray-600">
                        {((item.value / mockMembershipData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => generateReport('membership-detailed')} className="h-12">
                  <Download className="h-4 w-4 mr-2" />
                  Lista Completa de Membros
                </Button>
                <Button onClick={() => generateReport('growth-analysis')} variant="outline" className="h-12">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Análise de Crescimento
                </Button>
                <Button onClick={() => generateReport('demographic-report')} variant="outline" className="h-12">
                  <Users className="h-4 w-4 mr-2" />
                  Perfil Demográfico
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}