import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, ClipboardCheck, BarChart3, Upload, Plus } from "lucide-react";
import { AlunosList } from "@/components/professor/AlunosList";
import { MaterialUpload } from "@/components/professor/MaterialUpload";
import { AvaliacaoForm } from "@/components/professor/AvaliacaoForm";
import { AvaliacoesList } from "@/components/professor/AvaliacoesList";
import { RelatoriosProfessor } from "@/components/professor/RelatoriosProfessor";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfessorDashboardProps {
  user: {
    id: string;
    name: string;
    userType: string;
  };
}

export function ProfessorDashboard({ user }: ProfessorDashboardProps) {
  const [activeTab, setActiveTab] = useState("turmas");
  const [showAvaliacaoForm, setShowAvaliacaoForm] = useState(false);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTurmas();
  }, [user.id]);

  const loadTurmas = async () => {
    try {
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
          )
        `)
        .eq('professor_id', user.id);

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
    materiaisUploaded: 0, // Will be calculated from materials table
    avaliacoesCreated: 0 // Will be calculated from evaluations table
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel do professor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel do Professor</h1>
          <p className="text-muted-foreground">
            Bem-vindo, Prof. {user.name}
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Professor
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
            <p className="text-xs text-muted-foreground">Turmas ativas</p>
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
            <CardTitle className="text-sm font-medium">Materiais</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.materiaisUploaded}</div>
            <p className="text-xs text-muted-foreground">Arquivos enviados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avaliacoesCreated}</div>
            <p className="text-xs text-muted-foreground">Provas criadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="turmas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Turmas
          </TabsTrigger>
          <TabsTrigger value="materiais" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Materiais
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Avaliações
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="turmas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Turmas e Alunos</CardTitle>
              <CardDescription>
                Gerencie suas turmas e acompanhe o progresso dos alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlunosList turmas={turmas} professorId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materiais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais de Aula</CardTitle>
              <CardDescription>
                Gerencie materiais didáticos para suas turmas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialUpload professorId={user.id} turmas={turmas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacoes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Avaliações</h2>
              <p className="text-muted-foreground">
                Crie e gerencie avaliações para suas turmas
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
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>
                Visualize relatórios de desempenho e frequência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RelatoriosProfessor professorId={user.id} turmas={turmas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Materiais</CardTitle>
              <CardDescription>
                Envie materiais de aula para suas turmas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialUpload professorId={user.id} turmas={turmas} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}