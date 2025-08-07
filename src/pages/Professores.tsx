import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, GraduationCap, BookOpen, Users, Award, Edit, Trash2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { supabase } from "@/integrations/supabase/client";
import { NovoProfessorForm } from "@/components/forms/NovoProfessorForm";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Professor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  especializacao: string;
  formacao: string;
  disciplinas: string[];
  status: "ativo" | "inativo";
  foto?: string;
}

const mockProfessores: Professor[] = [
  {
    id: "1",
    nome: "Dr. João Silva",
    email: "joao.silva@mieadi.com.br",
    telefone: "(99) 99999-9999",
    especializacao: "Teologia Sistemática",
    formacao: "Doutor em Teologia",
    disciplinas: ["Teologia Sistemática I", "Teologia Sistemática II"],
    status: "ativo"
  },
  {
    id: "2",
    nome: "Pr. Maria Santos",
    email: "maria.santos@mieadi.com.br",
    telefone: "(99) 88888-8888",
    especializacao: "Hermenêutica Bíblica",
    formacao: "Mestre em Teologia",
    disciplinas: ["Hermenêutica Bíblica", "Exegese do Novo Testamento"],
    status: "ativo"
  },
  {
    id: "3",
    nome: "Dr. Carlos Oliveira",
    email: "carlos.oliveira@mieadi.com.br",
    telefone: "(99) 77777-7777",
    especializacao: "História Eclesiástica",
    formacao: "Doutor em História",
    disciplinas: ["História da Igreja", "Patrística"],
    status: "inativo"
  }
];

export function Professores() {
  const [professores, setProfessores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNovoProfessorForm, setShowNovoProfessorForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfessores();
  }, []);

  const loadProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subjects:subjects!professor_id (
            id,
            name
          )
        `)
        .eq('role', 'professor')
        .order('full_name');

      if (error) throw error;
      setProfessores(data || []);
    } catch (error) {
      console.error('Error loading professors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessores = professores.filter(professor =>
    professor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProfessores = professores.length;
  const professoresAtivos = professores.filter(p => p.status === "ativo").length;
  const professoresComDisciplinas = professores.filter(p => (p as any).subjects?.length > 0).length;

  const getStatusBadgeVariant = (status: string) => {
    return status === "ativo" ? "default" : "secondary";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleEditProfessor = (professor: any) => {
    setSelectedProfessor(professor);
    setShowEditForm(true);
  };

  const handleDeleteProfessor = async () => {
    if (!selectedProfessor) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedProfessor.id);

      if (error) throw error;

      await loadProfessores();
      setShowDeleteDialog(false);
      setSelectedProfessor(null);
      
      toast({
        title: "Professor excluído!",
        description: `${selectedProfessor.full_name} foi removido do sistema.`,
      });
    } catch (error) {
      console.error('Error deleting professor:', error);
      toast({
        title: "Erro ao excluir professor",
        description: "Ocorreu um erro ao excluir o professor.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Professores</h1>
          <p className="text-muted-foreground">Gerencie o corpo docente da instituição</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowNovoProfessorForm(true)}
        >
          <Plus className="w-4 h-4" />
          Novo Professor
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total de Professores"
          value={totalProfessores.toString()}
          icon={GraduationCap}
          trend={{ value: 10, isPositive: true }}
        />
        <DashboardCard
          title="Professores Ativos"
          value={professoresAtivos.toString()}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <DashboardCard
          title="Com Disciplinas"
          value={professoresComDisciplinas.toString()}
          icon={BookOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard
          title="Experiência Média"
          value="5 anos"
          icon={Award}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Professores</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar professores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Professor</th>
                  <th className="text-left p-4 font-medium">Contato</th>
                  <th className="text-left p-4 font-medium">Formação</th>
                  <th className="text-left p-4 font-medium">Especialização</th>
                  <th className="text-left p-4 font-medium">Disciplinas</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfessores.map((professor) => (
                  <tr key={professor.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={professor.avatar_url} alt={professor.full_name} />
                          <AvatarFallback>{getInitials(professor.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{professor.full_name}</div>
                          <div className="text-sm text-muted-foreground">{professor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{professor.phone || "Não informado"}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{professor.bio ? professor.bio.split('\n')[1]?.replace('Formação: ', '') || "Não informado" : "Não informado"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{professor.bio ? professor.bio.split('\n')[0]?.replace('Especialização: ', '') || "Não informado" : "Não informado"}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {(professor as any).subjects?.length || 0} disciplina(s)
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusBadgeVariant(professor.status)}>
                        {professor.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProfessor(professor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProfessor(professor);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProfessores.length === 0 && (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum professor encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando um novo professor."}
              </p>
              {!searchTerm && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Professor
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <NovoProfessorForm
        isOpen={showNovoProfessorForm}
        onClose={() => setShowNovoProfessorForm(false)}
        onSuccess={loadProfessores}
      />

      {/* Formulário de Edição */}
      {selectedProfessor && showEditForm && (
        <NovoProfessorForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedProfessor(null);
          }}
          onSuccess={() => {
            loadProfessores();
            setShowEditForm(false);
            setSelectedProfessor(null);
          }}
          initialData={selectedProfessor}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o professor {selectedProfessor?.full_name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProfessor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}