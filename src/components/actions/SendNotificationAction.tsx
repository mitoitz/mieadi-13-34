import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Users, Send } from "lucide-react";
import { feedback } from "@/components/ui/feedback";

interface SendNotificationActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendNotificationAction({ isOpen, onClose, onSuccess }: SendNotificationActionProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sendEmail, setSendEmail] = useState(false);
  const [sendSMS, setSendSMS] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      feedback.warning("Digite o título do comunicado");
      return;
    }

    if (!message.trim()) {
      feedback.warning("Digite a mensagem do comunicado");
      return;
    }

    if (!targetAudience) {
      feedback.warning("Selecione o público-alvo");
      return;
    }

    setLoading(true);
    try {
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      feedback.success("Comunicado enviado com sucesso!");
      onSuccess();
    } catch (error) {
      feedback.error("Erro ao enviar comunicado");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setTargetAudience("");
    setPriority("normal");
    setSendEmail(false);
    setSendSMS(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const audienceOptions = [
    { value: "all", label: "Todos os usuários" },
    { value: "students", label: "Alunos" },
    { value: "teachers", label: "Professores" },
    { value: "staff", label: "Funcionários" },
    { value: "pastors", label: "Pastores" }
  ];

  const priorityOptions = [
    { value: "low", label: "Baixa" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "Alta" },
    { value: "urgent", label: "Urgente" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enviar Comunicado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              placeholder="Digite o título do comunicado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mensagem</label>
            <Textarea
              placeholder="Digite a mensagem do comunicado"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Público-alvo</label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o público" />
                </SelectTrigger>
                <SelectContent>
                  {audienceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prioridade</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Canais de Envio</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="app-notification"
                  checked={true}
                  disabled={true}
                />
                <label
                  htmlFor="app-notification"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Notificação no aplicativo (sempre enviado)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked === true)}
                />
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enviar por e-mail
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={sendSMS}
                  onCheckedChange={(checked) => setSendSMS(checked === true)}
                />
                <label
                  htmlFor="sms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enviar por SMS
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Comunicado"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}