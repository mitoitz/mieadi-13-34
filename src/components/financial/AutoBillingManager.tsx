import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { financialAutomationService, type AutoBillingRule } from "@/services/financial-automation.service";

export function AutoBillingManager() {
  const [rules, setRules] = useState<AutoBillingRule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    billing_day: 1,
    amount: 0,
    class_id: "",
    active: true
  });

  const loadRules = async () => {
    try {
      const data = await financialAutomationService.getBillingRules();
      setRules(data);
    } catch (error) {
      toast.error("Erro ao carregar regras de cobrança");
    }
  };

  const loadExecutions = async () => {
    try {
      const data = await financialAutomationService.getExecutionHistory();
      setExecutions(data);
    } catch (error) {
      toast.error("Erro ao carregar histórico de execuções");
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await financialAutomationService.createBillingRule(newRule);
      toast.success("Regra criada com sucesso!");
      setIsCreating(false);
      setNewRule({
        name: "",
        description: "",
        billing_day: 1,
        amount: 0,
        class_id: "",
        active: true
      });
      loadRules();
    } catch (error) {
      toast.error("Erro ao criar regra");
    }
  };

  const toggleRuleStatus = async (ruleId: string, active: boolean) => {
    try {
      await financialAutomationService.updateBillingRule(ruleId, { active });
      toast.success(`Regra ${active ? 'ativada' : 'desativada'} com sucesso!`);
      loadRules();
    } catch (error) {
      toast.error("Erro ao atualizar regra");
    }
  };

  const executeManualBilling = async () => {
    try {
      const executions = await financialAutomationService.executeAutoBilling();
      toast.success(`${executions.length} regras executadas com sucesso!`);
      loadExecutions();
    } catch (error) {
      toast.error("Erro ao executar cobrança automática");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Parcial</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cobrança Automática</h2>
          <p className="text-muted-foreground">
            Gerencie regras de cobrança automática e acompanhe execuções
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={executeManualBilling}>
            <Play className="h-4 w-4 mr-2" />
            Executar Agora
          </Button>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Regra de Cobrança</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Regra *</Label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Mensalidade Curso Básico"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    value={newRule.description}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada da regra"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_day">Dia da Cobrança</Label>
                    <Select 
                      value={newRule.billing_day.toString()} 
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, billing_day: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Dia {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRule.amount || ""}
                      onChange={(e) => setNewRule(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class_id">Turma (Opcional)</Label>
                  <Select 
                    value={newRule.class_id} 
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, class_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as turmas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      <SelectItem value="1">Curso Básico - Turma A</SelectItem>
                      <SelectItem value="2">Curso Avançado - Turma B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newRule.active}
                    onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, active: checked }))}
                  />
                  <Label>Regra ativa</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRule}>
                    Criar Regra
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Regras de Cobrança</TabsTrigger>
          <TabsTrigger value="executions">Histórico de Execuções</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Regras Configuradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Dia da Cobrança</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Dia {rule.billing_day}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(rule.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.active ? "default" : "secondary"}>
                          {rule.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRuleStatus(rule.id, !rule.active)}
                          >
                            {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Execuções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Regra</TableHead>
                    <TableHead>Cobranças Geradas</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution: any) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        {new Date(execution.execution_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{execution.rule?.name || 'N/A'}</TableCell>
                      <TableCell>{execution.fees_generated}</TableCell>
                      <TableCell>{formatCurrency(execution.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(execution.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}