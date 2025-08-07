import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreateAssessmentActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateAssessmentAction({ isOpen, onClose, onSuccess }: CreateAssessmentActionProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    class_id: "",
    assessment_type: "",
    total_points: "",
    due_date: "",
    instructions: "",
    status: "ativa"
  });
  const { toast } = useToast();

  // Carregar dados reais do banco
  const [classes, setClasses] = useState<Array<{id: string, name: string, subject: string}>>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          subjects (name)
        `)
        .eq('status', 'ativa');

      if (error) throw error;

      const formattedClasses = (data || []).map(cls => ({
        id: cls.id,
        name: cls.name,
        subject: (cls as any).subjects?.name || 'Disciplina não definida'
      }));

      setClasses(formattedClasses);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const assessmentTypes = [
    { value: "prova", label: "Prova" },
    { value: "trabalho", label: "Trabalho" },
    { value: "seminario", label: "Seminário" },
    { value: "projeto", label: "Projeto" },
    { value: "exercicio", label: "Exercício" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular salvamento - substituir por chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const className = classes.find(c => c.id === formData.class_id)?.name || "Turma";
      const assessmentType = assessmentTypes.find(t => t.value === formData.assessment_type)?.label || "Avaliação";
      const formattedDate = new Date(formData.due_date).toLocaleDateString('pt-BR');

      toast({
        title: "Avaliação criada com sucesso!",
        description: `${assessmentType} "${formData.title}" criada para ${className} com prazo até ${formattedDate}.`,
      });

      // Reset form
      setFormData({
        title: "",
        class_id: "",
        assessment_type: "",
        total_points: "",
        due_date: "",
        instructions: "",
        status: "ativa"
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao criar avaliação:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para obter data e hora atual no formato YYYY-MM-DDTHH:MM
  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Avaliação
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Avaliação *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Prova P1 - Antigo Testamento"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class_id">Turma *</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({...formData, class_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assessment_type">Tipo de Avaliação *</Label>
              <Select value={formData.assessment_type} onValueChange={(value) => setFormData({...formData, assessment_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="total_points">Pontuação Total *</Label>
              <Input
                id="total_points"
                type="number"
                value={formData.total_points}
                onChange={(e) => setFormData({...formData, total_points: e.target.value})}
                placeholder="Ex: 100"
                min="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date">Data e Hora de Entrega *</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                min={getMinDateTime()}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              placeholder="Instruções detalhadas para os alunos sobre a avaliação..."
              rows={4}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.class_id || !formData.assessment_type || !formData.total_points || !formData.due_date} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Avaliação"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}