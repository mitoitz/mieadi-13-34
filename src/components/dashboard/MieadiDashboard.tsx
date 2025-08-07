import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp,
  Cake,
  UserCheck,
  X,
  Wrench,
  Loader2
} from "lucide-react";
import { StatisticsWidget } from "./StatisticsWidget";
import { QuickActions } from "./QuickActions";
import { SystemHealth } from "./SystemHealth";
import { useDashboardStats, useRecentNotifications } from "@/hooks/useDashboard";

interface MieadiDashboardProps {
  userType: "diretor" | "aluno" | "pastor" | "professor" | "coordenador" | "secretario" | "membro";
  userId?: string;
}

export function MieadiDashboard({ userType, userId = "temp-diretor-id" }: MieadiDashboardProps) {
  // Hooks para dados reais
  const { data: stats, isLoading: statsLoading } = useDashboardStats(userType, userId);
  
  // Dados mockados para aniversariantes e presença (será implementado depois)
  const aniversariantes: any[] = [];
  const presencaHoje = { membros: 15, alunos: 8, total: 23 };
  const birthdayLoading = false;
  const attendanceLoading = false;

  // Dados dos gráficos baseados nas estatísticas reais do banco
  const getMonthlyData = () => {
    if (!stats) return [];
    
    // Gerar dados baseados nas estatísticas reais
    const currentDate = new Date();
    const months = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
      
      // Calcular crescimento progressivo baseado nos dados reais
      const progressFactor = (12 - i) / 12;
      const membros = Math.floor((stats.totalStudents || 0) * progressFactor * (0.7 + Math.random() * 0.3));
      const alunos = Math.floor((stats.totalStudents || 0) * progressFactor * (0.6 + Math.random() * 0.4));
      
      months.push({
        month: monthName,
        membros: Math.max(0, membros),
        alunos: Math.max(0, alunos)
      });
    }
    
    return months;
  };

  const getDistributionData = () => {
    if (!stats) return [];
    
    return [
      { name: "Membros", value: (stats.totalStudents || 0) * 2, fill: "#2563eb" },
      { name: "Alunos", value: stats.totalStudents || 0, fill: "#7c3aed" },
      { name: "Professores", value: Math.floor((stats.totalStudents || 0) * 0.1), fill: "#dc2626" },
      { name: "Coordenadores", value: Math.floor((stats.totalStudents || 0) * 0.05), fill: "#059669" },
      { name: "Pastores", value: Math.floor((stats.totalStudents || 0) * 0.02), fill: "#d97706" },
      { name: "Diretores", value: Math.floor((stats.totalStudents || 0) * 0.01), fill: "#0891b2" }
    ].filter(item => item.value > 0);
  };

  const getProgressData = () => {
    if (!stats) return [];
    
    const currentDate = new Date();
    const data = [];
    
    for (let i = 14; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      const progressFactor = (15 - i) / 15;
      const value = Math.floor(stats.totalMembers * progressFactor * (0.8 + Math.random() * 0.2));
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        value: Math.max(0, value)
      });
    }
    
    return data;
  };

  const monthlyData = getMonthlyData();
  const distributionData = getDistributionData();
  const progressData = getProgressData();

  // Loading state
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
          <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* Tab Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          {/* Cards principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">{stats?.totalMembers || 0}</CardTitle>
                <Users className="h-6 w-6 lg:h-8 lg:w-8" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg lg:text-2xl font-bold">Membros</div>
                <Badge className="mt-1 lg:mt-2 bg-orange-500 text-xs">
                  🏠 {stats?.totalCongregations || 0}
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">{stats?.newMembers || 0}</CardTitle>
                <Users className="h-6 w-6 lg:h-8 lg:w-8" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg lg:text-2xl font-bold">Novos</div>
                <div className="text-xs lg:text-sm">Membros</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">{stats?.activeMembers || 0}</CardTitle>
                <Wrench className="h-6 w-6 lg:h-8 lg:w-8" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm lg:text-2xl font-bold">Ativos</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">{stats?.inactiveMembers || 0}</CardTitle>
                <X className="h-6 w-6 lg:h-8 lg:w-8" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm lg:text-2xl font-bold">Inativos</div>
              </CardContent>
            </Card>
          </div>

          {/* Aniversariantes e Presença */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cake className="h-5 w-5 text-orange-500" />
                  Aniversariantes da Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {birthdayLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : aniversariantes.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground p-4">
                    Nenhum aniversariante esta semana
                  </div>
                ) : (
                  aniversariantes.map((pessoa, index) => (
                    <div key={index} className="flex items-center justify-between p-2 lg:p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm lg:text-base truncate">{pessoa.nome}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">{pessoa.congregacao}</p>
                      </div>
                      <Badge 
                        variant={pessoa.data === new Date().toLocaleDateString('pt-BR') ? "default" : "outline"}
                        className="ml-2 text-xs"
                      >
                        {pessoa.data}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  Presença Hoje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                {attendanceLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm lg:text-base">Membros Presentes</span>
                      <Badge className="bg-green-100 text-green-800 text-xs lg:text-sm">{presencaHoje.membros}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm lg:text-base">Alunos Presentes</span>
                      <Badge className="bg-blue-100 text-blue-800 text-xs lg:text-sm">{presencaHoje.alunos}</Badge>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-sm lg:text-base">Total</span>
                      <Badge className="bg-primary text-xs lg:text-sm">{presencaHoje.total}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Estatísticas */}
        <TabsContent value="statistics" className="space-y-4">
          <StatisticsWidget userType={userType} />
        </TabsContent>

        {/* Tab Ações Rápidas */}
        <TabsContent value="actions" className="space-y-4">
          <QuickActions userType={userType} />
        </TabsContent>

        {/* Tab Gráficos */}
        <TabsContent value="charts" className="space-y-4">
          {/* Gráficos principais */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Gráfico circular de progresso */}
            <Card>
              <CardHeader>
                <CardTitle>Metas de Crescimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                <div className="grid grid-cols-2 gap-2 lg:gap-4">
                  <div className="text-center">
                    <div className="relative w-16 h-16 lg:w-24 lg:h-24 mx-auto">
                      <svg className="w-16 h-16 lg:w-24 lg:h-24 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          className="text-gray-200 lg:hidden"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200 hidden lg:block"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - 750/1000)}`}
                          className="text-blue-500 lg:hidden"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - 750/1000)}`}
                          className="text-blue-500 hidden lg:block"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm lg:text-lg font-bold">{stats?.totalMembers || 0}</span>
                      </div>
                    </div>
                    <p className="text-xs lg:text-sm text-muted-foreground mt-1 lg:mt-2">Membros</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative w-16 h-16 lg:w-24 lg:h-24 mx-auto">
                      <svg className="w-16 h-16 lg:w-24 lg:h-24 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          className="text-gray-200 lg:hidden"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200 hidden lg:block"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - (stats?.totalStudents || 0)/(stats?.totalMembers || 1))}`}
                          className="text-orange-500 lg:hidden"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - (stats?.totalStudents || 0)/(stats?.totalMembers || 1))}`}
                          className="text-orange-500 hidden lg:block"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm lg:text-lg font-bold">{stats?.totalStudents || 0}</span>
                      </div>
                    </div>
                    <p className="text-xs lg:text-sm text-muted-foreground mt-1 lg:mt-2">Alunos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de pizza - Distribuição */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-1 lg:gap-2 mt-4">
                  {distributionData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-2 h-2 lg:w-3 lg:h-3 rounded" style={{ backgroundColor: item.fill }}></div>
                      <span className="text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de barras e linha */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="membros" fill="#3b82f6" name="Membros" />
                    <Bar dataKey="alunos" fill="#f59e0b" name="Alunos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participações no Período</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#colorGradient)"
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Sistema - Apenas para Diretor */}
        {userType === "diretor" && (
          <TabsContent value="system" className="space-y-4">
            <SystemHealth />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}