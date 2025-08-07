import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, BookOpen, Clock, Users, GraduationCap, Settings } from "lucide-react";
import { toast } from "sonner";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from "@/hooks/useCourses";
import { CourseSubjectsManager } from "@/components/courses/CourseSubjectsManager";

export function Cursos() {
  const { data: cursos = [], isLoading, refetch, error } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  
  const [filtro, setFiltro] = useState("");
  const [novoCurso, setNovoCurso] = useState<any>({});
  const [editandoCurso, setEditandoCurso] = useState<any>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [subjectsManagerOpen, setSubjectsManagerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Removido o console.log que estava causando loop infinito
  
  if (isLoading) {
    console.log('⏳ Página Cursos - Carregando...');
  }


  const cursosFiltrados = cursos.filter(curso =>
    curso.name.toLowerCase().includes(filtro.toLowerCase()) ||
    (curso.description && curso.description.toLowerCase().includes(filtro.toLowerCase()))
  );

  const handleSalvar = async () => {
    if (!novoCurso.name) {
      toast.error("Nome do curso é obrigatório");
      return;
    }

    try {
      if (editandoCurso) {
        await updateCourse.mutateAsync({ id: editandoCurso.id, data: novoCurso });
        toast.success("Curso atualizado com sucesso!");
      } else {
        await createCourse.mutateAsync(novoCurso);
        toast.success("Curso criado com sucesso!");
      }
      
      setNovoCurso({});
      setEditandoCurso(null);
      setDialogAberto(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao salvar o curso");
    }
  };

  const handleEditar = (curso: any) => {
    setEditandoCurso(curso);
    setNovoCurso({
      name: curso.name,
      description: curso.description,
      duration_months: curso.duration_months,
      total_credits: curso.total_credits
    });
    setDialogAberto(true);
  };

  const handleDeletar = async (id: string, nomeCurso: string) => {
    const confirmacao = confirm(`Tem certeza que deseja deletar o curso "${nomeCurso}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmacao) return;

    try {
      await deleteCourse.mutateAsync(id);
      toast.success(`Curso "${nomeCurso}" foi deletado com sucesso!`);
    } catch (error: any) {
      console.error('❌ Erro ao deletar curso:', error);
      
      let errorMessage = "Erro ao deletar o curso";
      
      if (error.message?.includes('permission denied')) {
        errorMessage = "Você não tem permissão para deletar este curso";
      } else if (error.message?.includes('violates foreign key')) {
        errorMessage = "Não é possível deletar este curso pois existem registros relacionados a ele";
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleNovoCurso = () => {
    setEditandoCurso(null);
    setNovoCurso({});
    setDialogAberto(true);
  };

  const handleManageSubjects = (course: any) => {
    setSelectedCourse(course);
    setSubjectsManagerOpen(true);
  };

  if (isLoading) {
    console.log('⏳ Página Cursos - Carregando...');
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando cursos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Página Cursos - Erro:', error);
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">Erro ao carregar cursos: {error.message}</p>
            <button onClick={() => refetch()} className="text-primary hover:underline">
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalCreditos = cursos.reduce((sum, c) => sum + (c.total_credits || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">Gerencie os cursos do MIEADI</p>
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleNovoCurso}>
              <Plus className="h-4 w-4" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editandoCurso ? 'Editar Curso' : 'Cadastrar Novo Curso'}
              </DialogTitle>
              <DialogDescription>
                {editandoCurso ? 'Atualize as informações do curso.' : 'Preencha os dados para criar um novo curso.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nome">Nome do Curso *</Label>
                <Input
                  id="nome"
                  value={novoCurso.name || ""}
                  onChange={(e) => setNovoCurso({...novoCurso, name: e.target.value})}
                  placeholder="Ex: Bacharel em Teologia"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (meses)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={novoCurso.duration_months || ""}
                  onChange={(e) => setNovoCurso({...novoCurso, duration_months: Number(e.target.value)})}
                  placeholder="24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="creditos">Total de Créditos</Label>
                <Input
                  id="creditos"
                  type="number"
                  value={novoCurso.total_credits || ""}
                  onChange={(e) => setNovoCurso({...novoCurso, total_credits: Number(e.target.value)})}
                  placeholder="180"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={novoCurso.description || ""}
                  onChange={(e) => setNovoCurso({...novoCurso, description: e.target.value})}
                  placeholder="Descrição do curso"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar}>
                {editandoCurso ? 'Atualizar' : 'Salvar'} Curso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{cursos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Créditos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCreditos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duração Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {cursos.length > 0 ? Math.round(cursos.reduce((acc, c) => acc + (c.duration_months || 0), 0) / cursos.length) : 0} meses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cursos */}
      <div className="grid gap-4">
        {cursosFiltrados.map((curso) => (
          <Card key={curso.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{curso.name}</h3>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{curso.duration_months || 0} meses</p>
                        <p className="text-muted-foreground">duração</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{curso.total_credits || 0} créditos</p>
                        <p className="text-muted-foreground">carga total</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Presencial</p>
                        <p className="text-muted-foreground">modalidade</p>
                      </div>
                    </div>
                  </div>
                  
                  {curso.description && (
                    <p className="text-sm text-muted-foreground">
                      {curso.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManageSubjects(curso)}
                    title="Gerenciar Disciplinas"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditar(curso)}
                    title="Editar Curso"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeletar(curso.id, curso.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Deletar Curso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cursosFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum curso encontrado.</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para gerenciar disciplinas do curso */}
      <Dialog open={subjectsManagerOpen} onOpenChange={setSubjectsManagerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Disciplinas do Curso</DialogTitle>
            <DialogDescription>
              Adicione, remova e organize as disciplinas que fazem parte deste curso.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourse && (
            <CourseSubjectsManager 
              courseId={selectedCourse.id} 
              courseName={selectedCourse.name}
            />
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setSubjectsManagerOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}