import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Clock, TrendingUp, UserMinus, Repeat, CheckCircle } from "lucide-react";
import { StudentData } from "@/services/matriculas.service";

interface MatriculaStatsProps {
  students: StudentData[];
}

export function MatriculaStats({ students }: MatriculaStatsProps) {
  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'ativo').length,
    inactive: students.filter(s => s.status === 'inativo').length,
    pending: students.filter(s => s.status === 'pendente').length,
    dropped: students.filter(s => s.status === 'desistente').length,
    transferred: students.filter(s => s.status === 'transferido').length,
    completed: students.filter(s => s.status === 'concluido').length,
    averageGrade: students.length > 0 
      ? students.reduce((acc, s) => acc + s.media, 0) / students.length 
      : 0,
    averageAttendance: students.length > 0 
      ? students.reduce((acc, s) => acc + s.frequencia, 0) / students.length 
      : 0
  };

  const statCards = [
    {
      title: "Total de Matrículas",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Total geral"
    },
    {
      title: "Matrículas Ativas",
      value: stats.active,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Alunos ativos"
    },
    {
      title: "Matrículas Pendentes",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Aguardando aprovação"
    },
    {
      title: "Matrículas Inativas",
      value: stats.inactive,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Alunos inativos"
    },
    {
      title: "Desistentes",
      value: stats.dropped,
      icon: UserMinus,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Alunos desistentes"
    },
    {
      title: "Transferidos",
      value: stats.transferred,
      icon: Repeat,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Alunos transferidos"
    },
    {
      title: "Concluídos",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Alunos que concluíram"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}

      {/* Média Geral */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Média Geral
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-50">
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">
            {stats.averageGrade.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">Nota média dos alunos</p>
        </CardContent>
      </Card>

      {/* Frequência Média */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Frequência Média
          </CardTitle>
          <div className="p-2 rounded-lg bg-indigo-50">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">
            {stats.averageAttendance.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Frequência média</p>
        </CardContent>
      </Card>
    </div>
  );
}