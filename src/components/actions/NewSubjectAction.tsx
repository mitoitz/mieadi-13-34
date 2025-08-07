import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap } from "lucide-react";
import { useCreateSubject } from "@/hooks/useSubjects";
import { useCourses } from "@/hooks/useCourses";
import { useProfessors } from "@/hooks/useSubjects";

interface NewSubjectActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewSubjectAction({ isOpen, onClose, onSuccess }: NewSubjectActionProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [courseId, setCourseId] = useState("");
  const [professorId, setProfessorId] = useState("");

  const createSubject = useCreateSubject();
  const { data: courses = [] } = useCourses();
  const { data: professors = [] } = useProfessors();

  const handleSubmit = async () => {
    if (!name.trim() || !credits || parseInt(credits) <= 0) return;

    await createSubject.mutateAsync({
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      credits: parseInt(credits),
      course_id: courseId || undefined,
      professor_id: professorId || undefined
    });
    
    resetForm();
    onClose();
    onSuccess();
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setCredits("");
    setCourseId("");
    setProfessorId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Nova Disciplina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome da Disciplina</label>
              <Input
                placeholder="Ex: Teologia Bíblica I"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Código</label>
              <Input
                placeholder="Ex: TEO101"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              placeholder="Descrição da disciplina"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Créditos</label>
              <Input
                type="number"
                placeholder="Ex: 4"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Curso</label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        {course.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Professor (Opcional)</label>
              <Select value={professorId} onValueChange={setProfessorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {professors.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id}>
                      {professor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createSubject.isPending} className="flex-1">
              {createSubject.isPending ? "Criando..." : "Criar Disciplina"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}