import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Loader2 } from "lucide-react";
import { useCPFAuth } from "@/hooks/useCPFAuth";

const cpfSchema = z.object({
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .refine((cpf) => {
      const cleanCPF = cpf.replace(/[^0-9]/g, '');
      return cleanCPF.length === 11;
    }, "CPF deve ter 11 dígitos"),
});

type CPFFormData = z.infer<typeof cpfSchema>;

interface CPFLoginFormProps {
  onUserFound: (user: any) => void;
}

export function CPFLoginForm({ onUserFound }: CPFLoginFormProps) {
  const { loading, authenticateByCPF } = useCPFAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CPFFormData>({
    resolver: zodResolver(cpfSchema),
    defaultValues: {
      cpf: "",
    },
  });

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= 11) {
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    form.setValue('cpf', formatted);
  };

  const handleSubmit = async (data: CPFFormData) => {
    setIsLoading(true);
    try {
      const cleanCPF = data.cpf.replace(/[^0-9]/g, '');
      const result = await authenticateByCPF(cleanCPF);
      
      if (result.success && result.user) {
        onUserFound(result.user);
      }
    } catch (error) {
      console.error('Erro no login por CPF:', error);
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
            Acesso por CPF
          </p>
        </div>


        {/* Login Form */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">Digite seu CPF</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Insira seu CPF para acessar o sistema
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        CPF
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          className="h-12 text-center text-lg"
                          {...field}
                          onChange={(e) => handleCPFChange(e.target.value)}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <User className="mr-2 h-4 w-4" />
                      Continuar
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