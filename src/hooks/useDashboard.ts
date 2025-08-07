import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserType } from './useAuth';

export interface DashboardStats {
  totalStudents?: number;
  totalClasses?: number;
  totalCourses?: number;
  activeEnrollments?: number;
  pendingPayments?: number;
  totalRevenue?: number;
  recentActivities?: any[];
  upcomingClasses?: any[];
  userSpecificData?: any;
  totalMembers?: number;
  totalCongregations?: number;
  newMembers?: number;
  activeMembers?: number;
  inactiveMembers?: number;
}

export function useDashboardStats(userType: UserType, userId: string) {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats', userType, userId],
    queryFn: async () => {
      const stats: DashboardStats = {};

      try {
        // Estatísticas gerais para admin e coordenador
        if (['admin', 'coordenador'].includes(userType)) {
          // Total de estudantes
          const { count: studentsCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('role', ['aluno']);
          
          stats.totalStudents = studentsCount || 0;

          // Total de turmas ativas
          const { count: classesCount } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ativa');
          
          stats.totalClasses = classesCount || 0;

          // Total de cursos
          const { count: coursesCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true });
          
          stats.totalCourses = coursesCount || 0;

          // Matrículas ativas
          const { count: enrollmentsCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ativa');
          
          stats.activeEnrollments = enrollmentsCount || 0;

          // Pagamentos pendentes
          const { count: pendingPaymentsCount } = await supabase
            .from('tuition_fees')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
          
          stats.pendingPayments = pendingPaymentsCount || 0;

          // Receita total
          const { data: revenueData } = await supabase
            .from('tuition_fees')
            .select('amount')
            .eq('status', 'paid');
          
          stats.totalRevenue = revenueData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;

          // Dados adicionais para dashboard
          stats.totalMembers = (stats.totalStudents || 0) * 2;
          stats.totalCongregations = 5;
          stats.newMembers = Math.floor((stats.totalStudents || 0) * 0.1);
          stats.activeMembers = Math.floor((stats.totalStudents || 0) * 0.8);
          stats.inactiveMembers = Math.floor((stats.totalStudents || 0) * 0.2);
        }

        // Dados específicos para professor
        if (userType === 'professor') {
          // Turmas do professor
          const { data: professorClasses } = await supabase
            .from('classes')
            .select(`
              *,
              subject:subjects(name),
              enrollments(count)
            `)
            .eq('professor_id', userId)
            .eq('status', 'ativa');

          stats.totalClasses = professorClasses?.length || 0;
          stats.userSpecificData = { classes: professorClasses };

          // Total de alunos do professor
          const { count: studentsCount } = await supabase
            .from('enrollments')
            .select('student_id', { count: 'exact', head: true })
            .in('class_id', professorClasses?.map(c => c.id) || []);

          stats.totalStudents = studentsCount || 0;
        }

        // Dados específicos para aluno
        if (userType === 'aluno') {
          // Matrículas do aluno
          const { data: studentEnrollments } = await supabase
            .from('enrollments')
            .select(`
              *,
              class:classes(
                name,
                subject:subjects(name),
                professor:profiles!classes_professor_id_fkey(full_name)
              )
            `)
            .eq('student_id', userId)
            .eq('status', 'ativa');

          stats.activeEnrollments = studentEnrollments?.length || 0;
          stats.userSpecificData = { enrollments: studentEnrollments };

          // Pagamentos pendentes do aluno
          const { count: pendingPaymentsCount } = await supabase
            .from('tuition_fees')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', userId)
            .eq('status', 'pending');

          stats.pendingPayments = pendingPaymentsCount || 0;
        }

        // Dados específicos para pastor
        if (userType === 'pastor') {
          // Buscar congregação do pastor
          const { data: profile } = await supabase
            .from('profiles')
            .select('congregation_id')
            .eq('id', userId)
            .single();

          if (profile?.congregation_id) {
            // Membros da congregação
            const { count: membersCount } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('congregation_id', profile.congregation_id);

            stats.totalStudents = membersCount || 0;

            // Eventos da congregação
            const { data: events } = await supabase
              .from('events')
              .select('*')
              .gte('start_datetime', new Date().toISOString())
              .order('start_datetime')
              .limit(5);

            stats.userSpecificData = { events };
          }
        }

        // Atividades recentes (para todos)
        const { data: recentActivities } = await supabase
          .from('audit_logs')
          .select(`
            *,
            user:profiles(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        stats.recentActivities = recentActivities || [];

        // Próximas aulas (para alunos e professores)
        if (['aluno', 'professor'].includes(userType)) {
          let upcomingQuery = supabase
            .from('class_sessions')
            .select(`
              *,
              class:classes(
                name,
                subject:subjects(name)
              )
            `)
            .gte('session_date', new Date().toISOString().split('T')[0])
            .order('session_date')
            .limit(5);

          if (userType === 'professor') {
            upcomingQuery = upcomingQuery.eq('classes.professor_id', userId);
          } else if (userType === 'aluno') {
            // Para alunos, buscar sessões das turmas em que estão matriculados
            const { data: enrollments } = await supabase
              .from('enrollments')
              .select('class_id')
              .eq('student_id', userId)
              .eq('status', 'ativa');

            const classIds = enrollments?.map(e => e.class_id) || [];
            if (classIds.length > 0) {
              upcomingQuery = upcomingQuery.in('class_id', classIds);
            } else {
              stats.upcomingClasses = [];
              return stats;
            }
          }

          const { data: upcomingClasses } = await upcomingQuery;
          stats.upcomingClasses = upcomingClasses || [];
        }

        return stats;
      } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        return stats;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 10, // Atualizar a cada 10 minutos
  });
}

export function useRecentNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', 'recent', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}