import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  GraduationCap,
  Calendar,
  DollarSign,
  Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatisticsData {
  totalStudents: number;
  activeClasses: number;
  totalTeachers: number;
  totalCourses: number;
  enrollmentRate: number;
  attendanceRate: number;
  paymentRate: number;
  graduationRate: number;
}

interface StatisticsWidgetProps {
  userType: string;
  className?: string;
}

export function StatisticsWidget({ userType, className = "" }: StatisticsWidgetProps) {
  const [data, setData] = useState<StatisticsData>({
    totalStudents: 0,
    activeClasses: 0,
    totalTeachers: 0,
    totalCourses: 0,
    enrollmentRate: 0,
    attendanceRate: 0,
    paymentRate: 0,
    graduationRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      // Buscar dados em paralelo
      const [
        studentsResult,
        classesResult,
        teachersResult,
        coursesResult,
        enrollmentsResult,
        paymentsResult
      ] = await Promise.allSettled([
        (supabase as any).from('profiles').select('id').eq('role', 'aluno'),
        (supabase as any).from('classes').select('id').eq('status', 'active'),
        (supabase as any).from('profiles').select('id').eq('role', 'professor'),
        (supabase as any).from('courses').select('id'),
        (supabase as any).from('enrollments').select('id, status'),
        (supabase as any).from('tuition_fees').select('id, status')
      ]);

      // Processar resultados
      const totalStudents = studentsResult.status === 'fulfilled' ? 
        (studentsResult.value.data?.length || 0) : 0;
      
      const activeClasses = classesResult.status === 'fulfilled' ? 
        (classesResult.value.data?.length || 0) : 0;
      
      const totalTeachers = teachersResult.status === 'fulfilled' ? 
        (teachersResult.value.data?.length || 0) : 0;
      
      const totalCourses = coursesResult.status === 'fulfilled' ? 
        (coursesResult.value.data?.length || 0) : 0;

      // Calcular taxas
      const enrollments = enrollmentsResult.status === 'fulfilled' ? 
        enrollmentsResult.value.data : [];
      const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
      const enrollmentRate = enrollments?.length ? 
        (activeEnrollments / enrollments.length) * 100 : 0;

      const payments = paymentsResult.status === 'fulfilled' ? 
        paymentsResult.value.data : [];
      const paidPayments = payments?.filter(p => p.status === 'paid').length || 0;
      const paymentRate = payments?.length ? 
        (paidPayments / payments.length) * 100 : 0;

      setData({
        totalStudents,
        activeClasses,
        totalTeachers,
        totalCourses,
        enrollmentRate,
        attendanceRate: 87.5, // Mock - seria calculado das presenças
        paymentRate,
        graduationRate: 92.3 // Mock - seria calculado das graduações
      });

    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "blue" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: { value: number; isPositive: boolean };
    color?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={`text-xs ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProgressCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "blue" 
  }: {
    title: string;
    value: number;
    icon: any;
    color?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={`h-4 w-4 text-${color}-600`} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{value.toFixed(1)}%</span>
            <Badge variant={value >= 85 ? "default" : value >= 70 ? "secondary" : "destructive"}>
              {value >= 85 ? "Excelente" : value >= 70 ? "Bom" : "Atenção"}
            </Badge>
          </div>
          <Progress value={value} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Números Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Alunos"
          value={data.totalStudents}
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Turmas Ativas"
          value={data.activeClasses}
          icon={BookOpen}
          trend={{ value: 12.5, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Professores"
          value={data.totalTeachers}
          icon={GraduationCap}
          trend={{ value: 5.1, isPositive: true }}
          color="purple"
        />
        <StatCard
          title="Cursos Oferecidos"
          value={data.totalCourses}
          icon={Award}
          trend={{ value: 3.8, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Indicadores de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressCard
          title="Taxa de Matrícula"
          value={data.enrollmentRate}
          icon={Users}
          color="blue"
        />
        <ProgressCard
          title="Taxa de Frequência"
          value={data.attendanceRate}
          icon={Calendar}
          color="green"
        />
        <ProgressCard
          title="Taxa de Pagamento"
          value={data.paymentRate}
          icon={DollarSign}
          color="yellow"
        />
        <ProgressCard
          title="Taxa de Graduação"
          value={data.graduationRate}
          icon={Award}
          color="purple"
        />
      </div>
    </div>
  );
}