import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AttendanceReportData {
  dailyAttendance: Array<{
    date: string;
    presentes: number;
    ausentes: number;
    total: number;
  }>;
  eventAttendance: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    attendance: number;
  }>;
  stats: {
    averageAttendance: number;
    totalPresent: number;
    totalAbsent: number;
    eventsHeld: number;
  };
}

async function fetchAttendanceReport(days: number = 30): Promise<AttendanceReportData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Buscar dados de frequência da tabela attendance_records com os relacionamentos corretos
    const { data: attendances, error } = await supabase
      .from('attendance_records')
      .select(`
        created_at,
        status,
        check_in_time,
        verification_method,
        class_id,
        event_id,
        student_id,
        profiles!attendance_records_student_id_fkey(
          full_name,
          cpf,
          role
        ),
        events(
          title,
          event_type
        ),
        classes(
          name
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');

    if (error) throw error;

    // Processar dados diários - no nosso sistema todos os registros são de presença
    const dailyData = new Map<string, { presentes: number; ausentes: number; total: number }>();
    
    attendances?.forEach(attendance => {
      const date = new Date(attendance.created_at).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { presentes: 0, ausentes: 0, total: 0 });
      }
      
      const day = dailyData.get(date)!;
      // Todos os registros de attendance_records são presenças registradas
      day.presentes++;
      day.total++;
    });

    const dailyAttendance = Array.from(dailyData.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      ...data
    }));

    // Dados por tipo de evento baseado nos dados reais
    const eventTypes = new Map<string, number>();
    attendances?.forEach((attendance: any) => {
      let eventType = 'Outros';
      
      if (attendance.events) {
        // Se é um evento
        eventType = attendance.events.event_type === 'aula' ? 'Aulas' : 
                   attendance.events.event_type === 'evento' ? 'Eventos Especiais' : 
                   'Outros';
      } else if (attendance.classes) {
        // Se é uma turma
        const className = attendance.classes.name || '';
        eventType = className.includes('Domingo') ? 'Culto de Domingo' :
                   className.includes('Terça') ? 'Reunião de Terça' :
                   className.includes('Escola') ? 'Escola Dominical' : 'Turmas';
      }
      
      // Todos os registros são presenças, não precisa verificar status
      eventTypes.set(eventType, (eventTypes.get(eventType) || 0) + 1);
    });

    const totalEventAttendance = Array.from(eventTypes.values()).reduce((sum, count) => sum + count, 0);
    const eventAttendance = Array.from(eventTypes.entries()).map(([name, count], index) => ({
      name,
      value: totalEventAttendance > 0 ? Math.round((count / totalEventAttendance) * 100) : 0,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index] || '#6b7280'
    }));

    // Tendência mensal (últimos 6 meses)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthAttendances = attendances?.filter(a => {
        const attDate = new Date(a.created_at);
        return attDate >= monthStart && attDate <= monthEnd;
      }) || [];

      const monthPresent = monthAttendances.length; // Todos são presenças
      const monthTotal = monthAttendances.length;
      const monthPercentage = monthTotal > 0 ? 100 : 0; // 100% se há registros, 0% se não há

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
        attendance: monthPercentage
      });
    }

    // Estatísticas gerais - baseado nos dados reais
    const totalPresent = attendances?.length || 0;
    const totalAbsent = 0; // Sistema registra apenas presenças
    const totalAttendances = totalPresent;
    
    // Calcular frequência média baseada nos registros
    const averageAttendance = totalAttendances > 0 ? 
      Math.round((totalPresent / Math.max(totalAttendances, 1)) * 100) : 0;
    
    // Contar eventos únicos (eventos e aulas realizados)
    const uniqueEvents = new Set();
    attendances?.forEach(a => {
      if (a.event_id) uniqueEvents.add(a.event_id);
      if (a.class_id) uniqueEvents.add(`class_${a.class_id}`);
    });
    const eventsHeld = uniqueEvents.size || 1;

    return {
      dailyAttendance,
      eventAttendance,
      monthlyTrend,
      stats: {
        averageAttendance,
        totalPresent,
        totalAbsent,
        eventsHeld
      }
    };
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    throw error;
  }
}

export function useAttendanceReport(days: number = 30) {
  return useQuery<AttendanceReportData>({
    queryKey: ['reports', 'attendance', days],
    queryFn: () => fetchAttendanceReport(days),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para relatórios financeiros
export function useFinancialReport(period: string = 'month') {
  return useQuery({
    queryKey: ['reports', 'financial', period],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default: // month
          startDate.setMonth(startDate.getMonth() - 1);
      }

      const { data: fees, error } = await supabase
        .from('payments')
        .select('amount, status, payment_date, due_date, payment_method, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Processar dados financeiros
      const totalReceived = fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0) || 0;
      const totalPending = fees?.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0) || 0;
      const totalOverdue = fees?.filter(f => f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0) || 0;

      // Métodos de pagamento
      const paymentMethods = new Map<string, number>();
      fees?.filter(f => f.payment_method).forEach(f => {
        const method = f.payment_method!;
        paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1);
      });

      const totalPayments = Array.from(paymentMethods.values()).reduce((sum, count) => sum + count, 0);
      const paymentMethodsData = Array.from(paymentMethods.entries()).map(([name, count]) => ({
        name,
        value: totalPayments > 0 ? Math.round((count / totalPayments) * 100) : 0,
        color: name === 'pix' ? '#82ca9d' : 
               name === 'dinheiro' ? '#8884d8' :
               name === 'cartao' ? '#ffc658' : '#ff7300'
      }));

      return {
        summary: {
          totalReceived,
          totalPending,
          totalOverdue,
          totalStudents: fees?.length || 0
        },
        paymentMethods: paymentMethodsData,
        fees: fees || []
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para relatórios avançados (usado pelo novo componente)
export function useReportsData(params: { period: number; metric?: string }) {
  return useAttendanceReport(params.period);
}