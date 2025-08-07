import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Search, Key, Loader2 } from "lucide-react";
import { useCPFAuth } from "@/hooks/useCPFAuth";

const searchSchema = z.object({
  searchTerm: z.string().min(1, "Digite um CPF ou nome para buscar"),
});

const pinSchema = z.object({
  newPin: z.string()
    .length(4, "PIN deve ter exatamente 4 dígitos")
    .regex(/^\d{4}$/, "PIN deve conter apenas números"),
  confirmPin: z.string()
    .length(4, "PIN deve ter exatamente 4 dígitos")
    .regex(/^\d{4}$/, "PIN deve conter apenas números"),
}).refine((data) => data.newPin === data.confirmPin, {
  message: "PINs não coincidem",
  path: ["confirmPin"],
});

type SearchFormData = z.infer<typeof searchSchema>;
type PINFormData = z.infer<typeof pinSchema>;

interface PINResetDialogProps {
  userRole: string;
}

export function PINResetDialog({ userRole }: PINResetDialogProps) {
  const [open, setOpen] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [step, setStep] = useState<'search' | 'reset'>('search');
  const { loading, searchUserByCPF, resetUserPIN } = useCPFAuth();

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { searchTerm: "" },
  });

  const pinForm = useForm<PINFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: { newPin: "", confirmPin: "" },
  });

  const canResetPIN = userRole === 'diretor' || userRole === 'secretario';

  if (!canResetPIN) {
    return null;
  }

  const handleSearch = async (data: SearchFormData) => {
    try {
      const cleanCPF = data.searchTerm.replace(/[^0-9]/g, '');
      if (cleanCPF.length === 11) {
        const user = await searchUserByCPF(cleanCPF);
        if (user) {
          setFoundUser(user);
          setStep('reset');
        } else {
          searchForm.setError("searchTerm", { message: "Usuário não encontrado" });
        }
      } else {
        searchForm.setError("searchTerm", { message: "Digite um CPF válido com 11 dígitos" });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
    }
  };

  const handlePINReset = async (data: PINFormData) => {
    if (!foundUser) return;

    try {
      const success = await resetUserPIN(foundUser.cpf, data.newPin);
      if (success) {
        setOpen(false);
        setStep('search');
        setFoundUser(null);
        searchForm.reset();
        pinForm.reset();
      }
    } catch (error) {
      console.error('Erro ao redefinir PIN:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Key className="h-4 w-4" />
          Redefinir PIN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Redefinir PIN de Usuário
          </DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={searchForm.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Usuário</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o CPF (apenas números)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={11}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar Usuário
              </Button>
            </form>
          </Form>
        )}

        {step === 'reset' && foundUser && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <p className="font-medium">{foundUser.full_name}</p>
                <p className="text-sm text-muted-foreground">CPF: {foundUser.cpf}</p>
              </CardContent>
            </Card>

            <Form {...pinForm}>
              <form onSubmit={pinForm.handleSubmit(handlePINReset)} className="space-y-4">
                <FormField
                  control={pinForm.control}
                  name="newPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Novo PIN</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0000"
                          type="password"
                          className="text-center"
                          {...field}
                          maxLength={4}
                          onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pinForm.control}
                  name="confirmPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar PIN</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0000"
                          type="password"
                          className="text-center"
                          {...field}
                          maxLength={4}
                          onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('search')}>
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                    Redefinir
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}