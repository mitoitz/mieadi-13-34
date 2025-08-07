import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, Users, TrendingUp, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RelatoriosProfessorProps {
  professorId: string;
  turmas: any[];
}

interface RelatorioAluno {
  id: string;
  full_name: string;
  turma_nome: string;
  frequencia: number;
  nota_media: number;
  total_avaliacoes: number;
  avaliacoes_enviadas: number;
}

interface RelatorioTurma {
  id: string;
  nome: string;
  total_alunos: number;
  frequencia_media: number;
  nota_media: number;
  total_materiais: number;
  total_avaliacoes: number;
}

export function RelatoriosProfessor({ professorId, turmas }: RelatoriosProfessorProps) {
  const [selectedTurma, setSelectedTurma] = useState<string>("todas");
  const [relatorioAlunos, setRelatorioAlunos] = useState<RelatorioAluno[]>([]);
  const [relatorioTurmas, setRelatorioTurmas] = useState<RelatorioTurma[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRelatorios();
  }, [professorId, turmas, selectedTurma]);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRelatorioAlunos(),
        loadRelatorioTurmas()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorioAlunos = async () => {
    const turmasToLoad = selectedTurma === "todas" ? turmas : turmas.filter(t => t.id === selectedTurma);
    const relatorios: RelatorioAluno[] = [];

    for (const turma of turmasToLoad) {
      for (const student of turma.students || []) {
        // Get student profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', student.student_id)
          .single();

        if (profile) {
          // Calculate frequency
          const { data: attendance } = await supabase
            .from('attendances')
            .select('status')
            .eq('student_id', student.student_id)
            .eq('class_id', turma.id);

          const totalClasses = attendance?.length || 0;
          const presentClasses = attendance?.filter(a => a.status === 'present').length || 0;
          const frequencia = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

          // Get assessments for this class
          const { data: assessments } = await supabase
            .from('assessments')
            .select('id')
            .eq('class_id', turma.id);

          const totalAvaliacoes = assessments?.length || 0;

          // Temporarily disabled - assessment_submissions table doesn't exist yet
          // const { data: submissions } = await supabase
          //   .from('assessment_submissions')
          //   .select('grade')
          //   .eq('student_id', student.student_id)
          //   .in('assessment_id', assessments?.map(a => a.id) || []);

          const avaliacoesEnviadas = 0; // submissions?.length || 0;
          const notaMedia = 0; // validGrades.length > 0 ? ... : 0;

          relatorios.push({
            id: profile.id,
            full_name: profile.full_name || 'Nome não informado',
            turma_nome: turma.name,
            frequencia: Math.round(frequencia),
            nota_media: Math.round(notaMedia * 100) / 100,
            total_avaliacoes: totalAvaliacoes,
            avaliacoes_enviadas: avaliacoesEnviadas
          });
        }
      }
    }

    setRelatorioAlunos(relatorios);
  };

  const loadRelatorioTurmas = async () => {
    const relatorios: RelatorioTurma[] = [];

    for (const turma of turmas) {
      const totalAlunos = turma.students?.length || 0;

      // Calculate average frequency for the class
      const allAttendance = [];
      for (const student of turma.students || []) {
        const { data: attendance } = await supabase
          .from('attendances')
          .select('status')
          .eq('student_id', student.student_id)
          .eq('class_id', turma.id);

        if (attendance && attendance.length > 0) {
          const present = attendance.filter(a => a.status === 'present').length;
          const total = attendance.length;
          allAttendance.push((present / total) * 100);
        }
      }

      const frequenciaMedia = allAttendance.length > 0 
        ? allAttendance.reduce((sum, freq) => sum + freq, 0) / allAttendance.length 
        : 0;

      // Get materials count
      const { count: materialsCount } = await supabase
        .from('class_materials')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', turma.id);

      // Get assessments count
      const { count: assessmentsCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', turma.id);

      // Temporarily disabled - assessment_submissions table doesn't exist yet
      // const { data: submissions } = await supabase
      //   .from('assessment_submissions')
      //   .select('grade, assessment_id')
      //   .not('grade', 'is', null);

      // const classSubmissions = submissions?.filter(s => {
      //   return true; // Simplified for now
      // }) || [];

      // const validGrades = classSubmissions.map(s => s.grade);
      const notaMedia = 0; // Simplified for now

      relatorios.push({
        id: turma.id,
        nome: turma.name,
        total_alunos: totalAlunos,
        frequencia_media: Math.round(frequenciaMedia),
        nota_media: Math.round(notaMedia * 100) / 100,
        total_materiais: materialsCount || 0,
        total_avaliacoes: assessmentsCount || 0
      });
    }

    setRelatorioTurmas(relatorios);
  };

  const exportToPDF = () => {
    // This would implement PDF export functionality
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  const exportToExcel = () => {
    // This would implement Excel export functionality
    toast.info("Funcionalidade de exportação em desenvolvimento");
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
    <div className="space-y-6">
      {/* Header with filters and export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho de suas turmas e alunos
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedTurma} onValueChange={setSelectedTurma}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {turmas.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>
                  {turma.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorioAlunos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência Geral</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorioAlunos.length > 0 
                ? Math.round(relatorioAlunos.reduce((acc, aluno) => acc + aluno.frequencia, 0) / relatorioAlunos.length)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nota Média Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorioAlunos.length > 0 
                ? (relatorioAlunos.reduce((acc, aluno) => acc + aluno.nota_media, 0) / relatorioAlunos.length).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorioAlunos.length > 0 
                ? Math.round(
                    (relatorioAlunos.reduce((acc, aluno) => acc + aluno.avaliacoes_enviadas, 0) /
                     relatorioAlunos.reduce((acc, aluno) => acc + aluno.total_avaliacoes, 0)) * 100
                  ) || 0
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different reports */}
      <Tabs defaultValue="alunos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alunos">Relatório por Aluno</TabsTrigger>
          <TabsTrigger value="turmas">Relatório por Turma</TabsTrigger>
        </TabsList>

        <TabsContent value="alunos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho Individual dos Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              {relatorioAlunos.length === 0 ? (
                <div className="text-center p-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há dados de alunos para exibir no relatório.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Nota Média</TableHead>
                        <TableHead>Avaliações</TableHead>
                        <TableHead>Participação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioAlunos.map((aluno) => (
                        <TableRow key={aluno.id}>
                          <TableCell className="font-medium">{aluno.full_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{aluno.turma_nome}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getFrequenciaBadge(aluno.frequencia)}>
                              {aluno.frequencia}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getNotaBadge(aluno.nota_media)}>
                              {aluno.nota_media}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {aluno.avaliacoes_enviadas}/{aluno.total_avaliacoes}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              aluno.total_avaliacoes > 0 && (aluno.avaliacoes_enviadas / aluno.total_avaliacoes) >= 0.8 
                                ? "default" 
                                : "secondary"
                            }>
                              {aluno.total_avaliacoes > 0 
                                ? Math.round((aluno.avaliacoes_enviadas / aluno.total_avaliacoes) * 100)
                                : 0}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turmas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Turma</CardTitle>
            </CardHeader>
            <CardContent>
              {relatorioTurmas.length === 0 ? (
                <div className="text-center p-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma turma encontrada</h3>
                  <p className="text-muted-foreground">
                    Você ainda não possui turmas para gerar relatórios.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Turma</TableHead>
                        <TableHead>Alunos</TableHead>
                        <TableHead>Frequência Média</TableHead>
                        <TableHead>Nota Média</TableHead>
                        <TableHead>Materiais</TableHead>
                        <TableHead>Avaliações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioTurmas.map((turma) => (
                        <TableRow key={turma.id}>
                          <TableCell className="font-medium">{turma.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{turma.total_alunos}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getFrequenciaBadge(turma.frequencia_media)}>
                              {turma.frequencia_media}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getNotaBadge(turma.nota_media)}>
                              {turma.nota_media}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{turma.total_materiais}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{turma.total_avaliacoes}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}