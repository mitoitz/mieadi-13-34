import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Unlock, Key, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PinManagerProps {
  userId: string;
  currentPinEnabled?: boolean;
  onPinUpdate?: (enabled: boolean) => void;
}

export function PinManager({ userId, currentPinEnabled = false, onPinUpdate }: PinManagerProps) {
  const [isPinEnabled, setIsPinEnabled] = useState(currentPinEnabled);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePinSetup = async () => {
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
      const { data, error } = await supabase.rpc('setup_user_pin', {
        user_id: userId,
        pin_code: pin
      });

      if (error) throw error;

      setIsPinEnabled(true);
      setIsSettingUp(false);
      setPin("");
      setConfirmPin("");
      onPinUpdate?.(true);
      
      toast({
        title: "✅ PIN configurado!",
        description: "Seu PIN de segurança foi configurado com sucesso.",
      });
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

  const handlePinDisable = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pin: null
        })
        .eq('id', userId);

      if (error) throw error;

      setIsPinEnabled(false);
      setIsSettingUp(false);
      onPinUpdate?.(false);
      
      toast({
        title: "PIN desabilitado",
        description: "O PIN de segurança foi removido da sua conta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desabilitar PIN",
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
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isPinEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            {isPinEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Lock className="h-5 w-5 text-gray-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium">PIN de Segurança</h3>
            <p className="text-sm text-muted-foreground">
              {isPinEnabled 
                ? "PIN ativo para acesso rápido ao sistema" 
                : "Configure um PIN de 4 dígitos para acesso rápido"
              }
            </p>
          </div>
        </div>
        <Badge variant={isPinEnabled ? "default" : "secondary"}>
          {isPinEnabled ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {/* Actions */}
      {!isPinEnabled && !isSettingUp && (
        <div className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              O PIN permite acesso rápido ao sistema sem precisar digitar senha completa. 
              É uma forma segura e conveniente de autenticação.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => setIsSettingUp(true)}
            className="w-full"
          >
            <Key className="h-4 w-4 mr-2" />
            Configurar PIN
          </Button>
        </div>
      )}

      {/* Setup Form */}
      {isSettingUp && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-primary" />
            <h3 className="font-medium">
              {isPinEnabled ? "Alterar PIN" : "Configurar novo PIN"}
            </h3>
          </div>

          {isPinEnabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configurar um novo PIN irá substituir o atual.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN (4 números)</Label>
              <Input
                id="pin"
                type="text"
                placeholder="0000"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value, 'pin')}
                maxLength={4}
                className="text-center text-lg tracking-wider font-mono"
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
                className="text-center text-lg tracking-wider font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSettingUp(false);
                setPin("");
                setConfirmPin("");
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePinSetup}
              disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isPinEnabled ? "Alterando..." : "Configurando..."}
                </div>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {isPinEnabled ? "Alterar PIN" : "Configurar PIN"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Enabled Actions */}
      {isPinEnabled && !isSettingUp && (
        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Seu PIN está ativo. Você pode usá-lo para fazer login rapidamente 
              ou alterar para um novo PIN quando quiser.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button 
              onClick={() => setIsSettingUp(true)}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Alterar PIN
            </Button>
            
            <Button 
              onClick={handlePinDisable}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Removendo...
                </div>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Remover PIN
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-1">
            <Key className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Como usar o PIN?
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use o PIN na tela de login para acesso rápido</li>
              <li>• É mais seguro que ficar logado permanentemente</li>
              <li>• Você ainda pode usar sua senha normal quando quiser</li>
              <li>• O PIN é pessoal e não deve ser compartilhado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}