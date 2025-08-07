import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { setupInitialData } from "@/lib/setup-data";
import { CheckCircle, Database, AlertCircle } from "lucide-react";

interface SystemSetupProps {
  onComplete: () => void;
}

export function SystemSetup({ onComplete }: SystemSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      await setupInitialData();
      setSetupComplete(true);
      toast({
        title: "Sistema configurado!",
        description: "Dados iniciais criados com sucesso. Use CPF: 000.000.000-01 e senha: admin123 para fazer login como diretor.",
      });
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Erro na configuração",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-md bg-white shadow-elegant">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-700">
              Sistema Configurado!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              O sistema foi configurado com sucesso.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Credenciais do Diretor:
              </p>
              <p className="text-blue-700">
                <strong>CPF:</strong> 000.000.000-01<br />
                <strong>Senha:</strong> admin123
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecionando em alguns segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md bg-white shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">
            Configuração do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    Primeira Configuração
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    O sistema precisa ser configurado com dados iniciais antes do primeiro uso.
                    Isso criará:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                    <li>Congregações básicas</li>
                    <li>Campos ministeriais</li>
                    <li>Cursos iniciais</li>
                    <li>Disciplinas básicas</li>
                    <li>Usuário diretor</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSetup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Configurando Sistema...
                </div>
              ) : (
                "Configurar Sistema"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Este processo pode levar alguns segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}