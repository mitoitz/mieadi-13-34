import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Edit, 
  Save, 
  Lock,
  Shield,
  Heart,
  DollarSign,
  CreditCard,
  Receipt,
  QrCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeManager } from "@/components/profile/QRCodeManager";

interface MemberProfile {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
  civil_status?: string;
  profession?: string;
  role: string;
  status: string;
  congregation_id?: string;
  bio?: string;
  avatar_url?: string;
  member_since?: string;
  last_login?: string;
  financial_status?: string;
  monthly_contribution?: number;
  total_contributions?: number;
  last_contribution_date?: string;
  qr_code?: string;
}

export default function PerfilMembro() {
  const [profile, setProfile] = useState<MemberProfile | null>({
    id: "1",
    full_name: "Maria Silva",
    email: "maria@example.com",
    cpf: "",
    phone: "(11) 99999-9999",
    address: "Rua das Flores, 123",
    role: "membro",
    status: "ativo",
    bio: "Membro ativo da congregação",
    member_since: "2020-01-01",
    financial_status: "em-dia",
    monthly_contribution: 150.00,
    total_contributions: 1800.00,
    last_contribution_date: "2024-01-15"
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleSave = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    // Simular salvamento
    setTimeout(() => {
      setIsEditing(false);
      setIsLoading(false);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    }, 1000);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    toast({
      title: "Sucesso",
      description: "Senha alterada com sucesso!",
    });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'admin': 'bg-red-500',
      'coordenador': 'bg-blue-500',
      'secretario': 'bg-green-500',
      'professor': 'bg-purple-500',
      'pastor': 'bg-yellow-500',
      'aluno': 'bg-cyan-500',
      'membro': 'bg-gray-500'
    };
    
    return roleColors[role] || 'bg-gray-500';
  };

  const getFinancialStatusBadge = (status: string) => {
    switch (status) {
      case "em-dia":
        return { variant: "default" as const, label: "Em Dia" };
      case "atrasado":
        return { variant: "destructive" as const, label: "Atrasado" };
      case "isento":
        return { variant: "secondary" as const, label: "Isento" };
      default:
        return { variant: "secondary" as const, label: status };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Perfil do Membro</h1>
        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : isEditing ? (
            <>
              <Save className="h-4 w-4" />
              Salvar
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Editar
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="church">Dados Eclesiásticos</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile.full_name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Alterar Foto
                  </Button>
                  <Badge className={getRoleBadge(profile.role)}>
                    {profile.role.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={profile.cpf}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, birth_date: e.target.value} : null)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Profissão</Label>
                  <Input
                    id="profession"
                    value={profile.profession || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, profession: e.target.value} : null)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => setProfile(prev => prev ? {...prev, address: e.target.value} : null)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="church" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Informações Eclesiásticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Função na Igreja</Label>
                  <Input value={profile.role} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={profile.status} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Membro desde</Label>
                  <Input 
                    value={profile.member_since ? new Date(profile.member_since).toLocaleDateString() : 'N/A'} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Último acesso</Label>
                  <Input 
                    value={profile.last_login ? new Date(profile.last_login).toLocaleString() : 'N/A'} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Meu QR Code de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeManager 
                userId={profile.id}
                userQRCode={profile.qr_code}
                onQRCodeGenerated={(qrCode) => {
                  setProfile(prev => prev ? {...prev, qr_code: qrCode} : null);
                  toast({
                    title: "QR Code atualizado!",
                    description: "Seu QR Code foi gerado com sucesso."
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Situação Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status Financeiro</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={getFinancialStatusBadge(profile.financial_status || "").variant}>
                      {getFinancialStatusBadge(profile.financial_status || "").label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contribuição Mensal</Label>
                  <Input 
                    value={profile.monthly_contribution ? formatCurrency(profile.monthly_contribution) : 'N/A'} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total de Contribuições</Label>
                  <Input 
                    value={profile.total_contributions ? formatCurrency(profile.total_contributions) : 'N/A'} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>
              </div>

              {/* Histórico de Contribuições */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Histórico de Contribuições</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <Receipt className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Última Contribuição</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.last_contribution_date ? 
                              new Date(profile.last_contribution_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {profile.monthly_contribution ? formatCurrency(profile.monthly_contribution) : 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">Dízimo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Nova Contribuição
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Ver Histórico Completo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alterar Senha</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  disabled={!newPassword || !confirmPassword}
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}