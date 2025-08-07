import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, Church } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatsData {
  totalUsers: number;
  totalCourses: number;
  totalClasses: number;
  totalCongregations: number;
  loading: boolean;
}

export function QuickStats() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalCourses: 0,
    totalClasses: 0,
    totalCongregations: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, coursesRes, classesRes, congregationsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('courses').select('id', { count: 'exact', head: true }),
          supabase.from('classes').select('id', { count: 'exact', head: true }),
          supabase.from('congregations').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalCourses: coursesRes.count || 0,
          totalClasses: classesRes.count || 0,
          totalCongregations: congregationsRes.count || 0,
          loading: false
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Cursos",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Turmas",
      value: stats.totalClasses,
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Congregações",
      value: stats.totalCongregations,
      icon: Church,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statsCards.map((stat) => (
        <Card key={stat.title} className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                stat.value.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total no sistema
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}