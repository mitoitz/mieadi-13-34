import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TermsPrivacyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  userId: string;
  userName: string;
}

export function TermsPrivacyDialog({ 
  isOpen, 
  onClose, 
  onAccept, 
  userId, 
  userName 
}: TermsPrivacyDialogProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Aceite obrigatório",
        description: "Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('accept_terms_and_privacy', {
        user_id: userId
      });

      if (error) throw error;

      toast({
        title: "Termos aceitos!",
        description: "Você aceitou os termos de uso e política de privacidade.",
      });

      onAccept();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aceitar os termos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="w-[90vw] max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            Termos e Privacidade
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  Olá, <strong>{userName}</strong>!
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Aceite os termos para usar o sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo dos Termos */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Resumo dos Termos
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded text-xs space-y-1">
              <p>• Sistema exclusivo para educação religiosa e gestão ministerial</p>
              <p>• Mantenha suas credenciais seguras</p>
              <p>• Proibido compartilhar conta ou usar inadequadamente</p>
              <p>• Coletamos apenas dados necessários para o funcionamento</p>
              <p>• Não compartilhamos seus dados com terceiros</p>
            </div>
          </div>

          {/* Checkbox para aceitar todos os termos */}
          <div className="pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="all-terms" 
                checked={termsAccepted && privacyAccepted}
                onCheckedChange={(checked) => {
                  const isChecked = checked as boolean;
                  setTermsAccepted(isChecked);
                  setPrivacyAccepted(isChecked);
                }}
              />
              <label 
                htmlFor="all-terms" 
                className="text-xs font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <strong>Li e aceito todos os termos</strong>
              </label>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex flex-col gap-2 pt-4 border-t border-border flex-shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              toast({
                title: "Termos obrigatórios",
                description: "Para entrar no sistema, você deve aceitar os Termos de Uso e a Política de Privacidade.",
                variant: "destructive",
              });
            }}
            className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs py-2"
            disabled={isLoading}
          >
            Recusar
          </Button>
          <Button 
            onClick={handleAccept}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-xs py-2"
            disabled={!termsAccepted || !privacyAccepted || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              "Aceitar e Continuar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}