import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceStats {
  averageAttendance: number;
  totalPresent: number;
  totalAbsent: number;
  eventsHeld: number;
}

interface DailyAttendance {
  date: string;
  presentes: number;
  ausentes: number;
  total: number;
}

interface EventAttendance {
  name: string;
  value: number;
  color: string;
}

interface MonthlyTrend {
  month: string;
  attendance: number;
}

interface AttendanceReportData {
  stats: AttendanceStats;
  dailyAttendance: DailyAttendance[];
  eventAttendance: EventAttendance[];
  monthlyTrend: MonthlyTrend[];
}

export const useAttendanceReport = (days: number) => {
  return useQuery<AttendanceReportData>({
    queryKey: ["attendance-report", days],
    queryFn: async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Buscar dados de frequência do período usando a função segura
        const { data: attendanceData, error } = await supabase
          .rpc('get_attendance_summary', {
            p_start_date: startDate.toISOString().split('T')[0],
            p_end_date: endDate.toISOString().split('T')[0],
            p_class_id: null,
            p_event_id: null
          });

        if (error) throw error;

        // Calcular estatísticas
        const totalRecords = attendanceData?.length || 0;
        const presentRecords = attendanceData?.filter(record => record.status === 'presente').length || 0;
        const absentRecords = totalRecords - presentRecords;
        
        // Buscar eventos únicos
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title')
          .gte('start_datetime', startDate.toISOString())
          .lte('start_datetime', endDate.toISOString());

        if (eventsError) throw eventsError;

        const stats: AttendanceStats = {
          averageAttendance: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0,
          totalPresent: presentRecords,
          totalAbsent: absentRecords,
          eventsHeld: eventsData?.length || 0
        };

        // Agrupar dados por dia
        const dailyData = new Map<string, { presentes: number; ausentes: number; total: number }>();
        
        attendanceData?.forEach(record => {
          const date = new Date(record.check_in_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const current = dailyData.get(date) || { presentes: 0, ausentes: 0, total: 0 };
          
          if (record.status === 'presente') {
            current.presentes++;
          } else {
            current.ausentes++;
          }
          current.total++;
          
          dailyData.set(date, current);
        });

        const dailyAttendance: DailyAttendance[] = Array.from(dailyData.entries()).map(([date, data]) => ({
          date,
          ...data
        }));

        // Dados por tipo de evento (simulado por enquanto)
        const eventAttendance: EventAttendance[] = [
          { name: "Aulas", value: stats.averageAttendance, color: "#3b82f6" },
          { name: "Eventos", value: Math.max(0, stats.averageAttendance - 10), color: "#10b981" },
          { name: "Atividades Especiais", value: Math.max(0, stats.averageAttendance - 20), color: "#f59e0b" },
        ];

        // Tendência mensal (últimos 6 meses)
        const monthlyTrend: MonthlyTrend[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          
          const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
          const monthData = attendanceData?.filter(record => {
            const recordDate = new Date(record.check_in_time);
            return recordDate.getMonth() === date.getMonth() && recordDate.getFullYear() === date.getFullYear();
          }) || [];
          
          const monthPresent = monthData.filter(record => record.status === 'presente').length;
          const monthTotal = monthData.length;
          const attendance = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0;
          
          monthlyTrend.push({
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            attendance
          });
        }

        return {
          stats,
          dailyAttendance,
          eventAttendance,
          monthlyTrend
        };
      } catch (error) {
        console.error('Erro ao carregar relatório de frequência:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};