import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSetup: () => void;
  userId: string;
  userName: string;
}

export function TwoFactorSetupDialog({ 
  isOpen, 
  onClose, 
  onSkip, 
  onSetup, 
  userId, 
  userName 
}: TwoFactorSetupDialogProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "PIN inválido",
        description: "O PIN deve conter exatamente 4 números",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PINs não coincidem",
        description: "Digite o mesmo PIN nos dois campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('set_two_factor_pin', {
        user_id: userId,
        new_pin: pin
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: "2FA configurado!",
          description: "Seu PIN de segurança foi configurado com sucesso.",
        });
        onSetup();
      } else {
        throw new Error(result.error || "Erro ao configurar 2FA");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao configurar PIN de segurança",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string, field: 'pin' | 'confirm') => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    if (field === 'pin') {
      setPin(numericValue);
    } else {
      setConfirmPin(numericValue);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Configurar Autenticação de 2 Fatores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{userName}</strong>, configure um PIN de 4 números para aumentar a segurança de sua conta. 
              Este PIN será solicitado sempre que você fizer login.
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Por que usar 2FA?
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <li>• Protege sua conta mesmo se alguém souber sua senha</li>
                  <li>• Você pode redefinir o PIN a qualquer momento</li>
                  <li>• É opcional, mas altamente recomendado</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN de Segurança (4 números)</Label>
              <Input
                id="pin"
                type="text"
                placeholder="0000"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value, 'pin')}
                maxLength={4}
                className="text-center text-lg tracking-wider"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirmar PIN</Label>
              <Input
                id="confirmPin"
                type="text"
                placeholder="0000"
                value={confirmPin}
                onChange={(e) => handlePinChange(e.target.value, 'confirm')}
                maxLength={4}
                className="text-center text-lg tracking-wider"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleSetup}
              className="w-full bg-gradient-to-r from-primary to-accent text-white"
              disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Configurando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Configurar PIN
                </div>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSkip}
              disabled={isLoading}
            >
              Pular (configurar depois)
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Você pode configurar ou alterar seu PIN a qualquer momento nas configurações do seu perfil.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}