
import { useState, useEffect } from "react";
import { User, Grid, List } from "lucide-react";
import { enrollmentService, type StudentData } from "@/services/matriculas.service";
import { MatriculaCard } from "@/components/matriculas/MatriculaCard";
import { MatriculaFilters } from "@/components/matriculas/MatriculaFilters";
import { CreateMatriculaDialog } from "@/components/matriculas/CreateMatriculaDialog";
import { BulkEnrollmentDialog } from "@/components/matriculas/BulkEnrollmentDialog";
import { MatriculaStats } from "@/components/matriculas/MatriculaStats";
import { BulkMatriculaActions } from "@/components/matriculas/BulkMatriculaActions";
import { MatriculasByClass } from "@/components/matriculas/MatriculasByClass";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTurmas } from "@/hooks/useTurmas";
import { useQueryClient } from "@tanstack/react-query";

export function Matriculas() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'class'>('grid');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { toast } = useToast();
  const { data: turmas } = useTurmas();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await enrollmentService.getActiveStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const classes = turmas?.map(turma => ({
    id: turma.id,
    name: turma.name
  })) || [];

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.turma.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesClass = classFilter === "all" || student.turmaId === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const handleStatusChange = async (enrollmentId: string, status: string) => {
    try {
      await enrollmentService.updateEnrollmentStatus(enrollmentId, status as any);
      await loadStudents();
      // Invalidar cache das turmas para atualizar contagem
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({
        title: "Status atualizado",
        description: "O status da matrícula foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da matrícula.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    if (!confirm("Tem certeza que deseja remover esta matrícula?")) return;
    
    try {
      await enrollmentService.removeEnrollment(enrollmentId);
      await loadStudents();
      // Invalidar cache das turmas para atualizar contagem
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({
        title: "Matrícula removida",
        description: "A matrícula foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a matrícula.",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedStudents.length === 0) return;
    
    try {
      await enrollmentService.updateMultipleEnrollmentStatus(selectedStudents, status as any);
      await loadStudents();
      setSelectedStudents([]);
      // Invalidar cache das turmas para atualizar contagem
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({
        title: "Status atualizado",
        description: `${selectedStudents.length} matrícula(s) atualizada(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status das matrículas.",
        variant: "destructive",
      });
    }
  };

  const handleBulkRemove = async () => {
    if (selectedStudents.length === 0) return;
    
    if (!confirm(`Tem certeza que deseja remover ${selectedStudents.length} matrícula(s)?`)) return;
    
    try {
      await enrollmentService.removeMultipleEnrollments(selectedStudents);
      await loadStudents();
      setSelectedStudents([]);
      // Invalidar cache das turmas para atualizar contagem
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({
        title: "Matrículas removidas",
        description: `${selectedStudents.length} matrícula(s) removida(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover as matrículas.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    setSelectedStudents(filteredStudents.map(s => s.enrollmentId));
  };

  const handleClearSelection = () => {
    setSelectedStudents([]);
  };

  const handleStudentSelect = (enrollmentId: string, selected: boolean) => {
    if (selected) {
      setSelectedStudents(prev => [...prev, enrollmentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== enrollmentId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando matrículas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Matrículas</h1>
          <p className="text-muted-foreground">Gerencie todas as matrículas do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4 mr-2" />
              Grade
            </Button>
            <Button
              variant={viewMode === 'class' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('class')}
            >
              <List className="h-4 w-4 mr-2" />
              Por Turma
            </Button>
          </div>
          <BulkEnrollmentDialog onSuccess={loadStudents} />
          <CreateMatriculaDialog onSuccess={loadStudents} />
        </div>
      </div>

      <MatriculaStats students={students} />

      <MatriculaFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <BulkMatriculaActions
        selectedCount={selectedStudents.length}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkRemove={handleBulkRemove}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        classFilter={classFilter}
        onClassFilterChange={setClassFilter}
        classes={classes}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <MatriculaCard 
              key={student.enrollmentId} 
              student={student}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
              selectable={true}
              selected={selectedStudents.includes(student.enrollmentId)}
              onSelect={handleStudentSelect}
            />
          ))}
        </div>
      ) : (
        <MatriculasByClass
          students={filteredStudents}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
          selectedStudents={selectedStudents}
          onStudentSelect={handleStudentSelect}
        />
      )}

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma matrícula encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente ajustar os filtros de busca" : "Comece criando uma nova matrícula"}
          </p>
        </div>
      )}
    </div>
  );
}

export default Matriculas;
