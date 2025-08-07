
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubjects, useProfessors } from "@/hooks/useSubjects";
import { classSubjectsService } from "@/services/class-subjects.service";

interface CreateTurmaDialogProps {
  onSuccess: () => void;
}

export function CreateTurmaDialog({ onSuccess }: CreateTurmaDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { data: subjects = [] } = useSubjects();
  const { data: professors = [] } = useProfessors();
  
  const [formData, setFormData] = useState({
    name: "",
    professor_id: "",
    schedule: "",
    status: "ativa" as const
  });
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const handleCreate = async () => {
    if (loading) return; // Prevenir múltiplas execuções
    
    console.log('Iniciando criação de turma...', formData, selectedSubjects);
    
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
      console.log('Dados da turma a serem inseridos:', {
        name: formData.name,
        professor_id: formData.professor_id,
        schedule: formData.schedule,
        status: formData.status
      });

      // Criar a turma primeiro
      const { data: turma, error: turmaError } = await supabase
        .from('classes')
        .insert([{
          name: formData.name,
          professor_id: formData.professor_id,
          schedule: formData.schedule,
          status: formData.status
        }])
        .select()
        .single();

      console.log('Resposta da criação da turma:', { turma, turmaError });

      if (turmaError) {
        console.error('Erro ao criar turma:', turmaError);
        throw turmaError;
      }

      // Adicionar as disciplinas à turma
      if (turma) {
        console.log('Adicionando disciplinas à turma:', turma.id, selectedSubjects);
        await classSubjectsService.adicionarMultiplasDisciplinas(turma.id, selectedSubjects);
        console.log('Disciplinas adicionadas com sucesso');
      }

      toast.success("Turma criada com sucesso!");
      setShowDialog(false);
      setFormData({ 
        name: "", 
        professor_id: "", 
        schedule: "", 
        status: "ativa" 
      });
      setSelectedSubjects([]);
      onSuccess();
      
    } catch (error: any) {
      console.error('Error creating turma:', error);
      toast.error(`Erro ao criar turma: ${error.message || error}`);
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

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Turma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Turma</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova turma. Selecione as disciplinas e o professor responsável.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Turma</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome da turma"
            />
          </div>
          <div>
            <Label>Disciplinas * (selecione uma ou mais)</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
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
              <p className="text-sm text-muted-foreground mt-2">
                {selectedSubjects.length} disciplina(s) selecionada(s)
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="professor">Professor *</Label>
            <Select value={formData.professor_id} onValueChange={(value) => setFormData({ ...formData, professor_id: value })}>
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
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
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
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Turma"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
