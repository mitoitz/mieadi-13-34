import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "./notifications.service";
import { toast } from "sonner";

export const avaliacaoNotificationsService = {
  /**
   * Envia notificação para todos os alunos de uma turma quando uma avaliação é liberada
   */
  async notifyStudentsAboutNewAssessment(assessmentId: string, classId: string): Promise<void> {
    try {
      // Buscar informações da avaliação
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          title,
          description,
          end_date,
          duration_minutes,
          classes (
            name,
            subjects (name)
          )
        `)
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Buscar todos os alunos matriculados na turma
      const { data: students, error: studentsError } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        console.log('Nenhum aluno encontrado na turma');
        return;
      }

      const studentIds = students.map(s => s.student_id);

      // Criar mensagem da notificação
      const endDateText = assessment.end_date 
        ? ` até ${new Date(assessment.end_date).toLocaleDateString('pt-BR')}`
        : '';
      
      const durationText = assessment.duration_minutes 
        ? ` (${assessment.duration_minutes} minutos)`
        : '';

      // @ts-ignore - Temporary fix for Supabase types
      const message = `A avaliação "${assessment.title}" da disciplina ${(assessment.classes as any)?.subjects?.name || 'N/A'} foi liberada e está disponível para resposta${endDateText}${durationText}.`;

      // Enviar notificação para todos os alunos
      await notificationService.sendBulkNotification(
        studentIds,
        {
          title: "Nova Avaliação Disponível",
          message,
          type: 'info',
          read: false,
          expires_at: assessment.end_date
        }
      );

      console.log(`Notificações enviadas para ${studentIds.length} alunos sobre a avaliação ${assessment.title}`);
      
    } catch (error) {
      console.error('Error sending assessment notifications:', error);
      throw error;
    }
  },

  /**
   * Envia notificação quando uma avaliação está prestes a expirar
   */
  async notifyStudentsAboutExpiringAssessment(assessmentId: string): Promise<void> {
    try {
      // Buscar avaliação e alunos que ainda não responderam
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          title,
          end_date,
          class_id,
          classes (
            name,
            subjects (name)
          )
        `)
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Buscar alunos da turma
      const { data: students, error: studentsError } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', assessment.class_id);

      if (studentsError) throw studentsError;

      // Verificar quais alunos ainda não responderam
      // TODO: Implementar quando tabela de submissões estiver disponível
      const studentsWhoDidntSubmit = students?.map(s => s.student_id) || [];

      if (studentsWhoDidntSubmit.length === 0) return;

      const endDate = assessment.end_date ? new Date(assessment.end_date) : null;
      const endDateText = endDate ? endDate.toLocaleDateString('pt-BR') : '';

      await notificationService.sendBulkNotification(
        studentsWhoDidntSubmit,
        {
          title: "⚠️ Avaliação Expirando em Breve",
          // @ts-ignore - Temporary fix for Supabase types
          message: `A avaliação "${assessment.title}" da disciplina ${(assessment.classes as any)?.subjects?.name || 'N/A'} expira em ${endDateText}. Não esqueça de respondê-la!`,
          type: 'warning',
          read: false,
          expires_at: assessment.end_date
        }
      );

    } catch (error) {
      console.error('Error sending expiring assessment notifications:', error);
    }
  },

  /**
   * Envia notificação quando as notas de uma avaliação são liberadas
   */
  async notifyStudentsAboutGrades(assessmentId: string): Promise<void> {
    try {
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          title,
          class_id,
          classes (
            name,
            subjects (name)
          )
        `)
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Buscar alunos que fizeram a avaliação
      // TODO: Implementar quando tabela de submissões estiver disponível
      const { data: students, error: studentsError } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', assessment.class_id);

      if (studentsError) throw studentsError;

      const studentIds = students?.map(s => s.student_id) || [];

      if (studentIds.length === 0) return;

      await notificationService.sendBulkNotification(
        studentIds,
        {
          title: "📊 Notas Liberadas",
          // @ts-ignore - Temporary fix for Supabase types
          message: `As notas da avaliação "${assessment.title}" da disciplina ${(assessment.classes as any)?.subjects?.name || 'N/A'} foram liberadas. Confira seu desempenho!`,
          type: 'success',
          read: false
        }
      );

    } catch (error) {
      console.error('Error sending grade notifications:', error);
    }
  },

  /**
   * Configura lembretes automáticos para avaliações
   */
  async setupAssessmentReminders(assessmentId: string): Promise<void> {
    try {
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('end_date')
        .eq('id', assessmentId)
        .single();

      if (error || !assessment.end_date) return;

      const endDate = new Date(assessment.end_date);
      const now = new Date();
      
      // Programar lembrete 24h antes (se ainda há tempo)
      const oneDayBefore = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      if (oneDayBefore > now) {
        setTimeout(() => {
          this.notifyStudentsAboutExpiringAssessment(assessmentId);
        }, oneDayBefore.getTime() - now.getTime());
      }

      // Programar lembrete 2h antes (se ainda há tempo)
      const twoHoursBefore = new Date(endDate.getTime() - 2 * 60 * 60 * 1000);
      if (twoHoursBefore > now) {
        setTimeout(() => {
          this.notifyStudentsAboutExpiringAssessment(assessmentId);
        }, twoHoursBefore.getTime() - now.getTime());
      }

    } catch (error) {
      console.error('Error setting up assessment reminders:', error);
    }
  }
};

// Função para integração com o componente AvaliacoesList
export const sendAssessmentNotification = async (assessmentId: string, classId: string, action: 'created' | 'activated' | 'graded') => {
  try {
    switch (action) {
      case 'created':
      case 'activated':
        await avaliacaoNotificationsService.notifyStudentsAboutNewAssessment(assessmentId, classId);
        toast.success("Notificações enviadas para os alunos!");
        break;
      case 'graded':
        await avaliacaoNotificationsService.notifyStudentsAboutGrades(assessmentId);
        toast.success("Alunos notificados sobre as notas!");
        break;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    toast.error("Erro ao enviar notificações");
  }
};