import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2 } from "lucide-react";
import { subjectsService } from "@/services/subjects.service";
import { useCourses } from "@/hooks/useCourses";
import { useProfessors } from "@/hooks/useSubjects";

interface NovaDisciplinaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function NovaDisciplinaForm({ isOpen, onClose, onSuccess, initialData }: NovaDisciplinaFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    credits: "",
    course_ids: [] as string[], // Alterado para múltiplos cursos
    professor_id: ""
  });
  
  const { toast } = useToast();
  const { data: courses = [] } = useCourses();
  const { data: professors = [] } = useProfessors();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        description: initialData.description || "",
        credits: initialData.credits?.toString() || "",
        course_ids: [], // Será preenchido via course_subjects
        professor_id: initialData.professor_id || ""
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submitAction = async () => {
      const disciplinaData = {
        name: formData.name,
        code: formData.code || null,
        description: formData.description,
        credits: formData.credits ? parseInt(formData.credits) : undefined,
        professor_id: formData.professor_id || undefined
      };

      // Criar a disciplina primeiro
      const disciplina = initialData 
        ? await subjectsService.atualizar(initialData.id, disciplinaData)
        : await subjectsService.criar(disciplinaData);

      // Se há cursos selecionados e é uma nova disciplina, associar aos cursos
      if (!initialData && formData.course_ids.length > 0) {
        const { courseSubjectsService } = await import("@/services/course-subjects.service");
        
        for (const courseId of formData.course_ids) {
          await courseSubjectsService.adicionarDisciplinaAoCurso({
            course_id: courseId,
            subject_id: disciplina.id,
            order_index: 1,
            is_required: true
          });
        }
      }

      return disciplina;
    };

    try {
      const result = await submitAction();

      toast({
        title: initialData ? "Disciplina atualizada!" : "Disciplina criada!",
        description: `${formData.name} foi ${initialData ? "atualizada" : "criada"} com sucesso.`,
      });

      // Reset form
      setFormData({
        name: "",
        code: "",
        description: "",
        credits: "",
        course_ids: [],
        professor_id: ""
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {initialData ? "Editar Disciplina" : "Nova Disciplina"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Disciplina *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Antigo Testamento"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="Ex: AT001 (Deixe vazio para geração automática)"
              />
              <p className="text-xs text-muted-foreground">
                💡 Se deixar vazio, um código será gerado automaticamente (ex: DISC25001)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credits">Créditos</Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({...formData, credits: e.target.value})}
                placeholder="Ex: 4"
                min="1"
              />
            </div>
            
            
            <div className="space-y-2">
              <Label htmlFor="course_ids">Cursos (Opcional)</Label>
              <Select 
                value="" 
                onValueChange={(value) => {
                  if (value && !formData.course_ids.includes(value)) {
                    setFormData({
                      ...formData, 
                      course_ids: [...formData.course_ids, value]
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .filter(course => !formData.course_ids.includes(course.id))
                    .map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Lista de cursos selecionados */}
              {formData.course_ids.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Cursos selecionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.course_ids.map((courseId) => {
                      const course = courses.find(c => c.id === courseId);
                      return course ? (
                        <Badge
                          key={courseId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {course.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                course_ids: formData.course_ids.filter(id => id !== courseId)
                              });
                            }}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                💡 Uma disciplina pode ser usada em múltiplos cursos. Você pode adicionar aos cursos agora ou depois na página de cursos.
              </p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="professor_id">Professor</Label>
              <Select value={formData.professor_id} onValueChange={(value) => setFormData({...formData, professor_id: value})}>
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descrição da disciplina, objetivos, conteúdo programático..."
              rows={4}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                initialData ? "Atualizar Disciplina" : "Criar Disciplina"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}