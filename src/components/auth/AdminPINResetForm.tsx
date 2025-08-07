import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, User, Lock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateCPF, formatCPF } from "@/lib/auth";

interface AdminPINResetFormProps {
  adminUserId: string;
  adminRole: string;
}

export function AdminPINResetForm({ adminUserId, adminRole }: AdminPINResetFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { toast } = useToast();

  // Verificar se o usuário tem permissão
  if (!['diretor', 'secretario'].includes(adminRole)) {
    return (
      <Alert className="border-destructive/50 text-destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Acesso negado. Apenas diretores e secretários podem redefinir PINs.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o CPF ou nome para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      let searchQuery = supabase
        .from('profiles')
        .select('id, full_name, cpf, role, photo_url')
        .neq('id', adminUserId); // Não permitir reset do próprio PIN

      // Se parece com CPF (apenas números), buscar por CPF
      if (/^\d{11}$/.test(searchTerm.replace(/\D/g, ''))) {
        const cleanCPF = searchTerm.replace(/\D/g, '');
        searchQuery = searchQuery.eq('cpf', cleanCPF);
      } else {
        // Buscar por nome
        searchQuery = searchQuery.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await searchQuery.limit(10);

      if (error) {
        throw error;
      }

      setUsers(data || []);
      if (data && data.length === 0) {
        toast({
          title: "Nenhum usuário encontrado",
          description: "Tente buscar por outro CPF ou nome",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: error.message || "Erro interno",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePinUpdate = async () => {
    if (!selectedUser) {
      toast({
        title: "Usuário não selecionado",
        description: "Selecione um usuário primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      toast({
        title: "PIN inválido",
        description: "O PIN deve conter exatamente 4 números",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PINs não conferem",
        description: "Os PINs digitados devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('reset_user_pin_admin', {
        target_cpf: selectedUser.cpf,
        new_pin: newPin,
        admin_user_id: adminUserId
      });

      if (error) {
        throw error;
      }

      const result = data as any;
      if (result.success) {
        toast({
          title: "PIN redefinido com sucesso",
          description: result.message,
        });
        
        // Limpar formulário
        setSelectedUser(null);
        setNewPin("");
        setConfirmPin("");
        setSearchTerm("");
        setUsers([]);
      } else {
        throw new Error(result.error || "Erro ao redefinir PIN");
      }
    } catch (error: any) {
      console.error('Erro ao redefinir PIN:', error);
      toast({
        title: "Erro ao redefinir PIN",
        description: error.message || "Erro interno",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setSearchTerm(formatted);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Redefinir PIN de Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Busca de usuário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Buscar por CPF ou Nome
              </Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  type="text"
                  placeholder="Digite o CPF (000.000.000-00) ou nome completo"
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Se contém apenas números, aplicar máscara de CPF
                    if (/^\d/.test(value)) {
                      handleCPFChange(value);
                    } else {
                      setSearchTerm(value);
                    }
                  }}
                  maxLength={50}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Lista de usuários encontrados */}
            {users.length > 0 && (
              <div className="space-y-2">
                <Label>Usuários encontrados:</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            CPF: {formatCPF(user.cpf)} | Perfil: {user.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Formulário de novo PIN */}
          {selectedUser && (
            <>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium">Usuário selecionado:</p>
                <p className="text-lg">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  CPF: {formatCPF(selectedUser.cpf)}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPin" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Novo PIN (4 dígitos)
                  </Label>
                  <Input
                    id="newPin"
                    type="password"
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewPin(value);
                    }}
                    maxLength={4}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Confirmar PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setConfirmPin(value);
                    }}
                    maxLength={4}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <Button
                  onClick={handlePinUpdate}
                  disabled={isUpdating || newPin.length !== 4 || confirmPin.length !== 4}
                  className="w-full bg-gradient-to-r from-accent to-destructive text-white"
                >
                  {isUpdating ? "Redefinindo..." : "Redefinir PIN"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}