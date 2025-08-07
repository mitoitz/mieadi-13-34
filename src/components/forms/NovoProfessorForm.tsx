import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const novoProfessorSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  phone: z.string().optional(),
  birth_date: z.date({ required_error: "Data de nascimento é obrigatória" }),
  address: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().min(2, "Especialização é obrigatória"),
  education: z.string().min(2, "Formação é obrigatória"),
});

type NovoProfessorFormData = z.infer<typeof novoProfessorSchema>;

interface NovoProfessorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function NovoProfessorForm({ isOpen, onClose, onSuccess, initialData }: NovoProfessorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!initialData;

  const form = useForm<NovoProfessorFormData>({
    resolver: zodResolver(novoProfessorSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      email: initialData?.email || "",
      cpf: initialData?.cpf || "",
      phone: initialData?.phone || "",
      birth_date: initialData?.birth_date ? new Date(initialData.birth_date) : undefined,
      address: initialData?.address || "",
      bio: initialData?.bio || "",
      specialization: "",
      education: "",
    },
  });

  const onSubmit = async (data: NovoProfessorFormData) => {
    setIsLoading(true);
    
    try {
      if (isEditing && initialData?.id) {
        // Update existing professor
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: data.full_name,
            email: data.email,
            cpf: data.cpf,
            phone: data.phone,
            birth_date: format(data.birth_date, 'yyyy-MM-dd'),
            address: data.address,
            bio: `Especialização: ${data.specialization}\nFormação: ${data.education}\n\n${data.bio || ''}`,
          })
          .eq('id', initialData.id);

        if (profileError) throw profileError;

        toast({
          title: "Professor atualizado com sucesso!",
          description: `Prof. ${data.full_name} foi atualizado no sistema.`,
        });
      } else {
        // Create new professor - just create profile without auth user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            full_name: data.full_name,
            email: data.email,
            cpf: data.cpf,
            phone: data.phone,
            birth_date: format(data.birth_date, 'yyyy-MM-dd'),
            address: data.address,
            bio: `Especialização: ${data.specialization}\nFormação: ${data.education}\n\n${data.bio || ''}`,
            role: 'professor',
            status: 'ativo',
          });

        if (profileError) throw profileError;

        toast({
          title: "Professor cadastrado com sucesso!",
          description: `Prof. ${data.full_name} foi cadastrado no sistema.`,
        });
      }

      form.reset();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving professor:', error);
      toast({
        title: `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} professor`,
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Professor" : "Novo Professor"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edite as informações do professor" : "Cadastre um novo professor no sistema"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="00000000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(99) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialização</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Teologia Sistemática" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Doutor em Teologia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Informações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Biografia, experiências, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (isEditing ? "Atualizando..." : "Cadastrando...") : (isEditing ? "Atualizar" : "Cadastrar")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}