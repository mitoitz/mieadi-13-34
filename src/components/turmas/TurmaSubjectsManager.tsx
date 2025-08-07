import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Edit, Trash2, Save, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useSubjects, useProfessors } from "@/hooks/useSubjects";
import { classSubjectsService } from "@/services/class-subjects.service";
import { turmasService } from "@/services/turmas.service";

interface TurmaSubjectsManagerProps {
  turmaId?: string | null;
  onTurmaCreated?: (turmaId: string) => void;
}

export function TurmaSubjectsManager({ turmaId, onTurmaCreated }: TurmaSubjectsManagerProps) {
  const [isEditing, setIsEditing] = useState(!turmaId);
  const [loading, setLoading] = useState(false);
  const [turma, setTurma] = useState<any>(null);
  
  const { data: subjects = [] } = useSubjects();
  const { data: professors = [] } = useProfessors();
  
  const [formData, setFormData] = useState({
    name: "",
    professor_id: "",
    schedule: "",
    status: "ativa" as "ativa" | "inativa" | "concluida",
    start_date: "",
    end_date: "",
    max_students: 30,
    subject_id: null as string | null,
    congregation_id: null as string | null
  });
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [currentSubjects, setCurrentSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (turmaId) {
      loadTurma();
    }
  }, [turmaId]);

  const loadTurma = async () => {
    if (!turmaId) return;
    
    setLoading(true);
    try {
      const data = await turmasService.buscarPorId(turmaId);
      setTurma(data);
      setFormData({
        name: data.name || "",
        professor_id: data.professor_id || "",
        schedule: data.schedule || "",
        status: (data.status as "ativa" | "inativa" | "concluida") || "ativa",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        max_students: data.max_students || 30,
        subject_id: data.subject_id || null,
        congregation_id: data.congregation_id || null
      });
      
      // Carregar disciplinas da turma
      if (data.class_subjects) {
        setCurrentSubjects(data.class_subjects);
        setSelectedSubjects(data.class_subjects.map((cs: any) => cs.subject_id));
      }
    } catch (error) {
      console.error('Error loading turma:', error);
      toast.error("Erro ao carregar dados da turma");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.professor_id) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (selectedSubjects.length === 0) {
      toast.error("Selecione pelo menos uma disciplina para a turma");
      return;
    }

    setLoading(true);
    try {
      let turmaData;
      
      if (turmaId) {
        // Atualizar turma existente
        turmaData = await turmasService.atualizar(turmaId, formData);
        
        // Remover disciplinas antigas
        await classSubjectsService.removerTodasDisciplinas(turmaId);
        
        // Adicionar novas disciplinas
        await classSubjectsService.adicionarMultiplasDisciplinas(turmaId, selectedSubjects);
        
        toast.success("Turma atualizada com sucesso!");
      } else {
        // Criar nova turma
        const turmaCreateData = {
          name: formData.name,
          professor_id: formData.professor_id,
          schedule: formData.schedule,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          max_students: formData.max_students,
          subject_id: formData.subject_id,
          congregation_id: formData.congregation_id
        };
        turmaData = await turmasService.criar(turmaCreateData);
        
        // Adicionar disciplinas à nova turma
        await classSubjectsService.adicionarMultiplasDisciplinas(turmaData.id, selectedSubjects);
        
        toast.success("Turma criada com sucesso!");
        onTurmaCreated?.(turmaData.id);
      }
      
      setIsEditing(false);
      await loadTurma();
    } catch (error) {
      console.error('Error saving turma:', error);
      toast.error("Erro ao salvar turma");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!turmaId) return;
    
    try {
      await classSubjectsService.removerDisciplina(turmaId, subjectId);
      toast.success("Disciplina removida da turma");
      await loadTurma();
    } catch (error) {
      console.error('Error removing subject:', error);
      toast.error("Erro ao remover disciplina");
    }
  };

  const handleDelete = async () => {
    if (!turmaId) return;
    
    if (!confirm("Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.")) {
      return;
    }

    setLoading(true);
    try {
      await turmasService.deletar(turmaId);
      toast.success("Turma excluída com sucesso!");
      // Redirecionar ou notificar parent component
    } catch (error) {
      console.error('Error deleting turma:', error);
      toast.error("Erro ao excluir turma");
    } finally {
      setLoading(false);
    }
  };

  if (loading && turmaId) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {turmaId ? (isEditing ? "Editando Turma" : "Detalhes da Turma") : "Nova Turma"}
          </CardTitle>
          <div className="flex gap-2">
            {turmaId && !isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={!turmaId}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-1" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Turma *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome da turma"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Professor *</Label>
              <Select 
                value={formData.professor_id} 
                onValueChange={(value) => setFormData({ ...formData, professor_id: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  {professors.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id}>
                      {professor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="schedule">Horário</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="Ex: Segunda 19:00-21:00"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="max_students">Máximo de Alunos</Label>
              <Input
                id="max_students"
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 30 })}
                disabled={!isEditing}
                min="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disciplinas da Turma</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <Label>Selecione as Disciplinas *</Label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject.id}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={() => handleSubjectToggle(subject.id)}
                    />
                    <Label 
                      htmlFor={subject.id} 
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {subject.code ? `${subject.code} - ${subject.name}` : subject.name}
                      {subject.credits && ` (${subject.credits} créditos)`}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedSubjects.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedSubjects.length} disciplina(s) selecionada(s)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {currentSubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentSubjects.map((classSubject) => (
                    <div key={classSubject.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {classSubject.subjects?.code ? 
                            `${classSubject.subjects.code} - ${classSubject.subjects.name}` : 
                            classSubject.subjects?.name || 'Disciplina não encontrada'
                          }
                        </div>
                        {classSubject.subjects?.credits && (
                          <div className="text-sm text-muted-foreground">
                            {classSubject.subjects.credits} créditos
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {classSubject.is_primary && (
                          <Badge variant="secondary" className="text-xs">Principal</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubject(classSubject.subject_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma disciplina associada à turma.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}