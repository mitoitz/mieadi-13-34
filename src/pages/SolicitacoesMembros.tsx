
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  Search, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MemberRequest {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  cpf: string;
  birth_date?: string;
  address?: string;
  congregation_id?: string;
  requested_role: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export function SolicitacoesMembros() {
  const [requests, setRequests] = useState<MemberRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<MemberRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [actionComments, setActionComments] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      console.log('🔄 Carregando solicitações de membros...');
      
      // Using member_requests table to get all membership requests
      const { data, error } = await supabase
        .from('member_requests')
        .select(`
          *,
          congregations:congregation_id(name)
        `)
        .order('created_at', { ascending: false });

      console.log('📊 Resultado da query member_requests:', { data, error, count: data?.length });

      if (error) {
        console.error('❌ Erro na query member_requests:', error);
        throw error;
      }

      const formattedRequests: MemberRequest[] = data?.map(request => ({
        id: request.id,
        full_name: request.full_name,
        email: request.email,
        phone: request.phone || undefined,
        cpf: request.cpf,
        birth_date: request.birth_date || undefined,
        address: request.address || undefined,
        congregation_id: request.congregation_id || undefined,
        requested_role: request.requested_role,
        status: request.status as 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise',
        admin_notes: request.admin_notes || undefined,
        created_at: request.created_at,
        updated_at: request.updated_at
      })) || [];

      console.log('✅ Solicitações processadas:', formattedRequests.length);
      setRequests(formattedRequests);
    } catch (error) {
      console.error('❌ Error loading requests:', error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'ativo' | 'inativo') => {
    try {
      const updateData: any = { 
        status: action === 'ativo' ? 'aprovado' : 'rejeitado',
        admin_notes: actionComments,
        updated_at: new Date().toISOString()
      };

      if (action === 'inativo') {
        updateData.rejection_reason = actionComments;
      }

      // Update the status in member_requests table
      const { error } = await supabase
        .from('member_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // If approved, create user profile
      if (action === 'ativo') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          // Verificar se já existe um perfil com este email
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', request.email)
            .maybeSingle();

          if (existingProfile) {
            toast.error("Já existe um usuário com este email");
            return;
          }

          // Limpar campos de data vazios antes de inserir
          const cleanBirthDate = request.birth_date === "" ? undefined : request.birth_date;
          const cleanMemberSince = new Date().toISOString().split('T')[0];
          const cleanAdmissionDate = new Date().toISOString().split('T')[0];

          // Criar perfil completo
          const profileData = {
            id: crypto.randomUUID(),
            full_name: request.full_name,
            email: request.email,
            phone: request.phone || undefined,
            cpf: request.cpf || undefined,
            birth_date: cleanBirthDate,
            address: request.address || undefined,
            congregation_id: request.congregation_id || undefined,
            role: request.requested_role as 'admin' | 'coordenador' | 'professor' | 'aluno' | 'membro' | 'pastor',
            status: 'ativo' as 'ativo' | 'inativo' | 'pendente',
            bio: actionComments || undefined,
            member_since: cleanMemberSince,
            admission_date: cleanAdmissionDate,
            is_first_login: true
          } as any;

          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast.error(`Erro ao criar perfil do usuário: ${profileError.message}`);
            return;
          }

          // Atualizar o request com o ID aprovador
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('member_requests')
              .update({ approved_by: user.id, approved_at: new Date().toISOString() })
              .eq('id', requestId);
          }
        }
        toast.success("Solicitação aprovada e usuário criado com sucesso!");
      } else {
        toast.success("Solicitação rejeitada");
      }
      
      setActionComments("");
      setShowDetailsDialog(false);
      loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error("Erro ao processar solicitação");
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.cpf.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'em_analise': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovada';
      case 'rejeitado': return 'Rejeitada';
      case 'pendente': return 'Pendente';
      case 'em_analise': return 'Em Análise';
      default: return 'Indefinido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado': return <Check className="h-4 w-4" />;
      case 'rejeitado': return <X className="h-4 w-4" />;
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'em_analise': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'aluno': return 'Aluno';
      case 'professor': return 'Professor';
      case 'coordenador': return 'Coordenador';
      case 'admin': return 'Diretor';
      case 'membro': return 'Membro';
      default: return role;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pendente').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Solicitações de Membros
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Gerencie solicitações de novos membros</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar solicitações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovado">Aprovadas</SelectItem>
            <SelectItem value="rejeitado">Rejeitadas</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{request.full_name}</CardTitle>
                <Badge className={getStatusColor(request.status)}>
                  {getStatusIcon(request.status)}
                  <span className="ml-1">{getStatusText(request.status)}</span>
                </Badge>
              </div>
              <CardDescription>
                Solicitação para: {getRoleText(request.requested_role)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {request.email}
              </div>
              {request.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {request.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(request.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailsDialog(true);
                  }}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Detalhes
                </Button>
                {request.status === 'pendente' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleRequestAction(request.id, 'ativo')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRequestAction(request.id, 'inativo')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente ajustar os filtros de busca" : "Não há solicitações no momento"}
          </p>
        </div>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome Completo</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">CPF</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.cpf}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.phone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Nascimento</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.birth_date 
                      ? new Date(selectedRequest.birth_date).toLocaleDateString() 
                      : "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cargo Solicitado</Label>
                  <p className="text-sm text-muted-foreground">{getRoleText(selectedRequest.requested_role)}</p>
                </div>
              </div>
              
              {selectedRequest.address && (
                <div>
                  <Label className="text-sm font-medium">Endereço</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.address}</p>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.admin_notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Data da Solicitação</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1">{getStatusText(selectedRequest.status)}</span>
                  </Badge>
                </div>
              </div>

              {selectedRequest.status === 'pendente' && (
                <div className="border-t pt-4">
                  <Label htmlFor="comments" className="text-sm font-medium">
                    Comentários da Aprovação/Rejeição
                  </Label>
                  <Textarea
                    id="comments"
                    value={actionComments}
                    onChange={(e) => setActionComments(e.target.value)}
                    placeholder="Adicione comentários sobre a decisão..."
                    className="mt-2"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleRequestAction(selectedRequest.id, 'ativo')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleRequestAction(selectedRequest.id, 'inativo')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
