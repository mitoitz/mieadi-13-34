import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
}

export function TwoFactorVerifyDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  userName 
}: TwoFactorVerifyDialogProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "PIN inválido",
        description: "Digite um PIN de 4 números",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('verify_two_factor_pin', {
        user_id: userId,
        pin_input: pin
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: "PIN verificado!",
          description: "Acesso liberado com sucesso.",
        });
        onSuccess();
      } else {
        setPin("");
        if (result.attempts_remaining !== undefined) {
          setAttemptsLeft(result.attempts_remaining);
        }
        
        if (result.locked_until) {
          toast({
            title: "Conta temporariamente bloqueada",
            description: "Muitas tentativas incorretas. Tente novamente mais tarde.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "PIN incorreto",
            description: result.attempts_remaining > 0 
              ? `${result.attempts_remaining} tentativa(s) restante(s)`
              : "PIN incorreto",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar PIN",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleVerify();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verificação de Segurança
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Olá, <strong>{userName}</strong>! Para acessar o sistema, digite seu PIN de segurança de 4 números.
            </AlertDescription>
          </Alert>

          {attemptsLeft !== null && attemptsLeft < 3 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {attemptsLeft > 0 
                  ? `Atenção: ${attemptsLeft} tentativa(s) restante(s) antes do bloqueio temporário.`
                  : "Conta bloqueada temporariamente por segurança."
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verifyPin">PIN de Segurança</Label>
              <Input
                id="verifyPin"
                type="text"
                placeholder="••••"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={4}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>

            <Button 
              onClick={handleVerify}
              className="w-full bg-gradient-to-r from-primary to-accent text-white"
              disabled={isLoading || pin.length !== 4}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verificar PIN
                </div>
              )}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Esqueceu seu PIN? Entre em contato com o diretor do sistema.
            </p>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancelar e fazer logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}