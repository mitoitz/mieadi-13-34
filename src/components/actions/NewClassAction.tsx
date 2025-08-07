import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";

interface NewClassActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewClassAction({ isOpen, onClose, onSuccess }: NewClassActionProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    subject: "",
    professor: "",
    schedule: "",
    capacity: "",
    description: "",
    status: "ativa"
  });
  const { toast } = useToast();

  // Dados mockados para o formulário
  const courses = [
    { id: "1", name: "Teologia Básica" },
    { id: "2", name: "Educação Cristã" },
    { id: "3", name: "Liderança" },
    { id: "4", name: "Missões" }
  ];

  const subjects = [
    { id: "1", name: "Antigo Testamento" },
    { id: "2", name: "Novo Testamento" },
    { id: "3", name: "Hermenêutica" },
    { id: "4", name: "Pedagogia Cristã" },
    { id: "5", name: "Homilética" }
  ];

  const professors = [
    { id: "1", full_name: "Prof. João Silva" },
    { id: "2", full_name: "Prof. Maria Santos" },
    { id: "3", full_name: "Prof. Pedro Costa" },
    { id: "4", full_name: "Prof. Ana Oliveira" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular salvamento - substituir por chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Turma criada com sucesso!",
        description: `A turma "${formData.name}" foi cadastrada no sistema.`,
      });

      // Reset form
      setFormData({
        name: "",
        course: "",
        subject: "",
        professor: "",
        schedule: "",
        capacity: "",
        description: "",
        status: "ativa"
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar turma. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nova Turma
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Turma *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Turma A - Manhã"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Select value={formData.course} onValueChange={(value) => setFormData({...formData, course: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Disciplina</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({...formData, subject: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="professor">Professor</Label>
              <Select value={formData.professor} onValueChange={(value) => setFormData({...formData, professor: value})}>
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
            
            <div className="space-y-2">
              <Label htmlFor="schedule">Horário</Label>
              <Input
                id="schedule"
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                placeholder="Ex: Terça e Quinta 19:00-21:00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                placeholder="Ex: 30"
                min="1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descrição da turma..."
              rows={3}
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
                "Criar Turma"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}