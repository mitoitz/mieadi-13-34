import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useCPFAuth } from "@/hooks/useCPFAuth";

const pinSchema = z.object({
  pin: z.string()
    .length(4, "PIN deve ter exatamente 4 dígitos")
    .regex(/^\d{4}$/, "PIN deve conter apenas números"),
});

type PINFormData = z.infer<typeof pinSchema>;

interface PINLoginFormProps {
  user: any;
  onPINVerified: (user: any) => void;
  onBack: () => void;
  onSetupPIN?: () => void;
}

export function PINLoginForm({ user, onPINVerified, onBack, onSetupPIN }: PINLoginFormProps) {
  const { loading, verifyPIN } = useCPFAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const form = useForm<PINFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: "",
    },
  });

  const handleSubmit = async (data: PINFormData) => {
    setIsLoading(true);
    try {
      const result = await verifyPIN(user.cpf, data.pin);
      if (result.success && result.user) {
        onPINVerified(result.user);
      } else {
        // Verificar se o erro é por PIN não configurado
        if (result.message?.includes('PIN não configurado')) {
          form.setError("pin", { message: "PIN não configurado para este usuário" });
        } else {
          form.setError("pin", { message: result.message || "PIN incorreto" });
        }
      }
    } catch (error) {
      console.error('Erro na verificação do PIN:', error);
      form.setError("pin", { message: "Erro de conexão" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative mb-6 p-4 bg-card rounded-2xl shadow-elegant mx-auto w-fit">
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
            Digite seu PIN de acesso
          </p>
        </div>

        {/* User Info */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">CPF: {user.cpf}</p>
              <p className="text-sm text-primary capitalize">{user.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* PIN Login Form */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">Digite seu PIN</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Insira seu PIN de 4 dígitos para acessar o sistema
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        PIN de Acesso
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="0000"
                            type={showPin ? "text" : "password"}
                            className="h-12 text-center text-lg pr-10"
                            {...field}
                            maxLength={4}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              field.onChange(value);
                            }}
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPin(!showPin)}
                          >
                            {showPin ? (
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

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold" 
                    disabled={isLoading || loading}
                  >
                    {isLoading || loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Entrar
                      </>
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12" 
                    onClick={onBack}
                    disabled={isLoading || loading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>

                  {onSetupPIN && (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="w-full h-12" 
                      onClick={onSetupPIN}
                      disabled={isLoading || loading}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Cadastrar Novo PIN
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}