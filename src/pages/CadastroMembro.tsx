import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";
import { validateMemberRequest, sanitizeInput, RateLimiter } from "@/lib/validation";
import { formatCPF } from "@/lib/auth";
import { congregacoesService, Congregacao } from "@/services/congregacoes.service";

// Rate limiter for form submissions
const rateLimiter = new RateLimiter(3, 10 * 60 * 1000*2000*3000); // 3 attempts per 10 minutes

export function CadastroMembro() {
  const [loading, setLoading] = useState(false);
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: "",
    address: "",
    congregation: "",
    bio: "",
    requested_role: "membro"
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCongregacoes();
  }, []);

  const loadCongregacoes = async () => {
    try {
      const data = await congregacoesService.listar();
      setCongregacoes(data);
    } catch (error) {
      console.error('Erro ao carregar congregações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as congregações.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const userIP = "user"; // In production, get actual IP
    if (!rateLimiter.isAllowed(userIP)) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(userIP) / 1000 / 60);
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${remainingTime} minutos antes de tentar novamente.`,
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    const validation = validateMemberRequest(formData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Dados inválidos",
        description: "Corrija os erros indicados e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setValidationErrors([]);

    try {
      console.log('🔄 Verificando email existente:', formData.email);
      
      // Check if email already exists - usar maybeSingle() para evitar erro RLS
      const { data: existingRequest, error: checkError } = await supabase
        .from("member_requests")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      if (checkError) {
        console.warn('⚠️ Erro ao verificar email (ignorando):', checkError);
        // Continuar mesmo com erro de verificação
      }

      if (existingRequest) {
        console.log('❌ Email já existente:', existingRequest);
        toast({
          title: "Email já cadastrado",
          description: "Este email já possui uma solicitação em andamento.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Limpar campos de data vazios - enviar null em vez de string vazia
      const cleanBirthDate = formData.birth_date === "" ? null : formData.birth_date;
      const cleanPhone = formData.phone.replace(/\D/g, "") || null;
      const cleanCongregationId = formData.congregation === "" ? null : formData.congregation;

      console.log('📝 Criando nova solicitação:', {
        full_name: formData.full_name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ""),
        requested_role: formData.requested_role,
        congregation_id: cleanCongregationId,
        birth_date: cleanBirthDate
      });

      const { data: insertedData, error } = await supabase
        .from("member_requests")
        .insert([{
          full_name: formData.full_name,
          email: formData.email,
          cpf: formData.cpf.replace(/\D/g, ""),
          phone: cleanPhone,
          birth_date: cleanBirthDate,
          address: formData.address || null,
          bio: formData.bio || null,
          congregation_id: cleanCongregationId,
          requested_role: formData.requested_role as "admin" | "coordenador" | "professor" | "aluno" | "membro",
          status: "pendente"
        }])
        .select();

      console.log('📊 Resultado da inserção:', { data: insertedData, error });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Seu cadastro foi enviado para análise. Aguarde a aprovação do diretor.",
      });

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        cpf: "",
        birth_date: "",
        address: "",
        congregation: "",
        bio: "",
        requested_role: "membro"
      });

    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao enviar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <UserPlus className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
            <CardTitle className="text-xl lg:text-2xl">Cadastro de Novo Membro</CardTitle>
          </div>
          <CardDescription className="text-sm lg:text-base">
            Preencha os dados abaixo para solicitar seu cadastro no sistema MIEADI
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="mb-6">
            <AlertDescription className="text-sm">
              Após o envio, sua solicitação será analisada pelo diretor. 
              Você receberá um retorno em breve sobre a aprovação do seu cadastro.
            </AlertDescription>
          </Alert>

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">Nome Completo *</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  required
                  placeholder="Digite seu nome completo"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  placeholder="Digite seu e-mail"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-medium">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value);
                    if (formatted.length <= 14) {
                      handleInputChange("cpf", formatted);
                    }
                  }}
                  required
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                <Input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    if (formatted.length <= 15) {
                      handleInputChange("phone", formatted);
                    }
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-sm font-medium">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange("birth_date", e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="congregation" className="text-sm font-medium">Congregação</Label>
                <Select
                  value={formData.congregation}
                  onValueChange={(value) => handleInputChange("congregation", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione sua congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregacoes.map((congregacao) => (
                      <SelectItem key={congregacao.id} value={congregacao.id}>
                        {congregacao.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Digite seu endereço completo"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_role" className="text-sm font-medium">Perfil Solicitado</Label>
              <Select
                value={formData.requested_role}
                onValueChange={(value) => handleInputChange("requested_role", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Breve Apresentação</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Conte um pouco sobre você, sua experiência na igreja, motivação para o cadastro, etc."
                rows={4}
                className="w-full resize-none"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium"
              disabled={loading || !formData.full_name || !formData.email || !formData.cpf}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitação"
              )}
            </Button>

            <div className="text-center pt-4">
              <Button 
                variant="link" 
                onClick={() => window.history.back()}
                className="text-sm"
              >
                Voltar ao Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}