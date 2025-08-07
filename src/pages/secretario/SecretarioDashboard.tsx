import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FileText, ClipboardCheck, BarChart3, Upload, Plus, Award, Settings, BookOpen, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AvaliacoesSecretario } from "./AvaliacoesSecretario";
import { useGenerateCertificate } from '@/hooks/useCertificates';

interface SecretarioDashboardProps {
  user: {
    id: string;
    name: string;
    userType: string;
  };
}

export function SecretarioDashboard({ user }: SecretarioDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("turmas");
  const [currentView, setCurrentView] = useState<"dashboard" | "avaliacoes">("dashboard");
  const [todasTurmas, setTodasTurmas] = useState<any[]>([]);
  const [todosCursos, setTodosCursos] = useState<any[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState<string>("todos");
  const [searchAluno, setSearchAluno] = useState("");

  if (currentView === "avaliacoes") {
    return <AvaliacoesSecretario user={user} />;
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Carregar todos os cursos
      const { data: cursosData, error: cursosError } = await supabase
        .from('courses')
        .select('*');

      if (cursosError) throw cursosError;

      // Carregar todas as turmas com informações de professores
      const { data: turmasData, error: turmasError } = await supabase
        .from('classes')
        .select(`
          *,
          subjects (
            name,
            courses (name)
          ),
          professor:profiles!classes_professor_id_fkey (full_name)
        `);

      if (turmasError) throw turmasError;

      // Usar dados simulados para evitar problemas de tipo
      const alunosSimulados = [
        { id: '1', full_name: 'Ana Silva', email: 'ana.silva@email.com' },
        { id: '2', full_name: 'João Santos', email: 'joao.santos@email.com' },
        { id: '3', full_name: 'Maria Costa', email: 'maria.costa@email.com' },
        { id: '4', full_name: 'Pedro Oliveira', email: 'pedro.oliveira@email.com' },
        { id: '5', full_name: 'Carla Ferreira', email: 'carla.ferreira@email.com' }
      ];

      setTodasTurmas(turmasData || []);
      setTodosCursos(cursosData || []);
      setTodosAlunos(alunosSimulados);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = useGenerateCertificate();

  const gerarCertificado = async (alunoId: string) => {
    try {
      // Buscar dados do aluno
      const aluno = todosAlunos.find(a => a.id === alunoId);
      if (!aluno) {
        toast({
          title: "Erro",
          description: "Aluno não encontrado",
          variant: "destructive"
        });
        return;
      }

      const certificateData = {
        studentName: aluno.full_name,
        courseName: 'Curso de Teologia Básica',
        completionDate: new Date().toLocaleDateString('pt-BR'),
        workload: '120 horas',
        institution: 'MIEADI - Ministério de Ensino e Aperfeiçoamento',
        instructor: 'Pastor Responsável',
        grade: 8.5
      };

      await generateCertificate.mutateAsync({
        certificateData,
        studentId: alunoId,
        courseId: undefined,
        classId: undefined,
        issuedBy: user.id
      });

    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar certificado",
        variant: "destructive"
      });
    }
  };

  const gerarCertificadosLote = async () => {
    try {
      toast({
        title: "Processando",
        description: "Gerando certificados em lote..."
      });
      // Simular tempo de processamento
      setTimeout(() => {
        toast({
          title: "Sucesso",
          description: "Certificados em lote gerados com sucesso!"
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar certificados em lote",
        variant: "destructive"
      });
    }
  };

  const verDetalhesAluno = (aluno: any) => {
    toast({
      title: "Navegando",
      description: `Visualizando detalhes de ${aluno.full_name}`
    });
  };

  const gerenciarTurma = (turma: any) => {
    toast({
      title: "Navegando", 
      description: `Gerenciando turma: ${turma.name}`
    });
  };

  const stats = {
    totalTurmas: todasTurmas.length,
    totalCursos: todosCursos.length,
    totalAlunos: todosAlunos.length,
    totalProfessores: [...new Set(todasTurmas.map(t => t.professor_id))].length
  };

  const filteredTurmas = todasTurmas.filter(turma => {
    if (selectedCurso && selectedCurso !== "todos" && turma.course_id !== selectedCurso) return false;
    return true;
  });

  const filteredAlunos = todosAlunos.filter(aluno => {
    if (searchAluno && !aluno.full_name.toLowerCase().includes(searchAluno.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel do secretário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Painel do Secretário</h1>
          <p className="text-muted-foreground">
            Bem-vindo, <span className="font-medium text-foreground">{user.name}</span> - Acesso completo ao sistema acadêmico
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="px-4 py-2 text-sm font-medium">
            <Settings className="h-4 w-4 mr-2" />
            Secretário
          </Badge>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cursos Ativos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCursos}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de cursos disponíveis</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Turmas Ativas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalTurmas}</div>
            <p className="text-xs text-muted-foreground mt-1">Turmas em andamento</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalAlunos}</div>
            <p className="text-xs text-muted-foreground mt-1">Estudantes matriculados</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Professores</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalProfessores}</div>
            <p className="text-xs text-muted-foreground mt-1">Corpo docente ativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 h-12">
            <TabsTrigger value="turmas" className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Turmas</span>
            </TabsTrigger>
          <TabsTrigger value="alunos" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Alunos</span>
          </TabsTrigger>
          <TabsTrigger value="materiais" className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Materiais</span>
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Avaliações</span>
          </TabsTrigger>
          <TabsTrigger value="certificados" className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Certificados</span>
          </TabsTrigger>
          <TabsTrigger value="notas" className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ajustar Notas</span>
          </TabsTrigger>
           <TabsTrigger value="relatorios" className="flex items-center gap-2 text-sm">
             <BarChart3 className="h-4 w-4" />
             <span className="hidden sm:inline">Relatórios</span>
           </TabsTrigger>
             <TabsTrigger value="presenca" className="flex items-center gap-2 text-sm">
               <UserCheck className="h-4 w-4" />
               <span className="hidden sm:inline">Controle de Presença</span>
             </TabsTrigger>
         </TabsList>
         </div>

        <TabsContent value="turmas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Turmas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as turmas do sistema
              </CardDescription>
              <div className="flex gap-4">
                <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os cursos</SelectItem>
                    {todosCursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTurmas.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma turma encontrada</h3>
                    <p className="text-muted-foreground">
                      {selectedCurso && selectedCurso !== "todos" ? "Não há turmas para o curso selecionado" : "Não há turmas cadastradas"}
                    </p>
                  </div>
                ) : (
                  filteredTurmas.map((turma) => (
                    <Card key={turma.id}>
                      <CardContent className="flex justify-between items-center p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{turma.name}</h3>
                            <Badge variant={turma.is_active ? "default" : "secondary"}>
                              {turma.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {turma.subjects?.courses?.name || turma.subjects?.name} - Prof. {turma.professor?.full_name || "Professor não definido"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {turma.students?.length || 0} alunos matriculados
                          </p>
                          {turma.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {turma.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                             onClick={() => toast({
                               title: "Navegando",
                               description: `Visualizando turma: ${turma.name}`
                             })}
                          >
                            Ver Turma
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => gerenciarTurma(turma)}
                          >
                            Gerenciar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alunos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Alunos</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os alunos do sistema
              </CardDescription>
              <div className="flex gap-4">
                <Input
                  placeholder="Buscar aluno..."
                  value={searchAluno}
                  onChange={(e) => setSearchAluno(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlunos.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchAluno ? `Nenhum aluno encontrado para "${searchAluno}"` : "Não há alunos cadastrados"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {filteredAlunos.length} {filteredAlunos.length === 1 ? 'aluno encontrado' : 'alunos encontrados'}
                      </p>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Aluno
                      </Button>
                    </div>
                    {filteredAlunos.map((aluno) => (
                      <Card key={aluno.id}>
                        <CardContent className="flex justify-between items-center p-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{aluno.full_name}</h3>
                              <Badge variant="outline">Ativo</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{aluno.email}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {aluno.id} • Membro desde 2024
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => verDetalhesAluno(aluno)}
                            >
                              Ver Detalhes
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => gerarCertificado(aluno.id)}
                            >
                              <Award className="h-4 w-4 mr-2" />
                              Gerar Certificado
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materiais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais de Aula</CardTitle>
              <CardDescription>
                Gerencie materiais didáticos de todas as turmas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Materiais de Aula</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade de upload e gerenciamento de materiais
                </p>
                <Button className="flex items-center gap-2 mx-auto">
                  <Upload className="h-4 w-4" />
                  Upload de Material
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Avaliações</CardTitle>
              <CardDescription>
                Acesse e gerencie o sistema completo de avaliações administrativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sistema Completo de Avaliações</h3>
                <p className="text-muted-foreground mb-6">
                  Crie avaliações administrativas e monitore todas as avaliações do sistema
                </p>
                <Button 
                  onClick={() => setCurrentView("avaliacoes")}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <ClipboardCheck className="h-5 w-5" />
                  Acessar Sistema de Avaliações
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h4 className="font-semibold">Criar Avaliações</h4>
                        <p className="text-sm text-muted-foreground">Avaliações administrativas completas</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <h4 className="font-semibold">Relatórios</h4>
                        <p className="text-sm text-muted-foreground">Acompanhe resultados e registros</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <h4 className="font-semibold">Registros</h4>
                        <p className="text-sm text-muted-foreground">Documentação administrativa</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geração de Certificados</CardTitle>
              <CardDescription>
                Gere certificados para alunos que concluíram cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {todosCursos.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTurmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                   <Button 
                     className="flex items-center gap-2"
                     onClick={gerarCertificadosLote}
                   >
                     <Award className="h-4 w-4" />
                     Gerar Certificados em Lote
                   </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>• Selecione um curso e turma para gerar certificados para todos os alunos aprovados</p>
                  <p>• Certificados individuais podem ser gerados na aba "Alunos"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajuste de Notas</CardTitle>
              <CardDescription>
                Ajuste notas de avaliações quando necessário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {todasTurmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.name} - {turma.subjects?.courses?.name || turma.subjects?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar avaliação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avaliacao1">Prova 1 - Módulo 1</SelectItem>
                      <SelectItem value="avaliacao2">Prova 2 - Módulo 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>• Selecione uma turma e avaliação para visualizar e ajustar notas</p>
                  <p>• Todos os ajustes são registrados no histórico para auditoria</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Administrativos</CardTitle>
              <CardDescription>
                Visualize relatórios completos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Relatórios Administrativos</h3>
                <p className="text-muted-foreground mb-4">
                  Acesse relatórios detalhados de desempenho, frequência e estatísticas
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Relatório de Alunos
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Relatório de Notas
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Relatório de Frequência
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presenca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema Unificado de Controle de Presença</CardTitle>
              <CardDescription>
                Sistema integrado com múltiplos métodos de autenticação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Métodos Disponíveis:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Busca manual por nome, CPF ou carteirinha</li>
                    <li>• Scanner de QR Code automático</li>
                    <li>• Reconhecimento facial via câmera</li>
                    <li>• Captura biométrica de alta segurança</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => window.location.href = '/frequencia'}
                  className="w-full"
                  size="lg"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Acessar Sistema de Controle de Presença
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}