import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserCheck, Calendar, TrendingUp, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStudentGrades, useStudentAverage } from '@/hooks/useStudentGrades';

interface AlunosListProps {
  turmas: any[];
  professorId: string;
}

interface Aluno {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  phone: string;
  age?: number;
  frequencia?: number;
  nota_media?: number;
  turma_nome?: string;
}

export function AlunosList({ turmas, professorId }: AlunosListProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [filteredAlunos, setFilteredAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurma, setSelectedTurma] = useState<string>("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlunos();
  }, [turmas]);

  useEffect(() => {
    filterAlunos();
  }, [alunos, searchTerm, selectedTurma]);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const allAlunos: Aluno[] = [];

      for (const turma of turmas) {
        for (const student of turma.students) {
          // Get student profile details
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', student.student_id)
            .single();

          if (profile) {
            // Age calculation disabled (birth_date column doesn't exist)
            const age = undefined;

            // Get frequency data
            const { data: attendance } = await supabase
              .from('attendances')
              .select('status')
              .eq('student_id', student.student_id)
              .eq('class_id', turma.id);

            const totalClasses = attendance?.length || 0;
            const presentClasses = attendance?.filter(a => a.status === 'present').length || 0;
            const frequencia = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

            // Use function to calculate student average directly
            const { data: studentAverage } = await supabase
              .rpc('calculate_student_average', {
                student_uuid: profile.id,
                class_uuid: turma.id
              });
            
            const nota_media = studentAverage || 0;


            allAlunos.push({
              id: profile.id,
              full_name: profile.full_name || 'Nome não informado',
              email: profile.email || 'Email não informado',
              cpf: profile.cpf || 'CPF não informado',
              phone: profile.phone || 'Telefone não informado',
              age,
              frequencia: Math.round(frequencia),
              nota_media: nota_media,
              turma_nome: turma.name
            });
          }
        }
      }

      setAlunos(allAlunos);
    } catch (error) {
      console.error('Error loading alunos:', error);
      toast.error("Erro ao carregar lista de alunos");
    } finally {
      setLoading(false);
    }
  };

  const filterAlunos = () => {
    let filtered = alunos;

    if (searchTerm) {
      filtered = filtered.filter(aluno =>
        aluno.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTurma !== "todas") {
      filtered = filtered.filter(aluno => aluno.turma_nome === selectedTurma);
    }

    setFilteredAlunos(filtered);
  };

  const getFrequenciaBadge = (frequencia: number) => {
    if (frequencia >= 80) return "default";
    if (frequencia >= 60) return "secondary";
    return "destructive";
  };

  const getNotaBadge = (nota: number) => {
    if (nota >= 7) return "default";
    if (nota >= 5) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedTurma} onValueChange={setSelectedTurma}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as turmas</SelectItem>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={turma.name}>
                {turma.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAlunos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAlunos.length > 0 
                ? Math.round(filteredAlunos.reduce((acc, aluno) => acc + (aluno.frequencia || 0), 0) / filteredAlunos.length)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAlunos.length > 0 
                ? (filteredAlunos.reduce((acc, aluno) => acc + (aluno.nota_media || 0), 0) / filteredAlunos.length).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      {filteredAlunos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || selectedTurma !== "todas" 
                ? "Tente ajustar os filtros de busca."
                : "Você ainda não possui alunos cadastrados em suas turmas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lista de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Nota Média</TableHead>
                    <TableHead>Contato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{aluno.full_name}</p>
                          <p className="text-sm text-muted-foreground">{aluno.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{aluno.turma_nome}</Badge>
                      </TableCell>
                      <TableCell>
                        {aluno.age ? `${aluno.age} anos` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getFrequenciaBadge(aluno.frequencia || 0)}>
                          {aluno.frequencia || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getNotaBadge(aluno.nota_media || 0)}>
                          {aluno.nota_media || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{aluno.phone || "N/A"}</p>
                          <p className="text-muted-foreground">{aluno.cpf}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}