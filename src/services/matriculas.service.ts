import { supabase } from "@/integrations/supabase/client";

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  course_id: string;
  status: 'ativa' | 'inativa' | 'pendente' | 'desistente' | 'transferido' | 'concluido';
  enrollment_date: string;
  final_grade?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentData {
  id: string;
  nome: string;
  email: string;
  curso: string;
  turma: string;
  turmaId: string;
  status: "ativo" | "inativo" | "pendente" | "desistente" | "transferido" | "concluido";
  dataMatricula: string;
  media: number;
  frequencia: number;
  congregacao?: string;
  enrollmentId: string;
}

export const enrollmentService = {
  async getActiveStudents(): Promise<StudentData[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:profiles!enrollments_student_id_fkey(
          id,
          full_name,
          email,
          status,
          congregation_id
        ),
        course:courses(
          id,
          name
        ),
        class:classes(
          id,
          name,
          congregation_id,
          congregation:congregations(name)
        )
      `)
      .eq('status', 'ativa');

    if (error) throw error;

    return data?.map((enrollment: any) => ({
      id: enrollment.student?.id || '',
      nome: enrollment.student?.full_name || 'Nome não informado',
      email: enrollment.student?.email || '',
      curso: enrollment.course?.name || 'Curso não informado',
      turma: enrollment.class?.name || 'Turma não informada',
      turmaId: enrollment.class?.id || '',
      status: enrollment.status || 'ativo',
      dataMatricula: enrollment.enrollment_date || enrollment.created_at || new Date().toISOString().split('T')[0],
      media: 0, // TODO: calcular média real
      frequencia: 85, // TODO: calcular frequência real
      congregacao: enrollment.class?.congregation?.name || 'Não informado',
      enrollmentId: enrollment.id || ''
    })) || [];
  },

  async enrollStudent(studentId: string, classId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        class_id: classId,
        course_id: courseId,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'ativa'
      });

    if (error) throw error;
  },

  async updateEnrollmentStatus(enrollmentId: string, status: 'ativa' | 'inativa' | 'pendente' | 'desistente' | 'transferido' | 'concluido'): Promise<void> {
    const { error } = await supabase
      .from('enrollments')
      .update({ status })
      .eq('id', enrollmentId);

    if (error) throw error;
  },

  async updateMultipleEnrollmentStatus(enrollmentIds: string[], status: 'ativa' | 'inativa' | 'pendente' | 'desistente' | 'transferido' | 'concluido'): Promise<void> {
    const { error } = await supabase
      .from('enrollments')
      .update({ status })
      .in('id', enrollmentIds);

    if (error) throw error;
  },

  async removeEnrollment(enrollmentId: string): Promise<void> {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) throw error;
  },

  async removeMultipleEnrollments(enrollmentIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .in('id', enrollmentIds);

    if (error) throw error;
  },

  async getStudentsByClass(classId: string): Promise<StudentData[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:profiles!enrollments_student_id_fkey(
          id,
          full_name,
          email,
          status,
          congregation_id
        ),
        course:courses(
          id,
          name
        ),
        class:classes(
          id,
          name,
          congregation_id,
          congregation:congregations(name)
        )
      `)
      .eq('class_id', classId);

    if (error) throw error;

    return data?.map((enrollment: any) => ({
      id: enrollment.student?.id || '',
      nome: enrollment.student?.full_name || 'Nome não informado',
      email: enrollment.student?.email || '',
      curso: enrollment.course?.name || 'Curso não informado',
      turma: enrollment.class?.name || 'Turma não informada',
      turmaId: enrollment.class?.id || '',
      status: enrollment.status || 'ativo',
      dataMatricula: enrollment.enrollment_date || enrollment.created_at || new Date().toISOString().split('T')[0],
      media: 0, // TODO: calcular média real
      frequencia: 85, // TODO: calcular frequência real
      congregacao: enrollment.class?.congregation?.name || 'Não informado',
      enrollmentId: enrollment.id || ''
    })) || [];
  },

  async getStudentGrades(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('grades')
      .select(`
        *,
        class:classes(name, subject:subjects(name))
      `)
      .eq('student_id', studentId);

    if (error) throw error;
    return data || [];
  },

  async getStudentAttendance(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select(`
        *,
        class:classes(name)
      `)
      .eq('student_id', studentId);

    if (error) throw error;
    return data || [];
  }
};