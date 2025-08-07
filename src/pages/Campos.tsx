import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, MapPin, Users, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Campo, type NovoCampo } from "@/services/campos.service";
import { useCampos, useCreateCampo, useUpdateCampo, useDeleteCampo } from "@/hooks/useCampos";
import { usePessoas } from "@/hooks/usePessoas";

export function Campos() {
  const [buscaPastor, setBuscaPastor] = useState("");
  const [filtro, setFiltro] = useState("");
  const [novoCampo, setNovoCampo] = useState<Partial<NovoCampo>>({});
  const [editandoCampo, setEditandoCampo] = useState<Campo | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const { toast } = useToast();

  // Hooks para gerenciar dados
  const { data: campos = [], isLoading: loadingCampos } = useCampos();
  const { data: pessoas = [], isLoading: loadingPessoas } = usePessoas();
  const createCampo = useCreateCampo();
  const updateCampo = useUpdateCampo();
  const deleteCampo = useDeleteCampo();

  // Filtrar apenas pastores das pessoas
  const pastores = pessoas.filter(pessoa => pessoa.role === 'pastor');
  const loading = loadingCampos || loadingPessoas;

  const camposFiltrados = campos.filter(campo =>
    campo.name.toLowerCase().includes(filtro.toLowerCase()) ||
    (campo.description && campo.description.toLowerCase().includes(filtro.toLowerCase()))
  );

  const handleSalvar = async () => {
    if (!novoCampo.name) {
      toast({
        title: "Erro",
        description: "Nome do campo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editandoCampo) {
        await updateCampo.mutateAsync({ id: editandoCampo.id, data: novoCampo });
      } else {
        await createCampo.mutateAsync(novoCampo as NovoCampo);
      }
      
      setNovoCampo({});
      setEditandoCampo(null);
      setDialogAberto(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      // O toast de erro já é exibido pelo hook
    }
  };

  const handleEditar = (campo: Campo) => {
    setEditandoCampo(campo);
    setNovoCampo({
      name: campo.name,
      description: campo.description,
      responsible_id: campo.responsible_id
    });
    setDialogAberto(true);
  };

  const handleDeletar = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este campo?')) return;

    try {
      await deleteCampo.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      // O toast de erro já é exibido pelo hook
    }
  };

  const handleNovoCampo = () => {
    setEditandoCampo(null);
    setNovoCampo({});
    setDialogAberto(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando campos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campos</h1>
          <p className="text-muted-foreground">Gerencie os campos ministeriais</p>
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleNovoCampo}>
              <Plus className="h-4 w-4" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editandoCampo ? 'Editar Campo' : 'Cadastrar Novo Campo'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Campo *</Label>
                <Input
                  id="nome"
                  value={novoCampo.name || ""}
                  onChange={(e) => setNovoCampo({...novoCampo, name: e.target.value})}
                  placeholder="Ex: Campo Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsavel">Pastor Responsável</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar pastor por nome..."
                    value={buscaPastor}
                    onChange={(e) => setBuscaPastor(e.target.value)}
                    className="w-full"
                  />
                  <Select 
                    value={novoCampo.responsible_id || ""} 
                    onValueChange={(valor) => setNovoCampo({...novoCampo, responsible_id: valor})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o pastor responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {pastores
                        .filter(pastor => 
                          pastor.full_name.toLowerCase().includes(buscaPastor.toLowerCase())
                        )
                        .map((pastor) => (
                        <SelectItem key={pastor.id} value={pastor.id}>
                          {pastor.full_name} - {pastor.badge_number || 'S/N'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={novoCampo.description || ""}
                  onChange={(e) => setNovoCampo({...novoCampo, description: e.target.value})}
                  placeholder="Descrição do campo"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar}>
                {editandoCampo ? 'Atualizar' : 'Salvar'} Campo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Campos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{campos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {campos.filter(c => c.responsible_id).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{campos.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Campos */}
      <div className="grid gap-4">
        {camposFiltrados.map((campo) => (
          <Card key={campo.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{campo.name}</h3>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {pastores.find(p => p.id === campo.responsible_id)?.full_name || "Sem responsável"}
                        </p>
                        <p className="text-muted-foreground">responsável</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Campo Ministerial</p>
                        <p className="text-muted-foreground">tipo</p>
                      </div>
                    </div>
                  </div>
                  
                  {campo.description && (
                    <p className="text-sm text-muted-foreground">
                      {campo.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditar({ ...campo, profiles: undefined } as Campo)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeletar(campo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {camposFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum campo encontrado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}