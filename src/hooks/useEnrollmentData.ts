import { useState, useCallback } from 'react';
import { pessoasService } from '@/services/pessoas.service';
import { turmasService } from '@/services/turmas.service';
import { coursesService } from '@/services/courses.service';

interface Student {
  id: string;
  full_name: string;
  email: string;
  cpf?: string;
  status: string;
}

interface Class {
  id: string;
  name: string;
  status: string;
}

interface Course {
  id: string;
  name: string;
}

export const useEnrollmentData = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [studentsData, classesData, coursesData] = await Promise.all([
        pessoasService.listar(),
        turmasService.listar(),
        coursesService.listar()
      ]);

      // Filter only students
      const studentsOnly = studentsData?.filter(person => person.role === 'aluno') || [];
      setStudents(studentsOnly);
      
      // Filter only active classes
      setClasses(classesData?.filter(cls => cls.status === 'ativa') || []);
      
      setCourses(coursesData || []);
    } catch (err) {
      console.error('Error loading enrollment data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    students,
    classes,
    courses,
    loading,
    error,
    loadData
  };
};