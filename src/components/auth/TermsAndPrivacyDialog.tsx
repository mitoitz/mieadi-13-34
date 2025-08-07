import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TermsAndPrivacyDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  userId: string;
  userName: string;
}

export function TermsAndPrivacyDialog({ 
  isOpen, 
  onAccept, 
  userId, 
  userName 
}: TermsAndPrivacyDialogProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Aceitação obrigatória",
        description: "Você deve aceitar os termos de uso e política de privacidade para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('accept_terms_and_privacy', {
        user_id: userId
      });

      if (error) {
        throw error;
      }

      const result = data as any;
      if (result.success) {
        toast({
          title: "Termos aceitos",
          description: "Termos de uso e política de privacidade aceitos com sucesso",
        });
        onAccept();
      } else {
        throw new Error("Erro ao aceitar termos");
      }
    } catch (error: any) {
      console.error('Erro ao aceitar termos:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao aceitar termos",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Termos de Uso e Política de Privacidade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Olá, <strong>{userName}</strong>!
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Para usar o sistema MIEADI, você deve aceitar nossos termos de uso e política de privacidade.
            </p>
          </div>

          <div className="space-y-4">
            {/* Termos de Uso */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Termos de Uso
              </h4>
              <ScrollArea className="h-32 w-full border rounded-md p-3">
                <div className="text-xs space-y-2">
                  <p><strong>1. Aceitação:</strong> Ao usar o sistema MIEADI, você concorda com estes termos.</p>
                  <p><strong>2. Uso:</strong> Sistema destinado exclusivamente a atividades educacionais do MIEADI.</p>
                  <p><strong>3. Responsabilidades:</strong> Manter confidencialidade das credenciais de acesso.</p>
                  <p><strong>4. Privacidade:</strong> Dados protegidos conforme Política de Privacidade.</p>
                  <p><strong>5. Limitações:</strong> Sistema fornecido "como está" sem garantias.</p>
                </div>
              </ScrollArea>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm">
                  Eu li e aceito os Termos de Uso
                </label>
              </div>
            </div>

            {/* Política de Privacidade */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Política de Privacidade
              </h4>
              <ScrollArea className="h-32 w-full border rounded-md p-3">
                <div className="text-xs space-y-2">
                  <p><strong>1. Coleta:</strong> Coletamos apenas dados necessários para o sistema educacional.</p>
                  <p><strong>2. Uso:</strong> Dados usados exclusivamente para fins educacionais e administrativos.</p>
                  <p><strong>3. Compartilhamento:</strong> Não compartilhamos dados com terceiros sem consentimento.</p>
                  <p><strong>4. Segurança:</strong> Medidas técnicas implementadas para proteger seus dados.</p>
                  <p><strong>5. Direitos:</strong> Acesso, correção ou exclusão de dados pessoais garantidos.</p>
                </div>
              </ScrollArea>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="privacy" 
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                />
                <label htmlFor="privacy" className="text-sm">
                  Eu li e aceito a Política de Privacidade
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleAccept}
              disabled={!termsAccepted || !privacyAccepted || isSubmitting}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </div>
              ) : (
                "Aceitar e Continuar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}