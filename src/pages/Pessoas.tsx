import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  UserCheck, 
  GraduationCap,
  Edit,
  Eye,
  MoreVertical,
  CreditCard,
  Printer,
  UserX,
  Trash2,
  QrCode,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  UserCircle,
  School,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Crown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Key
} from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { NovaPessoaForm } from "@/components/forms/NovaPessoaForm";
import { BadgeGenerator } from "@/components/ui/badge-generator";
import { QRCodeManager } from "@/components/profile/QRCodeManager";
import { PINResetDialog } from "@/components/auth/PINResetDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePessoasPaginadas } from "@/hooks/usePessoas";

interface Person {
  id: string;
  full_name: string;
  email?: string;
  cpf: string;
  phone?: string;
  role: string;
  status: string;
  congregation_name?: string;
  field_name?: string;
  photo_url?: string;
  created_at?: string;
  badge_number?: string;
  qr_code?: string;
  birth_date?: string;
  address?: string;
  congregation_id?: string;
  ministerial_position?: string;
  gender?: string;
}

export function Pessoas() {
  const [filterType, setFilterType] = useState("todos");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNovaPessoaForm, setShowNovaPessoaForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPINResetDialog, setShowPINResetDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Hook paginado para carregar pessoas
  const {
    data: pessoasData,
    isLoading: loading,
    isError,
    error,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    search,
    clearSearch,
    nextPage,
    prevPage,
    goToPage,
    refetch
  } = usePessoasPaginadas();

  // Dados da página atual
  const pessoas = pessoasData?.items || [];
  const totalCount = pessoasData?.totalCount || 0;
  const totalPages = pessoasData?.totalPages || 0;
  const hasNextPage = pessoasData?.hasNextPage || false;
  const hasPrevPage = pessoasData?.hasPrevPage || false;

  // Função para recarregar dados após mudanças
  const loadPessoas = () => {
    refetch();
  };

  const filteredAndSortedPessoas = useMemo(() => {
    let filtered = pessoas.filter(pessoa => {
      const searchableFields = [
        pessoa.full_name || "",
        pessoa.email || "",
        pessoa.cpf || "",
        pessoa.phone || "",
        pessoa.congregation_name || "",
        pessoa.field_name || "",
        pessoa.badge_number || ""
      ].join(" ").toLowerCase();
      
      const matchesSearch = searchableFields.includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "todos" || pessoa.role === filterType;
      
      return matchesSearch && matchesFilter;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue = "";
      let bValue = "";
      
      switch (sortBy) {
        case "name":
          aValue = a.full_name || "";
          bValue = b.full_name || "";
          break;
        case "role":
          aValue = a.role || "";
          bValue = b.role || "";
          break;
        case "congregation":
          aValue = a.congregation_name || "";
          bValue = b.congregation_name || "";
          break;
        case "created":
          aValue = a.full_name || ""; // Fallback para nome já que created_at não está disponível
          bValue = b.full_name || "";
          break;
        default:
          aValue = a.full_name || "";
          bValue = b.full_name || "";
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [pessoas, searchTerm, filterType, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = pessoas.length;
    const alunos = pessoas.filter(p => p.role === "aluno").length;
    const pastores = pessoas.filter(p => p.role === "pastor").length;
    const membros = pessoas.filter(p => p.role === "membro").length;
    const ativos = pessoas.filter(p => p.status === "ativo").length;
    
    return { total, alunos, pastores, membros, ativos };
  }, [pessoas]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return Crown;
      case "pastor": return UserCircle;
      case "professor": return BookOpen;
      case "coordenador": return UserCheck;
      case "secretario": return Building;
      case "aluno": return GraduationCap;
      default: return Users;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Diretor",
      pastor: "Pastor",
      professor: "Professor",
      coordenador: "Coordenador",
      secretario: "Secretário",
      aluno: "Aluno",
      membro: "Membro"
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "pastor": return "default";
      case "professor": return "secondary";
      case "coordenador": return "default";
      case "secretario": return "outline";
      case "aluno": return "secondary";
      default: return "outline";
    }
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setShowEditForm(true);
  };

  const handleGerarCracha = (person: Person) => {
    setSelectedPerson(person);
    setShowBadgeDialog(true);
  };

  const handleViewQRCode = (person: Person) => {
    setSelectedPerson(person);
    setShowQRCodeDialog(true);
  };

  const handleDeletePerson = (person: Person) => {
    setSelectedPerson(person);
    setShowDeleteDialog(true);
  };

  const handleResetPIN = (person: Person) => {
    setSelectedPerson(person);
    setShowPINResetDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedPerson) return;
    
    try {
      const { pessoasService } = await import("@/services/pessoas.service");
      await pessoasService.deletar(selectedPerson.id);
      
      toast({
        title: "Pessoa removida",
        description: `${selectedPerson.full_name} foi removida com sucesso.`,
      });
      
      loadPessoas();
    } catch (error) {
      console.error("Erro ao deletar pessoa:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover pessoa.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedPerson(null);
    }
  };

  const handlePromoteToStudent = async (person: Person) => {
    try {
      const { pessoasService } = await import("@/services/pessoas.service");
      await pessoasService.atualizar(person.id, { role: "aluno" });
      
      toast({
        title: "Função alterada",
        description: `${person.full_name} foi promovido(a) a Aluno.`,
      });
      
      loadPessoas();
    } catch (error) {
      console.error("Erro ao alterar função:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar função da pessoa.",
        variant: "destructive",
      });
    }
  };

  const handlePromoteToMember = async (person: Person) => {
    try {
      const { pessoasService } = await import("@/services/pessoas.service");
      await pessoasService.atualizar(person.id, { role: "membro" });
      
      toast({
        title: "Função alterada",
        description: `${person.full_name} foi promovido(a) a Membro.`,
      });
      
      loadPessoas();
    } catch (error) {
      console.error("Erro ao alterar função:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar função da pessoa.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando pessoas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gerenciamento de Pessoas
          </h1>
          <p className="text-muted-foreground">
            Gerencie membros, alunos e pastores do MIEADI
            {totalCount > 0 && ` • ${totalCount.toLocaleString()} pessoas cadastradas`}
          </p>
        </div>
        <Button onClick={() => setShowNovaPessoaForm(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Nova Pessoa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Pessoas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.alunos}</p>
                <p className="text-xs text-muted-foreground">Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pastores}</p>
                <p className="text-xs text-muted-foreground">Pastores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.membros}</p>
                <p className="text-xs text-muted-foreground">Membros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stats.ativos}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, CPF, telefone, congregação..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    clearSearch();
                  } else {
                    search(value);
                  }
                }}
                className="pl-10"
              />
            </div>
            
            {/* Filter by Role */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Cargos</SelectItem>
                <SelectItem value="admin">Diretores</SelectItem>
                <SelectItem value="pastor">Pastores</SelectItem>
                <SelectItem value="professor">Professores</SelectItem>
                <SelectItem value="coordenador">Coordenadores</SelectItem>
                <SelectItem value="secretario">Secretários</SelectItem>
                <SelectItem value="aluno">Alunos</SelectItem>
                <SelectItem value="membro">Membros</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="role">Cargo</SelectItem>
                <SelectItem value="congregation">Congregação</SelectItem>
                <SelectItem value="created">Data de Cadastro</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="w-full md:w-auto"
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            
            {/* View Mode */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {filteredAndSortedPessoas.length} de {pessoas.length} pessoas encontradas
          </p>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPessoas.map((pessoa) => {
              const RoleIcon = getRoleIcon(pessoa.role);
              return (
                <Card key={pessoa.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={pessoa.photo_url} />
                        <AvatarFallback className="text-sm">
                          {getInitials(pessoa.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{pessoa.full_name}</CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                          <RoleIcon className="h-3 w-3" />
                          <Badge variant={getRoleBadgeVariant(pessoa.role)} className="text-xs">
                            {getRoleLabel(pessoa.role)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {pessoa.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{pessoa.email}</span>
                      </div>
                    )}
                    {pessoa.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{pessoa.phone}</span>
                      </div>
                    )}
                    {pessoa.congregation_name && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span className="truncate">{pessoa.congregation_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPerson(pessoa)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewQRCode(pessoa)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Ver QR Code
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleGerarCracha(pessoa)}>
                             <CreditCard className="h-4 w-4 mr-2" />
                             Gerar Crachá
                           </DropdownMenuItem>
                           {(user?.role === 'diretor' || user?.role === 'secretario') && (
                             <DropdownMenuItem onClick={() => handleResetPIN(pessoa)}>
                               <Key className="h-4 w-4 mr-2" />
                               Redefinir PIN
                             </DropdownMenuItem>
                           )}
                           {pessoa.role === "membro" && (
                             <DropdownMenuItem onClick={() => handlePromoteToStudent(pessoa)}>
                               <GraduationCap className="h-4 w-4 mr-2" />
                               Promover a Aluno
                             </DropdownMenuItem>
                           )}
                           {pessoa.role !== "membro" && pessoa.role !== "pastor" && pessoa.role !== "admin" && (
                             <DropdownMenuItem onClick={() => handlePromoteToMember(pessoa)}>
                               <Users className="h-4 w-4 mr-2" />
                               Promover a Membro
                             </DropdownMenuItem>
                           )}
                           <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePerson(pessoa)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredAndSortedPessoas.map((pessoa) => {
                  const RoleIcon = getRoleIcon(pessoa.role);
                  return (
                    <div key={pessoa.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={pessoa.photo_url} />
                            <AvatarFallback className="text-sm">
                              {getInitials(pessoa.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div>
                              <p className="font-medium truncate">{pessoa.full_name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <RoleIcon className="h-3 w-3" />
                                <Badge variant={getRoleBadgeVariant(pessoa.role)} className="text-xs">
                                  {getRoleLabel(pessoa.role)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {pessoa.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{pessoa.email}</span>
                                </div>
                              )}
                              {pessoa.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{pessoa.phone}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {pessoa.congregation_name && (
                                <div className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  <span className="truncate">{pessoa.congregation_name}</span>
                                </div>
                              )}
                              {pessoa.cpf && (
                                <div className="text-xs">CPF: {pessoa.cpf}</div>
                              )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {pessoa.badge_number && (
                                <div className="text-xs">Crachá: {pessoa.badge_number}</div>
                              )}
                              <div className="text-xs">
                                Dados: {pessoa.badge_number ? 'Completo' : 'Básico'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPerson(pessoa)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewQRCode(pessoa)}>
                                <QrCode className="h-4 w-4 mr-2" />
                                Ver QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGerarCracha(pessoa)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Gerar Crachá
                              </DropdownMenuItem>
                               {(user?.role === 'diretor' || user?.role === 'secretario') && (
                                 <DropdownMenuItem onClick={() => handleResetPIN(pessoa)}>
                                   <Key className="h-4 w-4 mr-2" />
                                   Redefinir PIN
                                 </DropdownMenuItem>
                               )}
                              {pessoa.role === "membro" && (
                                <DropdownMenuItem onClick={() => handlePromoteToStudent(pessoa)}>
                                  <GraduationCap className="h-4 w-4 mr-2" />
                                  Promover a Aluno
                                </DropdownMenuItem>
                              )}
                              {pessoa.role !== "membro" && pessoa.role !== "pastor" && pessoa.role !== "admin" && (
                                <DropdownMenuItem onClick={() => handlePromoteToMember(pessoa)}>
                                  <Users className="h-4 w-4 mr-2" />
                                  Promover a Membro
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeletePerson(pessoa)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredAndSortedPessoas.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma pessoa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 
                  "Tente ajustar os filtros de busca ou limpar o termo de pesquisa." :
                  "Não há pessoas cadastradas no sistema."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowNovaPessoaForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Pessoa
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages} • Total: {totalCount} registros
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={!hasPrevPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {/* Mostrar algumas páginas ao redor da atual */}
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const pageNumber = Math.max(0, page - 2) + index;
                    if (pageNumber >= totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        disabled={loading}
                        className="w-10"
                      >
                        {pageNumber + 1}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage || loading}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading overlay for pagination */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg border flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando página {page + 1}...</span>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NovaPessoaForm
        isOpen={showNovaPessoaForm}
        onClose={() => setShowNovaPessoaForm(false)}
        onSuccess={() => {
          setShowNovaPessoaForm(false);
          loadPessoas();
        }}
      />

      <NovaPessoaForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedPerson(null);
        }}
        onSuccess={() => {
          setShowEditForm(false);
          setSelectedPerson(null);
          loadPessoas();
        }}
        initialData={selectedPerson}
      />

      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gerar Crachá</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <BadgeGenerator person={selectedPerson} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showQRCodeDialog} onOpenChange={setShowQRCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <QRCodeManager
              userId={selectedPerson.id}
              userQRCode={selectedPerson.qr_code}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover <strong>{selectedPerson?.full_name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPerson(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPINResetDialog} onOpenChange={setShowPINResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir PIN</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <PINResetDialog userRole={user?.role || ''} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}