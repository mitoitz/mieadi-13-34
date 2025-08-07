import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando código de acesso...');

  useEffect(() => {
    const processOtpCallback = async () => {
      try {
        // Extrair token hash dos parâmetros da URL
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') as 'magiclink' | 'recovery' | 'invite' | 'email';
        
        if (!tokenHash) {
          setStatus('error');
          setMessage('Token de acesso não encontrado na URL');
          return;
        }

        console.log('🔍 Processando callback OTP:', { tokenHash, type });

        // Verificar OTP usando o AuthService
        const result = await AuthService.verifyOtp(tokenHash, type || 'magiclink');

        if (!result.success) {
          setStatus('error');
          setMessage(result.message || 'Falha na verificação do código');
          toast({
            title: "Erro na verificação",
            description: result.message,
            variant: "destructive",
          });
          return;
        }

        if (!result.user) {
          setStatus('error');
          setMessage('Dados do usuário não encontrados');
          return;
        }

        // Login bem-sucedido
        setStatus('success');
        setMessage(`Acesso autorizado! Redirecionando...`);
        
        // Fazer login no sistema
        await handleLogin(result.user);
        
        toast({
          title: "Acesso autorizado!",
          description: result.message,
        });

        // Redirecionar após um breve delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);

      } catch (error: any) {
        console.error('❌ Erro no processamento do callback:', error);
        setStatus('error');
        setMessage(error.message || 'Erro interno do servidor');
        
        toast({
          title: "Erro no acesso",
          description: error.message || "Erro interno do servidor",
          variant: "destructive",
        });
      }
    };

    processOtpCallback();
  }, [searchParams, handleLogin, navigate, toast]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-primary';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative mb-6 p-6 bg-card rounded-3xl shadow-elegant mx-auto w-fit border">
            <img 
              src="/lovable-uploads/3781b316-2d9c-4e52-9847-bbf43a15c4fe.png" 
              alt="MIEADI Logo" 
              className="h-16 w-auto mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Sistema MIEADI
          </h1>
          <p className="text-muted-foreground">
            Verificando acesso...
          </p>
        </div>

        {/* Status Card */}
        <Card className="bg-card border shadow-elegant">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              {getIcon()}
            </div>
            
            <div className="space-y-2">
              <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
                {status === 'loading' && 'Verificando código...'}
                {status === 'success' && 'Acesso autorizado!'}
                {status === 'error' && 'Erro na verificação'}
              </h2>
              
              <p className="text-muted-foreground">
                {message}
              </p>
            </div>

            {status === 'error' && (
              <div className="pt-4">
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="text-primary hover:underline text-sm"
                >
                  Voltar para o login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}