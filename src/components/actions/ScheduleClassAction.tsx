import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2, Clock } from "lucide-react";

interface ScheduleClassActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ScheduleClassAction({ isOpen, onClose, onSuccess }: ScheduleClassActionProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    class_id: "",
    session_date: "",
    session_time: "",
    topic: "",
    description: "",
    status: "scheduled"
  });
  const { toast } = useToast();

  // Dados mockados para o formulário
  const classes = [
    { id: "1", name: "Turma A - Teologia Básica", subject: "Antigo Testamento" },
    { id: "2", name: "Turma B - Educação Cristã", subject: "Pedagogia Cristã" },
    { id: "3", name: "Turma C - Liderança", subject: "Homilética" },
    { id: "4", name: "Turma D - Missões", subject: "Novo Testamento" }
  ];

  const commonTopics = [
    "Introdução ao livro",
    "Contexto histórico",
    "Análise textual",
    "Aplicação prática",
    "Estudo de caso",
    "Revisão e avaliação",
    "Seminário",
    "Trabalho em grupo",
    "Prova",
    "Apresentação"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular salvamento - substituir por chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const className = classes.find(c => c.id === formData.class_id)?.name || "Turma";
      const formattedDate = new Date(formData.session_date).toLocaleDateString('pt-BR');

      toast({
        title: "Aula agendada com sucesso!",
        description: `Aula "${formData.topic}" agendada para ${className} em ${formattedDate}.`,
      });

      // Reset form
      setFormData({
        class_id: "",
        session_date: "",
        session_time: "",
        topic: "",
        description: "",
        status: "scheduled"
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao agendar aula:", error);
      toast({
        title: "Erro",
        description: "Erro ao agendar aula. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para obter data atual no formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Aula
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="session_date">Data da Aula *</Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                min={getTodayDate()}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session_time">Horário *</Label>
              <Input
                id="session_time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData({...formData, session_time: e.target.value})}
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
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="topic">Tópico da Aula *</Label>
            <Input
              id="topic"
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              placeholder="Ex: Introdução ao livro de Gênesis"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Sugestões de Tópicos</Label>
            <div className="flex flex-wrap gap-2">
              {commonTopics.map((topic) => (
                <Button
                  key={topic}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({...formData, topic})}
                  className="text-xs"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descrição detalhada da aula, objetivos, material necessário..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.class_id || !formData.session_date || !formData.session_time || !formData.topic} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                "Agendar Aula"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}