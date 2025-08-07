import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PinVerifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
}

export function PinVerifyDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  userName 
}: PinVerifyDialogProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  const handleVerifyPin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "PIN inválido",
        description: "Digite um PIN de 4 números.",
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
          title: "PIN correto!",
          description: "Acesso liberado.",
        });
        onSuccess();
      } else {
        setPin("");
        if (result.attempts_remaining !== undefined) {
          setAttempts(3 - result.attempts_remaining);
        }
        
        if (result.locked_until) {
          toast({
            title: "Conta temporariamente bloqueada",
            description: "Muitas tentativas incorretas. Tente novamente mais tarde.",
            variant: "destructive",
          });
          onClose();
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
    const numbers = value.replace(/\D/g, "").slice(0, 4);
    setPin(numbers);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleVerifyPin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Digite seu PIN
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Olá, <strong>{userName}</strong>!
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Digite seu PIN de 4 dígitos para acessar o sistema.
                </p>
              </div>
            </div>
          </div>

          {attempts > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Tentativas restantes: <strong>{3 - attempts}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">
                PIN de Segurança
              </Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={4}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleVerifyPin}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              disabled={isLoading || pin.length !== 4 || attempts >= 3}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </div>
              ) : (
                "Confirmar PIN"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full"
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}