import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  ClipboardCheck, 
  Calendar, 
  Award, 
  FileText, 
  Clock,
  Target,
  TrendingUp,
  User,
  GraduationCap,
  QrCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeManager } from "@/components/profile/QRCodeManager";
import { supabase } from "@/integrations/supabase/client";

interface AlunoDashboardProps {
  user: {
    id: string;
    name: string;
    userType: string;
  };
}

export function AlunoDashboard({ user }: AlunoDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("aulas");
  const [minhasAulas, setMinhasAulas] = useState<any[]>([]);
  const [minhasNotas, setMinhasNotas] = useState<any[]>([]);
  const [avaliacoesPendentes, setAvaliacoesPendentes] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDadosAluno();
  }, [user.id]);

  const loadDadosAluno = async () => {
    try {
      setLoading(true);

      // Buscar turmas/disciplinas do aluno
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          classes (
            id,
            name,
            subjects (
              name,
              courses (name)
            ),
            profiles (
              full_name
            ),
            class_sessions (
              session_date,
              session_time,
              status
            )
          )
        `)
        .eq('student_id', user.id);

      if (enrollmentsError) throw enrollmentsError;

      // Processar dados das aulas
      const aulas = enrollments?.map(enrollment => {
        const classe = enrollment.classes;
        if (!classe) return null;

        // Encontrar próxima sessão
        // @ts-ignore - Temporary fix for Supabase types
        const proximaSessao = (classe as any).class_sessions
          ?.filter((session: any) => new Date(session.session_date) >= new Date())
          .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0];

        // @ts-ignore - Temporary fix for Supabase types
        const sessoesConcluidas = (classe as any).class_sessions?.filter((s: any) => s.status === 'completed').length || 0;
        // @ts-ignore - Temporary fix for Supabase types
        const totalSessoes = (classe as any).class_sessions?.length || 1;
        const progresso = Math.round((sessoesConcluidas / totalSessoes) * 100);

        return {
          // @ts-ignore - Temporary fix for Supabase types
          id: (classe as any).id,
          // @ts-ignore - Temporary fix for Supabase types
          disciplina: (classe as any).subjects?.name || 'Disciplina',
          // @ts-ignore - Temporary fix for Supabase types
          professor: (classe as any).profiles?.full_name || 'Professor',
          proximaAula: proximaSessao?.session_date || null,
          progresso,
          status: 'Em andamento'
        };
      }).filter(Boolean) || [];

      setMinhasAulas(aulas);

      // Buscar notas do aluno
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          grade,
          assessment_type,
          classes (
            subjects (name)
          )
        `)
        .eq('student_id', user.id);

      if (gradesError) throw gradesError;

      // Processar notas agrupadas por disciplina
      const notasPorDisciplina = new Map();
      grades?.forEach((grade: any) => {
        // @ts-ignore - Temporary fix for Supabase types
        const disciplina = (grade.classes as any)?.subjects?.name;
        if (disciplina) {
          if (!notasPorDisciplina.has(disciplina)) {
            notasPorDisciplina.set(disciplina, []);
          }
          notasPorDisciplina.get(disciplina).push(grade.grade);
        }
      });

      const notasProcessadas = Array.from(notasPorDisciplina.entries()).map(([disciplina, notas]) => {
        const media = notas.reduce((sum: number, nota: number) => sum + nota, 0) / notas.length;
        return {
          disciplina,
          nota: media,
          status: media >= 7 ? 'Aprovado' : media >= 5 ? 'Em andamento' : 'Reprovado'
        };
      });

      setMinhasNotas(notasProcessadas);

      // Buscar avaliações pendentes (assessments)
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          id,
          title,
          type,
          end_date,
          classes (
            subjects (name)
          )
        `)
        .eq('is_published', true)
        .gte('end_date', new Date().toISOString());

      if (assessmentsError) throw assessmentsError;

      const avaliacoesPendentes = assessments?.map((assessment: any) => ({
        id: assessment.id,
        // @ts-ignore - Temporary fix for Supabase types
        disciplina: (assessment.classes as any)?.subjects?.name || 'Disciplina',
        tipo: assessment.type || 'Avaliação',
        prazo: assessment.end_date,
        status: 'Pendente'
      })) || [];

      setAvaliacoesPendentes(avaliacoesPendentes);

      // Buscar dados do perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Profile not found:', profileError);
      } else {
        setProfileData(profile);
      }

    } catch (error) {
      console.error('Error loading student data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do aluno",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const acessarAula = (aula: any) => {
    toast({
      title: "Acessando Aula",
      description: `Redirecionando para ${aula.disciplina}`
    });
  };

  const realizarAvaliacao = (avaliacao: any) => {
    toast({
      title: "Iniciando Avaliação",
      description: `${avaliacao.tipo} de ${avaliacao.disciplina}`
    });
  };

  const mediaGeral = minhasNotas.reduce((acc, nota) => acc + nota.nota, 0) / minhasNotas.length || 0;
  const disciplinasCompletas = minhasAulas.filter(a => a.progresso === 100).length;
  const frequenciaMedia = 92; // Mock data

  const stats = {
    disciplinasAtivas: minhasAulas.length,
    mediaGeral: mediaGeral.toFixed(1),
    avaliacoesPendentes: avaliacoesPendentes.length,
    frequenciaMedia
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel do aluno...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Meu Painel Acadêmico</h1>
          <p className="text-muted-foreground">
            Bem-vindo, <span className="font-medium text-foreground">{user.name}</span> - Acompanhe seu progresso acadêmico
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="px-4 py-2 text-sm font-medium">
            <GraduationCap className="h-4 w-4 mr-2" />
            Aluno
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disciplinas Ativas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.disciplinasAtivas}</div>
            <p className="text-xs text-muted-foreground mt-1">Cursando atualmente</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média Geral</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.mediaGeral}</div>
            <p className="text-xs text-muted-foreground mt-1">Notas das disciplinas</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avaliações Pendentes</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
              <ClipboardCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.avaliacoesPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Para realizar</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Frequência</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.frequenciaMedia}%</div>
            <p className="text-xs text-muted-foreground mt-1">Presença média</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-12">
            <TabsTrigger value="aulas" className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Minhas Aulas</span>
            </TabsTrigger>
            <TabsTrigger value="notas" className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Notas</span>
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="flex items-center gap-2 text-sm">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Avaliações</span>
            </TabsTrigger>
            <TabsTrigger value="materiais" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Materiais</span>
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="flex items-center gap-2 text-sm">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Meu QR Code</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="aulas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Disciplinas</CardTitle>
              <CardDescription>
                Acompanhe o progresso das suas disciplinas e próximas aulas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {minhasAulas.map((aula) => (
                  <Card key={aula.id} className="hover-scale">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{aula.disciplina}</h3>
                            <Badge variant="outline">{aula.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Professor: {aula.professor}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {aula.proximaAula ? (
                              <>Próxima aula: {new Date(aula.proximaAula).toLocaleDateString('pt-BR')} às {new Date(aula.proximaAula).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
                            ) : (
                              'Nenhuma aula agendada'
                            )}
                          </div>
                        </div>
                        <Button onClick={() => acessarAula(aula)}>
                          Acessar Aula
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso da disciplina</span>
                          <span>{aula.progresso}%</span>
                        </div>
                        <Progress value={aula.progresso} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Notas</CardTitle>
              <CardDescription>
                Visualize suas notas e desempenho acadêmico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-muted/20 rounded-lg">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.mediaGeral}</div>
                  <p className="text-muted-foreground">Média Geral</p>
                </div>
                {minhasNotas.map((nota, index) => (
                  <Card key={index}>
                    <CardContent className="flex justify-between items-center p-4">
                      <div>
                        <h3 className="font-semibold">{nota.disciplina}</h3>
                        <Badge 
                          variant={nota.nota >= 7 ? "default" : nota.nota >= 5 ? "secondary" : "destructive"}
                        >
                          {nota.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{nota.nota}</div>
                        <p className="text-xs text-muted-foreground">Nota</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações Pendentes</CardTitle>
              <CardDescription>
                Realize suas avaliações dentro do prazo estabelecido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {avaliacoesPendentes.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação pendente</h3>
                    <p className="text-muted-foreground">Parabéns! Você está em dia com suas avaliações</p>
                  </div>
                ) : (
                  avaliacoesPendentes.map((avaliacao) => (
                    <Card key={avaliacao.id} className="hover-scale">
                      <CardContent className="flex justify-between items-center p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{avaliacao.disciplina}</h3>
                            <Badge variant="secondary">{avaliacao.tipo}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Prazo: {new Date(avaliacao.prazo).toLocaleDateString('pt-BR')} às {new Date(avaliacao.prazo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {avaliacao.status}
                          </Badge>
                        </div>
                        <Button onClick={() => realizarAvaliacao(avaliacao)}>
                          Realizar {avaliacao.tipo}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materiais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais de Estudo</CardTitle>
              <CardDescription>
                Acesse materiais de suas disciplinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Materiais Disponíveis</h3>
                <p className="text-muted-foreground">Seus professores disponibilizarão materiais aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Meu QR Code de Frequência
              </CardTitle>
              <CardDescription>
                Use este QR Code para marcar sua presença em aulas e eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <QRCodeManager 
                  userId={user.id}
                  userQRCode={profileData.qr_code}
                  onQRCodeGenerated={(qrCode) => {
                    setProfileData({...profileData, qr_code: qrCode});
                    toast({
                      title: "QR Code atualizado!",
                      description: "Seu QR Code foi gerado com sucesso."
                    });
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Carregando QR Code</h3>
                  <p className="text-muted-foreground">Aguarde enquanto carregamos seus dados...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}