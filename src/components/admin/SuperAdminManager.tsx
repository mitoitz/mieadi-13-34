import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Crown, 
  User,
  AlertTriangle,
  Check,
  X,
  Calendar
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SuperAdmin {
  id: string;
  full_name: string;
  cpf: string;
  email: string;
  role: string;
  granted_at: string;
  granted_by_name: string;
  active: boolean;
  notes: string;
}

export function SuperAdminManager() {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);
  const [cpf, setCpf] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSuperAdmins();
  }, []);

  const loadSuperAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('list_super_admins');
      
      if (error) {
        console.error('Erro ao carregar super admins:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar lista de Super Administradores",
          variant: "destructive",
        });
        return;
      }

      setSuperAdmins(data || []);
    } catch (error) {
      console.error('Erro ao carregar super admins:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar Super Administradores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= 11) {
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
  };

  const handleAddSuperAdmin = async () => {
    if (!cpf.trim()) {
      toast({
        title: "Erro",
        description: "CPF é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const cleanCPF = cpf.replace(/[^0-9]/g, '');
      const { data, error } = await supabase.rpc('add_super_admin', {
        target_cpf: cleanCPF,
        granted_by_id: user?.id,
        admin_notes: notes.trim() || null
      });

      if (error) {
        console.error('Erro ao adicionar super admin:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao adicionar Super Administrador",
          variant: "destructive",
        });
        return;
      }

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        setShowAddDialog(false);
        setCpf("");
        setNotes("");
        loadSuperAdmins();
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar super admin:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSuperAdmin = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('remove_super_admin', {
        target_cpf: selectedAdmin.cpf
      });

      if (error) {
        console.error('Erro ao remover super admin:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao remover Super Administrador",
          variant: "destructive",
        });
        return;
      }

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        setShowRemoveDialog(false);
        setSelectedAdmin(null);
        loadSuperAdmins();
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao remover super admin:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openRemoveDialog = (admin: SuperAdmin) => {
    setSelectedAdmin(admin);
    setShowRemoveDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando Super Administradores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Super Administradores</h2>
            <p className="text-muted-foreground">
              Gerenciar usuários com acesso total ao sistema
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Super Admin
        </Button>
      </div>

      {/* Warning Card */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                ⚠️ Acesso Total ao Sistema
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Super Administradores têm acesso total ao sistema, incluindo todas as funcionalidades 
                de modificação no banco de dados. Use com extrema cautela.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Lista de Super Administradores ({superAdmins.length})
          </CardTitle>
          <CardDescription>
            Usuários com privilégios de Super Administrador no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {superAdmins.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhum Super Administrador</h3>
              <p className="text-muted-foreground mb-4">
                Não há Super Administradores cadastrados no sistema.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Super Admin
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {superAdmins.map((admin) => (
                <div 
                  key={admin.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-destructive/10 rounded-full">
                      <Crown className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{admin.full_name}</h4>
                        <Badge variant={admin.active ? "default" : "secondary"}>
                          {admin.active ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        CPF: {admin.cpf} • Email: {admin.email || "N/A"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        Concedido em {formatDate(admin.granted_at)}
                        {admin.granted_by_name && ` por ${admin.granted_by_name}`}
                      </div>
                      {admin.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{admin.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.active && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openRemoveDialog(admin)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Super Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Adicionar Super Administrador
            </DialogTitle>
            <DialogDescription>
              Insira o CPF da pessoa que receberá privilégios de Super Administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                maxLength={14}
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Motivo ou observações sobre a concessão..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSuperAdmin}
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {submitting ? "Adicionando..." : "Adicionar Super Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Super Admin Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remover Super Administrador
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover os privilégios de Super Administrador de{" "}
              <strong>{selectedAdmin?.full_name}</strong>?
              <br />
              <br />
              Esta ação removerá o acesso total ao sistema para este usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveSuperAdmin}
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {submitting ? "Removendo..." : "Confirmar Remoção"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}