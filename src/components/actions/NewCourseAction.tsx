import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap } from "lucide-react";
import { useCreateCourse } from "@/hooks/useCourses";

interface NewCourseActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCourseAction({ isOpen, onClose, onSuccess }: NewCourseActionProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [totalCredits, setTotalCredits] = useState("");
  
  const createCourse = useCreateCourse();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!description.trim()) return;
    if (!durationMonths || parseInt(durationMonths) <= 0) return;
    if (!totalCredits || parseInt(totalCredits) <= 0) return;

    await createCourse.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      duration_months: parseInt(durationMonths),
      total_credits: parseInt(totalCredits)
    });
    
    resetForm();
    onClose();
    onSuccess();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDurationMonths("");
    setTotalCredits("");
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
            <GraduationCap className="h-5 w-5" />
            Novo Curso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Nome do Curso</label>
            <Input
              placeholder="Ex: Bacharel em Teologia"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              placeholder="Descrição detalhada do curso, objetivos e áreas de atuação"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Duração (meses)</label>
              <Input
                type="number"
                placeholder="Ex: 36"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                min="1"
                max="120"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Duração total do curso em meses
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Total de Créditos</label>
              <Input
                type="number"
                placeholder="Ex: 180"
                value={totalCredits}
                onChange={(e) => setTotalCredits(e.target.value)}
                min="1"
                max="500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Soma de créditos de todas as disciplinas
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Informações Calculadas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Duração em anos:</span>
                <span className="ml-2 font-medium">
                  {durationMonths ? Math.round((parseInt(durationMonths) / 12) * 10) / 10 : "0"} anos
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Média de créditos/mês:</span>
                <span className="ml-2 font-medium">
                  {durationMonths && totalCredits 
                    ? Math.round((parseInt(totalCredits) / parseInt(durationMonths)) * 10) / 10 
                    : "0"
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createCourse.isPending} className="flex-1">
              {createCourse.isPending ? "Criando..." : "Criar Curso"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}