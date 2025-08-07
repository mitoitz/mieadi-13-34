import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, MapPin, Users, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { congregacoesService, type Congregacao, type NovaCongregarao } from "@/services/congregacoes.service";
import { camposService } from "@/services/campos.service";

export function Congregacoes() {
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [campos, setCampos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [novaCongreg, setNovaCongreg] = useState<Partial<NovaCongregarao>>({});
  const [editandoCongreg, setEditandoCongreg] = useState<Congregacao | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [congregacoesData, camposData] = await Promise.all([
        congregacoesService.listar(),
        camposService.listar()
      ]);
      setCongregacoes(congregacoesData);
      setCampos(camposData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const congregacoesFiltradas = congregacoes.filter(cong =>
    cong.name.toLowerCase().includes(filtro.toLowerCase()) ||
    (cong.pastor_name && cong.pastor_name.toLowerCase().includes(filtro.toLowerCase())) ||
    (cong.city && cong.city.toLowerCase().includes(filtro.toLowerCase()))
  );

  const handleSalvar = async () => {
    if (!novaCongreg.name || !novaCongreg.pastor_name || !novaCongreg.address) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editandoCongreg) {
        await congregacoesService.atualizar(editandoCongreg.id, novaCongreg);
        toast({
          title: "Sucesso",
          description: "Congregação atualizada com sucesso!",
        });
      } else {
        await congregacoesService.criar(novaCongreg as NovaCongregarao);
        toast({
          title: "Sucesso",
          description: "Congregação cadastrada com sucesso!",
        });
      }
      
      await carregarDados();
      setNovaCongreg({});
      setEditandoCongreg(null);
      setDialogAberto(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a congregação",
        variant: "destructive"
      });
    }
  };

  const handleEditar = (congregacao: Congregacao) => {
    setEditandoCongreg(congregacao);
    setNovaCongreg({
      name: congregacao.name,
      address: congregacao.address,
      city: congregacao.city,
      postal_code: congregacao.postal_code,
      phone: congregacao.phone,
      pastor_name: congregacao.pastor_name,
      email: congregacao.email
    });
    setDialogAberto(true);
  };

  const handleDeletar = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta congregação?')) return;

    try {
      await congregacoesService.deletar(id);
      await carregarDados();
      toast({
        title: "Sucesso",
        description: "Congregação deletada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar a congregação",
        variant: "destructive"
      });
    }
  };

  const handleNovaCongreg = () => {
    setEditandoCongreg(null);
    setNovaCongreg({});
    setDialogAberto(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando congregações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Congregações</h1>
          <p className="text-muted-foreground">Gerencie as congregações do ministério</p>
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleNovaCongreg}>
              <Plus className="h-4 w-4" />
              Nova Congregação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editandoCongreg ? 'Editar Congregação' : 'Cadastrar Nova Congregação'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Congregação *</Label>
                <Input
                  id="nome"
                  value={novaCongreg.name || ""}
                  onChange={(e) => setNovaCongreg({...novaCongreg, name: e.target.value})}
                  placeholder="Ex: Igreja Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pastor">Pastor Responsável *</Label>
                <Input
                  id="pastor"
                  value={novaCongreg.pastor_name || ""}
                  onChange={(e) => setNovaCongreg({...novaCongreg, pastor_name: e.target.value})}
                  placeholder="Ex: Pastor João Silva"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={novaCongreg.address || ""}
                  onChange={(e) => setNovaCongreg({...novaCongreg, address: e.target.value})}
                  placeholder="Rua, número, bairro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={novaCongreg.city || ""}
                  onChange={(e) => setNovaCongreg({...novaCongreg, city: e.target.value})}
                  placeholder="Imperatriz"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={novaCongreg.postal_code || ""}
                  onChange={(e) => setNovaCongreg({...novaCongreg, postal_code: e.target.value})}
                  placeholder="00000-000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={novaCongreg.phone || ""}
                  onChange={(e) => setNovaCongreg({...novaCongreg, phone: e.target.value})}
                  placeholder="(99) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={novaCongreg.email || ""}
                  onChange={(e) => setNovaCongreg({...novaCongreg, email: e.target.value})}
                  placeholder="congregacao@exemplo.com"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar}>
                {editandoCongreg ? 'Atualizar' : 'Salvar'} Congregação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, pastor ou cidade..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Congregações */}
      <div className="grid gap-4">
        {congregacoesFiltradas.map((congregacao) => (
          <Card key={congregacao.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{congregacao.name}</h3>
                    <Badge variant="default">Ativa</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <p>{congregacao.address}</p>
                        <p>{congregacao.city} - {congregacao.postal_code}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <p><strong>{congregacao.pastor_name}</strong></p>
                        <p>{congregacao.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <div>
                        <p>{congregacao.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditar(congregacao)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeletar(congregacao.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {congregacoesFiltradas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma congregação encontrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}