import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FileText, ClipboardCheck, BarChart3, Upload, Plus, Award, Settings, BookOpen, Calendar, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AvaliacoesCoordenador } from "./AvaliacoesCoordenador";

interface CoordenadorDashboardProps {
  user: {
    id: string;
    name: string;
    userType: string;
  };
}

export function CoordenadorDashboard({ user }: CoordenadorDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cursos");
  const [currentView, setCurrentView] = useState<"dashboard" | "avaliacoes">("dashboard");
  const [todosCursos, setTodosCursos] = useState<any[]>([]);
  const [todasTurmas, setTodasTurmas] = useState<any[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<any[]>([]);
  const [todosProfessores, setTodosProfessores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState<string>("todos");
  const [searchProfessor, setSearchProfessor] = useState("");

  if (currentView === "avaliacoes") {
    return <AvaliacoesCoordenador user={user} />;
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

      // Carregar todas as turmas
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

      // Dados simulados para demonstração
      const alunosSimulados = [
        { id: '1', full_name: 'Ana Silva', email: 'ana.silva@email.com', curso: 'Teologia' },
        { id: '2', full_name: 'João Santos', email: 'joao.santos@email.com', curso: 'Missões' },
        { id: '3', full_name: 'Maria Costa', email: 'maria.costa@email.com', curso: 'Teologia' },
        { id: '4', full_name: 'Pedro Oliveira', email: 'pedro.oliveira@email.com', curso: 'Liderança' },
        { id: '5', full_name: 'Carla Ferreira', email: 'carla.ferreira@email.com', curso: 'Missões' }
      ];

      const professoresSimulados = [
        { id: '1', full_name: 'Dr. Paulo Silva', email: 'paulo.silva@email.com', especialidade: 'Teologia Sistemática' },
        { id: '2', full_name: 'Pr. Maria Santos', email: 'maria.santos@email.com', especialidade: 'Missões Transculturais' },
        { id: '3', full_name: 'Rev. João Costa', email: 'joao.costa@email.com', especialidade: 'Liderança Cristã' }
      ];

      setTodosCursos(cursosData || []);
      setTodasTurmas(turmasData || []);
      setTodosAlunos(alunosSimulados);
      setTodosProfessores(professoresSimulados);
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

  const criarNovoCurso = () => {
    toast({
      title: "Navegando",
      description: "Direcionando para criação de novo curso"
    });
  };

  const gerenciarCurso = (curso: any) => {
    toast({
      title: "Navegando", 
      description: `Gerenciando curso: ${curso.name}`
    });
  };

  const designarProfessor = (professor: any) => {
    toast({
      title: "Designação",
      description: `Designando professor: ${professor.full_name}`
    });
  };

  const aprovarPlanejamento = (turma: any) => {
    toast({
      title: "Sucesso",
      description: `Planejamento da turma ${turma.name} aprovado`
    });
  };

  const stats = {
    totalCursos: todosCursos.length,
    totalTurmas: todasTurmas.length,
    totalAlunos: todosAlunos.length,
    totalProfessores: todosProfessores.length
  };

  const filteredCursos = todosCursos.filter(curso => {
    if (selectedCurso && selectedCurso !== "todos" && curso.id !== selectedCurso) return false;
    return true;
  });

  const filteredProfessores = todosProfessores.filter(professor => {
    if (searchProfessor && !professor.full_name.toLowerCase().includes(searchProfessor.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel do coordenador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Painel do Coordenador</h1>
          <p className="text-muted-foreground">
            Bem-vindo, <span className="font-medium text-foreground">{user.name}</span> - Coordenação acadêmica e pedagógica
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
            <Target className="h-4 w-4 mr-2" />
            Coordenador
          </Badge>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cursos Coordenados</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCursos}</div>
            <p className="text-xs text-muted-foreground mt-1">Sob sua coordenação</p>
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
            <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alunos Ativos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalAlunos}</div>
            <p className="text-xs text-muted-foreground mt-1">Matriculados</p>
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
            <p className="text-xs text-muted-foreground mt-1">Corpo docente</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-12">
            <TabsTrigger value="cursos" className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Cursos</span>
            </TabsTrigger>
            <TabsTrigger value="professores" className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Professores</span>
            </TabsTrigger>
            <TabsTrigger value="planejamento" className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Planejamento</span>
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="flex items-center gap-2 text-sm">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Avaliações</span>
            </TabsTrigger>
            <TabsTrigger value="qualidade" className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Qualidade</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cursos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Cursos</CardTitle>
                  <CardDescription>
                    Administre e coordene todos os cursos oferecidos
                  </CardDescription>
                </div>
                <Button onClick={criarNovoCurso} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Curso
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todosCursos.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
                    <p className="text-muted-foreground">Crie seu primeiro curso para começar</p>
                  </div>
                ) : (
                  todosCursos.map((curso) => (
                    <Card key={curso.id} className="hover-scale">
                      <CardContent className="flex justify-between items-center p-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{curso.name}</h3>
                            <Badge variant="outline">
                              {curso.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {curso.description || "Sem descrição disponível"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Duração: {curso.duration || "N/A"}</span>
                            <span>Modalidade: {curso.modality || "Presencial"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => gerenciarCurso(curso)}
                          >
                            Gerenciar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => toast({
                              title: "Info",
                              description: "Editando curso..."
                            })}
                          >
                            Editar
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

        <TabsContent value="professores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Professores</CardTitle>
              <CardDescription>
                Gerencie designações e acompanhe o corpo docente
              </CardDescription>
              <div className="flex gap-4">
                <Input
                  placeholder="Buscar professor..."
                  value={searchProfessor}
                  onChange={(e) => setSearchProfessor(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProfessores.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum professor encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchProfessor ? `Nenhum professor encontrado para "${searchProfessor}"` : "Não há professores cadastrados"}
                    </p>
                  </div>
                ) : (
                  filteredProfessores.map((professor) => (
                    <Card key={professor.id} className="hover-scale">
                      <CardContent className="flex justify-between items-center p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{professor.full_name}</h3>
                            <Badge variant="default">Ativo</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{professor.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Especialidade: {professor.especialidade}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => designarProfessor(professor)}
                          >
                            Designar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => toast({
                              title: "Info",
                              description: `Avaliando professor: ${professor.full_name}`
                            })}
                          >
                            Avaliar
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

        <TabsContent value="planejamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planejamento Acadêmico</CardTitle>
              <CardDescription>
                Aprove e acompanhe planejamentos de turmas e disciplinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todasTurmas.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum planejamento pendente</h3>
                    <p className="text-muted-foreground">Todos os planejamentos estão aprovados</p>
                  </div>
                ) : (
                  todasTurmas.map((turma) => (
                    <Card key={turma.id} className="hover-scale">
                      <CardContent className="flex justify-between items-center p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{turma.name}</h3>
                            <Badge variant="outline">Pendente Aprovação</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Professor: {turma.professor?.full_name || "Não designado"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Curso: {turma.subjects?.courses?.name || turma.subjects?.name}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toast({
                              title: "Info",
                              description: `Visualizando planejamento: ${turma.name}`
                            })}
                          >
                            Visualizar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => aprovarPlanejamento(turma)}
                          >
                            Aprovar
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

        <TabsContent value="avaliacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Avaliações</CardTitle>
              <CardDescription>
                Crie e gerencie avaliações estilo Google Forms para todas as turmas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sistema Completo de Avaliações</h3>
                <p className="text-muted-foreground mb-6">
                  Acesse o sistema completo para criar provas com múltipla escolha, verdadeiro/falso e dissertativas
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
                        <h4 className="font-semibold">Múltipla Escolha</h4>
                        <p className="text-sm text-muted-foreground">Questões com opções A, B, C, D</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <h4 className="font-semibold">Verdadeiro/Falso</h4>
                        <p className="text-sm text-muted-foreground">Questões objetivas V ou F</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <h4 className="font-semibold">Dissertativas</h4>
                        <p className="text-sm text-muted-foreground">Respostas abertas e textuais</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Qualidade</CardTitle>
              <CardDescription>
                Monitore indicadores de qualidade do ensino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Indicadores de Qualidade</h3>
                <p className="text-muted-foreground mb-4">
                  Acompanhe métricas de qualidade e satisfação
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-center">85%</div>
                      <p className="text-center text-sm text-muted-foreground">Satisfação dos Alunos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-center">92%</div>
                      <p className="text-center text-sm text-muted-foreground">Taxa de Conclusão</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-center">4.2</div>
                      <p className="text-center text-sm text-muted-foreground">Avaliação Média</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Coordenação</CardTitle>
              <CardDescription>
                Acesse relatórios específicos para coordenação acadêmica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Relatórios Gerenciais</h3>
                <p className="text-muted-foreground mb-4">
                  Relatórios detalhados para tomada de decisões
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Relatório de Cursos
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Desempenho de Professores
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Análise Acadêmica
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}