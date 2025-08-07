import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BookOpen, Users, GraduationCap, ChevronRight, Edit, Trash2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { supabase } from "@/integrations/supabase/client";
import { NovaDisciplinaForm } from "@/components/forms/NovaDisciplinaForm";
import { useToast } from "@/hooks/use-toast";
import { subjectsService, type Subject } from "@/services/subjects.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNovaDisciplinaForm, setShowNovaDisciplinaForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDisciplina, setSelectedDisciplina] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDisciplinas();
  }, []);

  const loadDisciplinas = async () => {
    try {
      const data = await subjectsService.listar();
      setDisciplinas(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar disciplinas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditDisciplina = (disciplina: Subject) => {
    setSelectedDisciplina(disciplina);
    setShowEditForm(true);
  };

  const handleDeleteDisciplina = async () => {
    if (!selectedDisciplina) return;

    try {
      await subjectsService.deletar(selectedDisciplina.id);
      await loadDisciplinas();
      setShowDeleteDialog(false);
      setSelectedDisciplina(null);
      
      toast({
        title: "Disciplina excluída!",
        description: `${selectedDisciplina.name} foi removida do sistema.`,
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Erro ao excluir disciplina",
        description: "Ocorreu um erro ao excluir a disciplina.",
        variant: "destructive",
      });
    }
  };

  const filteredDisciplinas = disciplinas.filter(disciplina =>
    disciplina.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disciplina.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (disciplina as any).courses?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDisciplinas = disciplinas.length;
  const disciplinasAtivas = disciplinas.length; // Todas são ativas por padrão
  const totalCreditos = disciplinas.reduce((sum, d) => sum + (d.credits || 0), 0);

  const getStatusBadgeVariant = (status: string) => {
    return status === "ativa" ? "default" : "secondary";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando disciplinas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Disciplinas</h1>
          <p className="text-muted-foreground">Gerencie as disciplinas e matérias dos cursos</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowNovaDisciplinaForm(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Disciplina
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total de Disciplinas"
          value={totalDisciplinas.toString()}
          icon={BookOpen}
          trend={{ value: 12, isPositive: true }}
        />
        <DashboardCard
          title="Disciplinas Ativas"
          value={disciplinasAtivas.toString()}
          icon={BookOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard
          title="Créditos Totais"
          value={totalCreditos.toString()}
          icon={GraduationCap}
          trend={{ value: 15, isPositive: true }}
        />
        <DashboardCard
          title="Professores"
          value={disciplinas.filter(d => d.professor_id).length.toString()}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Disciplinas</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar disciplinas..."
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
                  <th className="text-left p-4 font-medium">Disciplina</th>
                  <th className="text-left p-4 font-medium">Curso</th>
                  <th className="text-left p-4 font-medium">Créditos</th>
                  <th className="text-left p-4 font-medium">Professor</th>
                  <th className="text-left p-4 font-medium">Alunos</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisciplinas.map((disciplina) => (
                  <tr key={disciplina.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{disciplina.name}</div>
                          <div className="text-sm text-muted-foreground">{disciplina.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{(disciplina as any).courses?.name || "Curso não informado"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{disciplina.credits || 0} créditos</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{(disciplina as any).profiles?.full_name || "Não atribuído"}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">0 alunos</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusBadgeVariant("ativa")}>
                        Ativa
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditDisciplina(disciplina)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedDisciplina(disciplina);
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

          {filteredDisciplinas.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma disciplina encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando uma nova disciplina."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowNovaDisciplinaForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Disciplina
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <NovaDisciplinaForm
        isOpen={showNovaDisciplinaForm}
        onClose={() => setShowNovaDisciplinaForm(false)}
        onSuccess={loadDisciplinas}
      />

      {/* Formulário de Edição */}
      {selectedDisciplina && showEditForm && (
        <NovaDisciplinaForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedDisciplina(null);
          }}
          onSuccess={() => {
            loadDisciplinas();
            setShowEditForm(false);
            setSelectedDisciplina(null);
          }}
          initialData={selectedDisciplina}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a disciplina {selectedDisciplina?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDisciplina}
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