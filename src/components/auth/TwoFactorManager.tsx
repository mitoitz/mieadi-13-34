import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Unlock, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorManagerProps {
  userId: string;
  currentTwoFactorEnabled: boolean;
  onUpdate: (enabled: boolean) => void;
}

export function TwoFactorManager({ userId, currentTwoFactorEnabled, onUpdate }: TwoFactorManagerProps) {
  const [isEnabled, setIsEnabled] = useState(currentTwoFactorEnabled);
  const [showSetup, setShowSetup] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetupPin = async () => {
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
        setIsEnabled(true);
        setShowSetup(false);
        setPin("");
        setConfirmPin("");
        onUpdate(true);
        
        toast({
          title: "2FA configurado!",
          description: "Seu PIN de segurança foi configurado com sucesso.",
        });
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

  const handleDisable2FA = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pin: null
        })
        .eq('id', userId);

      if (error) throw error;

      setIsEnabled(false);
      setShowSetup(false);
      onUpdate(false);
      
      toast({
        title: "2FA desabilitado",
        description: "A autenticação de dois fatores foi desabilitada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desabilitar 2FA",
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Autenticação de 2 Fatores
          </div>
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Ativo" : "Inativo"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isEnabled ? (
          <div className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, 
                exigindo um PIN de 4 números além da sua senha.
              </AlertDescription>
            </Alert>

            {!showSetup ? (
              <Button 
                onClick={() => setShowSetup(true)}
                className="w-full bg-gradient-to-r from-primary to-accent text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                Ativar Autenticação de 2 Fatores
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setupPin">PIN de Segurança (4 números)</Label>
                  <Input
                    id="setupPin"
                    type="text"
                    placeholder="0000"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value, 'pin')}
                    maxLength={4}
                    className="text-center text-lg tracking-wider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmSetupPin">Confirmar PIN</Label>
                  <Input
                    id="confirmSetupPin"
                    type="text"
                    placeholder="0000"
                    value={confirmPin}
                    onChange={(e) => handlePinChange(e.target.value, 'confirm')}
                    maxLength={4}
                    className="text-center text-lg tracking-wider"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSetup(false);
                      setPin("");
                      setConfirmPin("");
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSetupPin}
                    disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
                    className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
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
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Sua conta está protegida com autenticação de dois fatores. 
                Um PIN será solicitado sempre que você fizer login.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setShowSetup(true)}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Redefinir PIN
              </Button>
              
              <Button 
                onClick={handleDisable2FA}
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Desabilitando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Unlock className="h-4 w-4" />
                    Desabilitar 2FA
                  </div>
                )}
              </Button>
            </div>

            {showSetup && (
              <div className="border-t pt-4 space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Redefinir o PIN irá sobrescrever o PIN atual.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="newPin">Novo PIN (4 números)</Label>
                  <Input
                    id="newPin"
                    type="text"
                    placeholder="0000"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value, 'pin')}
                    maxLength={4}
                    className="text-center text-lg tracking-wider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPin">Confirmar Novo PIN</Label>
                  <Input
                    id="confirmNewPin"
                    type="text"
                    placeholder="0000"
                    value={confirmPin}
                    onChange={(e) => handlePinChange(e.target.value, 'confirm')}
                    maxLength={4}
                    className="text-center text-lg tracking-wider"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSetup(false);
                      setPin("");
                      setConfirmPin("");
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSetupPin}
                    disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
                    className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Redefinindo...
                      </div>
                    ) : (
                      "Redefinir PIN"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}