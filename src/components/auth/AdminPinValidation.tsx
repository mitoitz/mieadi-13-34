import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminPinValidationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operationType: 'create' | 'edit' | 'delete';
  operationDescription: string;
}

export function AdminPinValidation({ 
  isOpen, 
  onClose, 
  onSuccess, 
  operationType, 
  operationDescription 
}: AdminPinValidationProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { toast } = useToast();

  const getOperationIcon = () => {
    switch (operationType) {
      case 'create': return '➕';
      case 'edit': return '✏️';
      case 'delete': return '🗑️';
      default: return '🔒';
    }
  };

  const getOperationColor = () => {
    switch (operationType) {
      case 'create': return 'text-green-600';
      case 'edit': return 'text-blue-600';
      case 'delete': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    
    // Auto-submit when 4 digits are entered
    if (numericValue.length === 4) {
      setTimeout(() => handleValidation(numericValue), 100);
    }
  };

  const handleValidation = async (pinValue?: string) => {
    const submitPin = pinValue || pin;
    if (submitPin.length !== 4) return;

    setIsLoading(true);
    
    try {
      // Verificar se existe um usuário com permissão e PIN correto
      const { data: adminUsers, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, pin, cpf')
        .or('role.eq.admin,role.eq.coordenador,role.eq.secretario,role.eq.professor')
        .not('pin', 'is', null);

      console.log('Admin users found:', adminUsers, 'Error:', error);

      if (error || !adminUsers || adminUsers.length === 0) {
        throw new Error("Nenhum usuário autorizado com PIN configurado encontrado");
      }

      // Verificar PIN contra usuários autorizados
      let isValidPin = false;
      let authorizedBy = '';

      for (const user of adminUsers) {
        try {
          const { data: verificationResult, error: verifyError } = await supabase.rpc('verify_user_pin', {
            cpf_input: user.cpf,
            pin_input: submitPin
          });

          if (!verifyError && verificationResult) {
            isValidPin = true;
            authorizedBy = user.full_name || 'Usuário Autorizado';
            break;
          }
        } catch (verifyError) {
          console.log(`PIN verification failed for user ${user.id}:`, verifyError);
          continue;
        }
      }

      console.log('PIN validation result:', isValidPin, 'Authorized by:', authorizedBy);

      if (isValidPin) {
        // PIN correto - autorizar operação
        toast({
          title: "✅ Operação autorizada!",
          description: `Autorizada por ${authorizedBy}`,
        });
        
        onSuccess();
        handleClose();
      } else {
        throw new Error("PIN incorreto ou usuário não autorizado");
      }
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      let errorMessage = "PIN incorreto";
      if (newAttempts >= 3) {
        errorMessage = "Muitas tentativas. Operação bloqueada.";
        setTimeout(() => handleClose(), 2000);
      } else {
        errorMessage = `PIN incorreto. ${3 - newAttempts} tentativa(s) restante(s)`;
      }
      
      toast({
        title: "Autorização negada",
        description: errorMessage,
        variant: "destructive"
      });
      
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setAttempts(0);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleValidation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl">Autorização Necessária</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {attempts >= 3 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Muitas tentativas incorretas. Operação bloqueada por segurança.
              </AlertDescription>
            </Alert>
          )}

          {/* Descrição da operação */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getOperationIcon()}</span>
              <div>
                <h3 className={`font-semibold ${getOperationColor()}`}>
                  Operação: {operationType === 'create' ? 'Criar' : operationType === 'edit' ? 'Editar' : 'Excluir'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {operationDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Campo PIN */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-center block font-medium">
                PIN de Diretor/Coordenador/Secretário
              </Label>
              <Input
                id="pin"
                type="text"
                placeholder="• • • •"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={4}
                disabled={isLoading || attempts >= 3}
                className="text-center text-2xl tracking-widest font-mono h-14"
                autoFocus
              />
            </div>

            {/* Indicadores visuais do PIN */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > index
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-muted-foreground'
                  }`}
                />
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  Validando autorização...
                </div>
              ) : (
                "Digite o PIN de 4 números para autorizar a operação"
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={() => handleValidation()}
              disabled={pin.length !== 4 || isLoading || attempts >= 3}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validando...
                </div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Autorizar
                </>
              )}
            </Button>
          </div>

          {/* Informações de segurança */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Segurança:</p>
                <ul className="space-y-1">
                  <li>• Apenas diretores, coordenadores e secretários podem autorizar</li>
                  <li>• Cada operação crítica requer autorização individual</li>
                  <li>• Todas as autorizações são registradas no sistema</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}