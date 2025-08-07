import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Edit, Trash2, UserCheck, GraduationCap, Calendar, AlertCircle } from "lucide-react";

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  course_id: string;
  enrollment_date: string;
  status: 'ativo' | 'inativo' | 'concluido' | 'trancado';
  student: {
    id: string;
    full_name: string;
    email: string;
    cpf: string;
  };
  class: {
    id: string;
    name: string;
    professor: {
      full_name: string;
    };
  };
  course: {
    id: string;
    name: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
}

interface Class {
  id: string;
  name: string;
  professor: {
    full_name: string;
  };
}

interface Course {
  id: string;
  name: string;
}

export function EnrollmentManager() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewEnrollmentDialog, setShowNewEnrollmentDialog] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: '',
    class_id: '',
    course_id: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'ativo' as const
  });

  const { toast } = useToast();

  // Mock data
  const mockStudents: Student[] = [
    { id: '1', full_name: 'João Silva', email: 'joao@email.com', cpf: '123.456.789-00' },
    { id: '2', full_name: 'Maria Santos', email: 'maria@email.com', cpf: '234.567.890-11' },
    { id: '3', full_name: 'Pedro Costa', email: 'pedro@email.com', cpf: '345.678.901-22' },
    { id: '4', full_name: 'Ana Oliveira', email: 'ana@email.com', cpf: '456.789.012-33' }
  ];

  const mockClasses: Class[] = [
    { id: '1', name: 'Turma A - Teologia Básica', professor: { full_name: 'Prof. João Silva' } },
    { id: '2', name: 'Turma B - Educação Cristã', professor: { full_name: 'Prof. Maria Santos' } },
    { id: '3', name: 'Turma C - Liderança', professor: { full_name: 'Prof. Pedro Costa' } }
  ];

  const mockCourses: Course[] = [
    { id: '1', name: 'Teologia Básica' },
    { id: '2', name: 'Educação Cristã' },
    { id: '3', name: 'Liderança' }
  ];

  const mockEnrollments: Enrollment[] = [
    {
      id: '1',
      student_id: '1',
      class_id: '1',
      course_id: '1',
      enrollment_date: '2024-01-15',
      status: 'ativo',
      student: mockStudents[0],
      class: mockClasses[0],
      course: mockCourses[0]
    },
    {
      id: '2',
      student_id: '2',
      class_id: '2',
      course_id: '2',
      enrollment_date: '2024-01-20',
      status: 'ativo',
      student: mockStudents[1],
      class: mockClasses[1],
      course: mockCourses[1]
    }
  ];

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEnrollments(mockEnrollments);
      setStudents(mockStudents);
      setClasses(mockClasses);
      setCourses(mockCourses);
    } catch (error) {
      console.error('Error loading enrollments:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar matrículas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnrollment = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const student = mockStudents.find(s => s.id === newEnrollment.student_id);
      const classItem = mockClasses.find(c => c.id === newEnrollment.class_id);
      const course = mockCourses.find(c => c.id === newEnrollment.course_id);
      
      if (!student || !classItem || !course) {
        throw new Error('Dados não encontrados');
      }
      
      const newEnrollmentData: Enrollment = {
        id: Date.now().toString(),
        ...newEnrollment,
        student,
        class: classItem,
        course
      };
      
      setEnrollments([...enrollments, newEnrollmentData]);
      
      toast({
        title: "Sucesso",
        description: "Matrícula criada com sucesso",
      });
      
      setShowNewEnrollmentDialog(false);
      setNewEnrollment({
        student_id: '',
        class_id: '',
        course_id: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'ativo'
      });
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar matrícula",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnrollment = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEnrollments(enrollments.map(enrollment => 
        enrollment.id === id 
          ? { ...enrollment, status: newStatus as any }
          : enrollment
      ));
      
      toast({
        title: "Sucesso",
        description: "Status da matrícula atualizado",
      });
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar matrícula",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!selectedEnrollment) return;
    
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEnrollments(enrollments.filter(enrollment => enrollment.id !== selectedEnrollment.id));
      
      toast({
        title: "Sucesso",
        description: "Matrícula excluída com sucesso",
      });
      
      setShowDeleteDialog(false);
      setSelectedEnrollment(null);
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir matrícula",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = enrollment.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.course.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { color: "bg-green-100 text-green-800", label: "Ativo" },
      inativo: { color: "bg-gray-100 text-gray-800", label: "Inativo" },
      concluido: { color: "bg-blue-100 text-blue-800", label: "Concluído" },
      trancado: { color: "bg-red-100 text-red-800", label: "Trancado" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'ativo').length,
    completed: enrollments.filter(e => e.status === 'concluido').length,
    inactive: enrollments.filter(e => e.status === 'inativo').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestão de Matrículas</h2>
          <p className="text-muted-foreground">Gerencie as matrículas dos alunos</p>
        </div>
        <Button onClick={() => setShowNewEnrollmentDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Matrícula
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inativas</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por aluno, turma ou curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="trancado">Trancado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matrículas ({filteredEnrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Data de Matrícula</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{enrollment.student.full_name}</div>
                      <div className="text-sm text-muted-foreground">{enrollment.student.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{enrollment.class.name}</div>
                      <div className="text-sm text-muted-foreground">{enrollment.class.professor.full_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.course.name}</TableCell>
                  <TableCell>{new Date(enrollment.enrollment_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        value={enrollment.status}
                        onValueChange={(value) => handleUpdateEnrollment(enrollment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="trancado">Trancado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEnrollment(enrollment);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Enrollment Dialog */}
      <Dialog open={showNewEnrollmentDialog} onOpenChange={setShowNewEnrollmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Matrícula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student">Aluno</Label>
              <Select value={newEnrollment.student_id} onValueChange={(value) => setNewEnrollment({...newEnrollment, student_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} - {student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="class">Turma</Label>
              <Select value={newEnrollment.class_id} onValueChange={(value) => setNewEnrollment({...newEnrollment, class_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course">Curso</Label>
              <Select value={newEnrollment.course_id} onValueChange={(value) => setNewEnrollment({...newEnrollment, course_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="enrollment_date">Data de Matrícula</Label>
              <Input
                id="enrollment_date"
                type="date"
                value={newEnrollment.enrollment_date}
                onChange={(e) => setNewEnrollment({...newEnrollment, enrollment_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newEnrollment.status} onValueChange={(value) => setNewEnrollment({...newEnrollment, status: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="trancado">Trancado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEnrollmentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEnrollment} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Matrícula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta matrícula? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEnrollment}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}