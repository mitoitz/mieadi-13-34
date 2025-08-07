
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BookOpen, Search } from "lucide-react";
import { TurmaCard } from "@/components/turmas/TurmaCard";
import { CreateTurmaDialog } from "@/components/turmas/CreateTurmaDialog";
import { useTurmas } from "@/hooks/useTurmas";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

interface Turma {
  id: string;
  name: string;
  subject: string;
  professor: string;
  students_count: number;
  schedule: string;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
}

export function Turmas() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: turmas, isLoading, error, refetch } = useTurmas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando turmas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Erro ao carregar turmas</p>
          <button onClick={() => refetch()} className="mt-2 text-primary hover:underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const formattedTurmas = turmas?.map(turma => {
    // Pegar a disciplina principal ou a primeira disciplina da lista
    const primarySubject = turma.class_subjects?.find(cs => cs.is_primary) || turma.class_subjects?.[0];
    const subjectName = primarySubject?.subjects?.name || turma.subjects?.name || "Nenhuma disciplina";
    const subjectsCount = turma.class_subjects?.length || 0;
    
    return {
      id: turma.id,
      name: turma.name,
      subject: subjectsCount > 1 ? `${subjectName} (+${subjectsCount - 1})` : subjectName,
      professor: (turma as any).professor?.full_name || "Professor não encontrado",
      students_count: turma.enrollments?.length || 0,
      schedule: turma.schedule || "Não definido",
      status: turma.status as 'active' | 'inactive' | 'completed',
      created_at: turma.created_at,
      subjects_count: subjectsCount
    };
  }) || [];

  const filteredTurmas = formattedTurmas.filter(turma =>
    turma.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.professor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Turmas</h1>
          <p className="text-muted-foreground">Gerencie todas as turmas do sistema</p>
        </div>
        <CreateTurmaDialog onSuccess={() => refetch()} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar turmas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTurmas.map((turma) => (
          <TurmaCard key={turma.id} turma={turma} onDeleted={() => refetch()} />
        ))}
      </div>

      {filteredTurmas.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma turma encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente ajustar os filtros de busca" : "Comece criando uma nova turma"}
          </p>
        </div>
      )}
    </div>
  );
}
