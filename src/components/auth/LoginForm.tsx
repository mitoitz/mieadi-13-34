import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    cpf: string;
    role: string;
    congregation_id?: string;
    photo_url?: string;
    terms_accepted?: boolean;
    privacy_policy_accepted?: boolean;
    two_factor_enabled?: boolean;
    permissions?: any;
  };
}

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLogin: (profile: any) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('🔄 Iniciando login customizado...');
      console.log('📧 Email:', data.email);
      console.log('🔐 Password length:', data.password.length);

      // Chamar função de autenticação customizada
      const { data: authResult, error: authError } = await supabase
        .rpc('authenticate_by_email', {
          p_email: data.email,
          p_password: data.password
        });

      console.log('📡 Resultado da autenticação:', authResult);

      if (authError) {
        console.error('❌ Erro na autenticação:', authError);
        toast({
          title: "Erro no login",
          description: "Erro interno do servidor",
          variant: "destructive",
        });
        return;
      }

      // Fazer cast do resultado para o tipo correto
      const result = authResult as unknown as AuthResult;

      if (!result || !result.success) {
        console.error('❌ Falha na autenticação:', result?.message);
        toast({
          title: "Erro no login",
          description: result?.message || "Credenciais inválidas",
          variant: "destructive",
        });
        return;
      }

      if (!result.user) {
        console.error('❌ Dados do usuário não encontrados');
        toast({
          title: "Erro no login",
          description: "Dados do usuário não encontrados",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Autenticação bem-sucedida:', result.user);

      // Preparar dados do usuário para o contexto da aplicação
      const userData = {
        id: result.user.id,
        name: result.user.full_name || "Usuário",
        full_name: result.user.full_name,
        email: result.user.email,
        cpf: result.user.cpf,
        userType: result.user.role,
        role: result.user.role,
        congregacao: result.user.congregation_id,
        permissions: result.user.permissions,
        session: { user: result.user }, // sessão simplificada
        photo_url: result.user.photo_url,
      };

      console.log('✅ Dados do usuário preparados:', userData);

      // Chamar callback de login
      onLogin(userData);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${result.user.full_name}!`,
      });

    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative mb-6 p-4 bg-card rounded-2xl shadow-elegant mx-auto w-fit hover:scale-105 transition-transform duration-300">
            <img 
              src="/lovable-uploads/3781b316-2d9c-4e52-9847-bbf43a15c4fe.png" 
              alt="MIEADI Logo" 
              className="h-16 w-auto mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sistema MIEADI
          </h1>
          <p className="text-muted-foreground">
            Portal de Gestão Eclesiástica
          </p>
        </div>

        {/* Credenciais de Demonstração */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant mb-6">
          <CardHeader>
            <CardTitle className="text-center text-lg">Credenciais de Demonstração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-semibold text-primary">Diretor:</p>
              <p>Email: diretor@mieadi.com.br</p>
              <p>Senha: Diretor2025!</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-primary">Admin:</p>
              <p>Email: admin@mieadi.com.br</p>
              <p>Senha: Admin2025!</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-primary">Fernando (Admin):</p>
              <p>Email: fernandobritosantana@gmail.com</p>
              <p>Senha: Fernando2025!</p>
            </div>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">Fazer Login</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Entre com seu email e senha
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          type="email"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        Senha
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Sua senha"
                            type={showPassword ? "text" : "password"}
                            className="h-12 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}