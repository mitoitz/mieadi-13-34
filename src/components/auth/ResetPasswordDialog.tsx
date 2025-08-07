import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resetPassword, validateCPF, formatCPF } from "@/lib/auth";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordDialog({ isOpen, onClose }: ResetPasswordDialogProps) {
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔄 Iniciando reset de senha via interface...');
    console.log('📋 CPF digitado:', cpf);

    try {
      if (!validateCPF(cpf)) {
        console.log('❌ CPF inválido no frontend:', cpf);
        toast({
          title: "CPF inválido",
          description: "Por favor, digite um CPF válido",
          variant: "destructive",
        });
        return;
      }

      console.log('📡 Chamando função resetPassword...');
      await resetPassword(cpf);
      
      console.log('✅ Reset bem-sucedido!');
      toast({
        title: "Senha resetada com sucesso!",
        description: "A senha foi resetada para 'mudar123'. O usuário precisará alterar no próximo login.",
      });

      onClose();
      setCpf("");
    } catch (error: any) {
      console.error('❌ Erro capturado no frontend do reset:', error);
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.replace(/\D/g, "").length <= 11) {
      setCpf(formatCPF(value));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-accent" />
            Resetar Senha
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Digite o CPF do usuário para resetar a senha para <strong>"mudar123"</strong>. 
              O usuário precisará alterar a senha no próximo login.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetCpf" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                CPF do Usuário
              </Label>
              <Input
                id="resetCpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-accent to-destructive text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetando...
                  </div>
                ) : (
                  "Resetar Senha"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}