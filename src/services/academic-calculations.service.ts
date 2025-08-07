import { supabase } from "@/integrations/supabase/client";

export interface StudentGradeCalculation {
  studentId: string;
  subjectId: string;
  classId: string;
  finalGrade: number;
  weightedAverage: number;
  attendancePercentage: number;
  status: 'approved' | 'failed' | 'recovery' | 'incomplete';
  calculatedAt: string;
}

export interface AcademicProgress {
  studentId: string;
  totalSubjects: number;
  completedSubjects: number;
  averageGrade: number;
  totalCredits: number;
  completedCredits: number;
  currentSemester: string;
  status: 'active' | 'graduated' | 'dropped' | 'suspended';
}

export interface GradeWeight {
  assessmentType: 'prova' | 'trabalho' | 'participacao' | 'seminario';
  weight: number;
  required: boolean;
}

export const academicCalculationsService = {
  // Configuração de pesos das avaliações
  defaultGradeWeights: [
    { assessmentType: 'prova' as const, weight: 0.6, required: true },
    { assessmentType: 'trabalho' as const, weight: 0.2, required: false },
    { assessmentType: 'participacao' as const, weight: 0.1, required: false },
    { assessmentType: 'seminario' as const, weight: 0.1, required: false }
  ],

  // Cálculo automático de médias
  async calculateStudentGrades(studentId: string, subjectId?: string): Promise<StudentGradeCalculation[]> {
    try {
      // Buscar todas as notas do aluno
      let gradesQuery = supabase
        .from('grades')
        .select(`
          *,
          subject:subjects(id, name, credits),
          class:classes(id, name)
        `)
        .eq('student_id', studentId);

      const { data: grades, error: gradesError } = await gradesQuery;
      if (gradesError) throw gradesError;

      // Agrupar notas por disciplina
      const gradesBySubject = grades?.reduce((acc: any, grade: any) => {
        const key = `${grade.class_id}`;
        if (!acc[key]) {
          acc[key] = {
            classId: grade.class_id,
            grades: []
          };
        }
        acc[key].grades.push(grade);
        return acc;
      }, {} as Record<string, any>) || {};

      const calculations: StudentGradeCalculation[] = [];

      for (const [key, subjectData] of Object.entries(gradesBySubject)) {
        const data = subjectData as any;
        const calculation = await this.calculateSubjectGrade(
          studentId,
          data.subjectId,
          data.classId,
          data.grades
        );
        calculations.push(calculation);
      }

      return calculations;
    } catch (error) {
      console.error('Error calculating student grades:', error);
      throw error;
    }
  },

  async calculateSubjectGrade(
    studentId: string,
    subjectId: string,
    classId: string,
    grades: any[]
  ): Promise<StudentGradeCalculation> {
    // Agrupar notas por tipo de avaliação
    const gradesByType = grades.reduce((acc, grade) => {
      if (!acc[grade.assessment_type]) {
        acc[grade.assessment_type] = [];
      }
      acc[grade.assessment_type].push(grade.grade_value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calcular média ponderada
    let weightedSum = 0;
    let totalWeight = 0;
    let hasRequiredGrades = true;

    for (const weightConfig of this.defaultGradeWeights) {
      const typeGrades = gradesByType[weightConfig.assessmentType] || [];
      
      if (weightConfig.required && typeGrades.length === 0) {
        hasRequiredGrades = false;
        break;
      }

      if (typeGrades.length > 0) {
        // Usar a maior nota do tipo (ou média, dependendo da configuração)
        const typeAverage = typeGrades.reduce((sum, grade) => sum + grade, 0) / typeGrades.length;
        weightedSum += typeAverage * weightConfig.weight;
        totalWeight += weightConfig.weight;
      }
    }

    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const finalGrade = hasRequiredGrades ? weightedAverage : 0;

    // Buscar frequência do aluno na disciplina
    const attendancePercentage = await this.calculateAttendancePercentage(studentId, classId);

    // Determinar status
    let status: 'approved' | 'failed' | 'recovery' | 'incomplete' = 'incomplete';
    
    if (!hasRequiredGrades) {
      status = 'incomplete';
    } else if (finalGrade >= 7 && attendancePercentage >= 75) {
      status = 'approved';
    } else if (finalGrade >= 5 && attendancePercentage >= 75) {
      status = 'recovery';
    } else {
      status = 'failed';
    }

    const calculation: StudentGradeCalculation = {
      studentId,
      subjectId,
      classId,
      finalGrade,
      weightedAverage,
      attendancePercentage,
      status,
      calculatedAt: new Date().toISOString()
    };

    // Salvar o cálculo na base de dados
    await this.saveGradeCalculation(calculation);

    return calculation;
  },

  async calculateAttendancePercentage(studentId: string, classId: string): Promise<number> {
    try {
      // Buscar total de aulas da turma
      const { data: totalClasses, error: totalError } = await supabase
        .from('class_sessions')
        .select('id')
        .eq('class_id', classId);

      if (totalError) throw totalError;

      // Buscar presenças do aluno
      const { data: attendances, error: attendanceError } = await supabase
        .from('attendances')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .eq('status', 'presente');

      if (attendanceError) throw attendanceError;

      const total = totalClasses?.length || 0;
      const present = attendances?.length || 0;

      return total > 0 ? (present / total) * 100 : 0;
    } catch (error) {
      console.error('Error calculating attendance:', error);
      return 0;
    }
  },

  async saveGradeCalculation(calculation: StudentGradeCalculation): Promise<void> {
    // Por enquanto, apenas log do cálculo até termos a tabela grade_calculations
    console.log('Grade calculation:', calculation);
  },

  // Cálculo do progresso acadêmico geral do aluno
  async calculateAcademicProgress(studentId: string): Promise<AcademicProgress> {
    try {
      // Buscar todas as matrículas do aluno
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          classes(name)
        `)
        .eq('student_id', studentId);

      if (enrollmentError) throw enrollmentError;

      const totalSubjects = enrollments?.length || 0;
      const completedSubjects = enrollments?.filter(e => 
        e.status === 'concluida'
      ).length || 0;

      const totalCredits = totalSubjects * 4; // Assuming 4 credits per subject
      const completedCredits = completedSubjects * 4;

      const validGrades = enrollments?.filter(e => 
        e.final_grade !== null
      ).map(e => e.final_grade) || [];

      const averageGrade = validGrades.length > 0 
        ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length 
        : 0;

      // Determinar semestre atual (simplificado)
      const currentSemester = new Date().getFullYear() + '.' + (new Date().getMonth() < 6 ? '1' : '2');

      // Determinar status do aluno
      let status: 'active' | 'graduated' | 'dropped' | 'suspended' = 'active';
      
      if (completedCredits >= totalCredits && totalCredits > 0) {
        status = 'graduated';
      } else if (averageGrade < 5 && validGrades.length >= 3) {
        status = 'suspended';
      }

      const progress: AcademicProgress = {
        studentId,
        totalSubjects,
        completedSubjects,
        averageGrade,
        totalCredits,
        completedCredits,
        currentSemester,
        status
      };

      // Salvar progresso
      await this.saveAcademicProgress(progress);

      return progress;
    } catch (error) {
      console.error('Error calculating academic progress:', error);
      throw error;
    }
  },

  async saveAcademicProgress(progress: AcademicProgress): Promise<void> {
    // Por enquanto, apenas log do progresso até termos a tabela academic_progress
    console.log('Academic progress:', progress);
  },

  // Recalcular todas as médias (job batch)
  async recalculateAllGrades(): Promise<void> {
    try {
      // Buscar todos os alunos ativos
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'aluno');

      if (error) throw error;

      for (const student of students || []) {
        try {
          await this.calculateStudentGrades(student.id);
          await this.calculateAcademicProgress(student.id);
        } catch (error) {
          console.error(`Error recalculating grades for student ${student.id}:`, error);
        }
      }

      console.log(`Recalculated grades for ${students?.length || 0} students`);
    } catch (error) {
      console.error('Error in batch grade recalculation:', error);
      throw error;
    }
  }
};