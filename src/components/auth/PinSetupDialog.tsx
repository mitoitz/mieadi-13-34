import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PinSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSkip: () => void;
  userId: string;
  userName: string;
}

export function PinSetupDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  onSkip, 
  userId, 
  userName 
}: PinSetupDialogProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  const handleSetupPin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "PIN inválido",
        description: "O PIN deve conter exatamente 4 números.",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PIN não confere",
        description: "Os PINs digitados não são iguais.",
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
          title: "PIN configurado!",
          description: "Seu PIN de 4 dígitos foi criado com sucesso.",
        });
        onSuccess();
      } else {
        throw new Error(result.error || "Erro ao configurar PIN");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao configurar PIN",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string, isConfirm = false) => {
    const numbers = value.replace(/\D/g, "").slice(0, 4);
    if (isConfirm) {
      setConfirmPin(numbers);
    } else {
      setPin(numbers);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Configurar PIN de Segurança
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Olá, <strong>{userName}</strong>!
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Configure um PIN de 4 dígitos para maior segurança no seu próximo acesso.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">
                Digite seu PIN (4 números)
              </Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  maxLength={4}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPin" className="text-sm font-medium">
                Confirme seu PIN
              </Label>
              <Input
                id="confirmPin"
                type={showPin ? "text" : "password"}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => handlePinChange(e.target.value, true)}
                maxLength={4}
                className="h-12 text-center text-2xl tracking-widest font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleSetupPin}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Configurando...
                </div>
              ) : (
                "Configurar PIN"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSkip}
              className="w-full"
              disabled={isLoading}
            >
              Configurar Depois
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}