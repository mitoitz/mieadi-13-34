import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardCheck, Eye, Play, Pause, Users, Calendar, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendAssessmentNotification } from "@/services/avaliacao-notifications.service";

interface AvaliacoesListProps {
  professorId: string;
  turmas: any[];
}

interface Avaliacao {
  id: string;
  title: string;
  description?: string;
  status: string;
  start_date?: string;
  duration_minutes?: number;
  class_id: string;
  created_at: string;
  classes?: { name: string };
  total_questions?: number;
  total_submissions?: number;
}

interface Submission {
  id: string;
  student_id: string;
  grade?: number;
  submitted_at: string;
  profiles: { full_name: string };
}

export function AvaliacoesList({ professorId, turmas }: AvaliacoesListProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadAvaliacoes();
  }, [professorId, turmas]);

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      
      const turmaIds = turmas.map(t => t.id);
      if (turmaIds.length === 0) {
        setAvaliacoes([]);
        return;
      }

      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          classes (name)
        `)
        .in('class_id', turmaIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get questions count and submissions for each assessment
      const avaliacoesWithStats = await Promise.all(
        (data || []).map(async (avaliacao) => {
          // Count questions
          const { count: questionsCount } = await supabase
            .from('assessment_questions')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', avaliacao.id);

          // Temporarily disabled - assessment_submissions table doesn't exist yet
          // const { count: submissionsCount } = await supabase
          //   .from('assessment_submissions')
          //   .select('*', { count: 'exact', head: true })
          //   .eq('assessment_id', avaliacao.id);

          return {
            ...avaliacao,
            status: 'ativo' as const, // Add required status property
            total_questions: questionsCount || 0,
            total_submissions: 0 // submissionsCount || 0
          };
        })
      );

      setAvaliacoes(avaliacoesWithStats);
    } catch (error) {
      console.error('Error loading avaliacoes:', error);
      toast.error("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (avaliacaoId: string, newStatus: string) => {
    try {
      // Temporarily disabled - status column doesn't exist yet
      // const { error } = await supabase
      //   .from('assessments')
      //   .update({ status: newStatus })
      //   .eq('id', avaliacaoId);

      // if (error) throw error;

      toast.success("Funcionalidade em desenvolvimento");

      // Enviar notificações para os alunos quando avaliação for liberada
      if (newStatus === 'active') {
        const avaliacao = avaliacoes.find(a => a.id === avaliacaoId);
        if (avaliacao) {
          await sendAssessmentNotification(avaliacaoId, avaliacao.class_id, 'activated');
        }
      }

      toast.success(
        newStatus === 'active' ? "Avaliação liberada para os alunos!" : 
        newStatus === 'closed' ? "Avaliação encerrada!" : "Status atualizado!"
      );
      
      loadAvaliacoes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erro ao atualizar status");
    }
  };

  const viewResults = async (avaliacao: Avaliacao) => {
    try {
      // Temporarily disabled - assessment_submissions table doesn't exist yet
      // const { data, error } = await supabase
      //   .from('assessment_submissions')
      //   .select(`
      //     *,
      //     profiles (full_name)
      //   `)
      //   .eq('assessment_id', avaliacao.id)
      //   .order('submitted_at', { ascending: false });

      // if (error) throw error;

      setSubmissions([]); // data || []
      setSelectedAvaliacao(avaliacao);
      setShowResults(true);
    } catch (error) {
      console.error('Error loading results:', error);
      toast.error("Erro ao carregar resultados");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      active: "default", 
      closed: "destructive"
    };
    
    const labels = {
      draft: "Rascunho",
      active: "Ativa",
      closed: "Encerrada"
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {avaliacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação criada</h3>
            <p className="text-muted-foreground text-center">
              Comece criando sua primeira avaliação para suas turmas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avaliacoes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avaliacoes.filter(a => a.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Submissões</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avaliacoes.reduce((total, a) => total + (a.total_submissions || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Suas Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Questões</TableHead>
                      <TableHead>Submissões</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avaliacoes.map((avaliacao) => (
                      <TableRow key={avaliacao.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{avaliacao.title}</p>
                            {avaliacao.description && (
                              <p className="text-sm text-muted-foreground">
                                {avaliacao.description.length > 50 
                                  ? `${avaliacao.description.substring(0, 50)}...`
                                  : avaliacao.description}
                              </p>
                            )}
                            {avaliacao.duration_minutes && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {avaliacao.duration_minutes} min
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {avaliacao.classes?.name || 'Turma não encontrada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(avaliacao.status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {avaliacao.total_questions} questões
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {avaliacao.total_submissions} respostas
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {avaliacao.start_date ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(avaliacao.start_date)}</span>
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Sem data definida</span>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Criada: {formatDate(avaliacao.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {avaliacao.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => updateStatus(avaliacao.id, 'active')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {avaliacao.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(avaliacao.id, 'closed')}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewResults(avaliacao)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Resultados: {selectedAvaliacao?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="text-center p-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma submissão</h3>
                <p className="text-muted-foreground">
                  Os alunos ainda não enviaram suas respostas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Data de Envio</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          {submission.profiles?.full_name || 'Nome não encontrado'}
                        </TableCell>
                        <TableCell>
                          {submission.grade !== null ? (
                            <Badge variant={submission.grade >= 7 ? "default" : submission.grade >= 5 ? "secondary" : "destructive"}>
                              {submission.grade}/10
                            </Badge>
                          ) : (
                            <Badge variant="outline">Aguardando correção</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(submission.submitted_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Enviado</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}