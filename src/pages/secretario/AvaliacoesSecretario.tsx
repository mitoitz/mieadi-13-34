import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardCheck, Users, BarChart3, FileText } from "lucide-react";
import { AvaliacaoForm } from "@/components/professor/AvaliacaoForm";
import { AvaliacoesList } from "@/components/professor/AvaliacoesList";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AvaliacoesSecretarioProps {
  user: {
    id: string;
    name: string;
    userType: string;
  };
}

export function AvaliacoesSecretario({ user }: AvaliacoesSecretarioProps) {
  const [activeTab, setActiveTab] = useState("avaliacoes");
  const [showAvaliacaoForm, setShowAvaliacaoForm] = useState(false);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTurmas();
  }, []);

  const loadTurmas = async () => {
    try {
      // Secretário pode ver todas as turmas para fins administrativos
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          subjects (
            name,
            courses (name)
          ),
          students:student_classes(
            student_id,
            profiles!student_classes_student_id_fkey (full_name)
          ),
          professor:profiles!classes_professor_id_fkey (full_name)
        `)
        .order('name');

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error('Error loading turmas:', error);
      toast.error("Erro ao carregar turmas");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalTurmas: turmas.length,
    totalAlunos: turmas.reduce((acc, turma) => acc + turma.students.length, 0),
    avaliacoesAtivas: 0, // Will be calculated from assessments
    avaliacoesTotal: 0 // Will be calculated from assessments
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel de avaliações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Avaliações</h1>
          <p className="text-muted-foreground">
            Apoie a gestão de avaliações e mantenha registros administrativos
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Secretário
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTurmas}</div>
            <p className="text-xs text-muted-foreground">Total de turmas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlunos}</div>
            <p className="text-xs text-muted-foreground">Total de alunos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Ativas</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avaliacoesAtivas}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Avaliações</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avaliacoesTotal}</div>
            <p className="text-xs text-muted-foreground">Criadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Avaliações
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="registros" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Registros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avaliacoes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Avaliações</h2>
              <p className="text-muted-foreground">
                Crie e gerencie avaliações administrativas
              </p>
            </div>
            <Button 
              onClick={() => setShowAvaliacaoForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Avaliação
            </Button>
          </div>

          <AvaliacoesList professorId={user.id} turmas={turmas} />

          {showAvaliacaoForm && (
            <AvaliacaoForm
              isOpen={showAvaliacaoForm}
              onClose={() => setShowAvaliacaoForm(false)}
              professorId={user.id}
              turmas={turmas}
              onSuccess={() => {
                setShowAvaliacaoForm(false);
                toast.success("Avaliação criada com sucesso!");
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Avaliações</CardTitle>
              <CardDescription>
                Visualize estatísticas e relatórios administrativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Relatórios em Desenvolvimento</h3>
                <p className="text-muted-foreground">
                  Em breve você poderá visualizar relatórios detalhados das avaliações.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros Administrativos</CardTitle>
              <CardDescription>
                Gerencie registros e documentação das avaliações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Registros em Desenvolvimento</h3>
                <p className="text-muted-foreground">
                  Em breve você poderá gerenciar registros administrativos das avaliações.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}