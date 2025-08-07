import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Database, 
  Mail, 
  Bell, 
  Shield, 
  Users, 
  DollarSign, 
  Calendar,
  Globe,
  Smartphone,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Key,
  Server,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

export default function Configuracoes() {
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  const [config, setConfig] = useState({
    sistema: {
      nomeInstituicao: "Ministério de Integração Eclesiástico",
      sigla: "MIEADI",
      endereco: "Rua Principal, 123 - Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01234-567",
      telefone: "(11) 98765-4321",
      email: "contato@mieadi.org.br",
      website: "www.mieadi.org.br"
    },
    notificacoes: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      vencimentoMensalidade: 5,
      lembreteAula: 24,
      novoAluno: true,
      pagamentoRecebido: true
    },
    financeiro: {
      moeda: "BRL",
      diasVencimento: 10,
      jurosMora: 2.0,
      multaAtraso: 10.0,
      descontoPromocional: 15.0,
      formasPagamento: ["PIX", "Cartão", "Boleto", "Dinheiro"]
    },
    academico: {
      anoLetivoAtual: "2024",
      semestreAtual: "1",
      duracaoAulaPadrao: 90,
      notaMinima: 7.0,
      frequenciaMinima: 75,
      validadeCertificado: 2
    },
    seguranca: {
      sessaoExpira: 480,
      tentativasLogin: 3,
      senhaMinima: 8,
      backupAutomatico: true,
      logAuditoria: true,
      autenticacao2FA: false
    },
    integracoes: {
      biometriaEnabled: true,
      reconhecimentoFacial: false,
      apiWhatsapp: "",
      apiEmail: "",
      apiSMS: "",
      webhookUrl: ""
    }
  });

  const handleSave = async (section: string) => {
    setIsLoading(true);
    // Simular salvamento
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configurações salvas!",
        description: `As configurações de ${section} foram atualizadas com sucesso.`,
      });
    }, 1000);
  };

  const handleBackup = () => {
    toast({
      title: "Backup iniciado",
      description: "O backup do sistema foi iniciado e será processado em segundo plano.",
    });
  };

  const handleImportData = () => {
    toast({
      title: "Importação iniciada",
      description: "Os dados estão sendo importados. Você será notificado quando concluído.",
    });
  };

  const SystemConfigTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações da Instituição
          </CardTitle>
          <CardDescription>
            Configure as informações básicas da instituição
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeInstituicao">Nome da Instituição</Label>
              <Input
                id="nomeInstituicao"
                value={config.sistema.nomeInstituicao}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, nomeInstituicao: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="sigla">Sigla</Label>
              <Input
                id="sigla"
                value={config.sistema.sigla}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, sigla: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={config.sistema.endereco}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                sistema: { ...prev.sistema, endereco: e.target.value }
              }))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={config.sistema.cidade}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, cidade: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={config.sistema.estado}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, estado: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={config.sistema.cep}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, cep: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={config.sistema.telefone}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, telefone: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={config.sistema.email}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  sistema: { ...prev.sistema, email: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <Button onClick={() => handleSave("sistema")} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const NotificationsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificações
          </CardTitle>
          <CardDescription>
            Configure como e quando as notificações serão enviadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailEnabled">Notificações por E-mail</Label>
                <p className="text-sm text-muted-foreground">Enviar notificações via e-mail</p>
              </div>
              <Switch
                id="emailEnabled"
                checked={config.notificacoes.emailEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  notificacoes: { ...prev.notificacoes, emailEnabled: checked }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsEnabled">Notificações por SMS</Label>
                <p className="text-sm text-muted-foreground">Enviar notificações via SMS</p>
              </div>
              <Switch
                id="smsEnabled"
                checked={config.notificacoes.smsEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  notificacoes: { ...prev.notificacoes, smsEnabled: checked }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushEnabled">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Notificações no navegador</p>
              </div>
              <Switch
                id="pushEnabled"
                checked={config.notificacoes.pushEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  notificacoes: { ...prev.notificacoes, pushEnabled: checked }
                }))}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vencimentoMensalidade">Aviso Vencimento (dias antes)</Label>
              <Input
                id="vencimentoMensalidade"
                type="number"
                value={config.notificacoes.vencimentoMensalidade}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  notificacoes: { ...prev.notificacoes, vencimentoMensalidade: parseInt(e.target.value) }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="lembreteAula">Lembrete Aula (horas antes)</Label>
              <Input
                id="lembreteAula"
                type="number"
                value={config.notificacoes.lembreteAula}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  notificacoes: { ...prev.notificacoes, lembreteAula: parseInt(e.target.value) }
                }))}
              />
            </div>
          </div>
          
          <Button onClick={() => handleSave("notificações")} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Segurança
          </CardTitle>
          <CardDescription>
            Configure as políticas de segurança do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessaoExpira">Expiração da Sessão (minutos)</Label>
              <Input
                id="sessaoExpira"
                type="number"
                value={config.seguranca.sessaoExpira}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  seguranca: { ...prev.seguranca, sessaoExpira: parseInt(e.target.value) }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="tentativasLogin">Máximo de Tentativas de Login</Label>
              <Input
                id="tentativasLogin"
                type="number"
                value={config.seguranca.tentativasLogin}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  seguranca: { ...prev.seguranca, tentativasLogin: parseInt(e.target.value) }
                }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="senhaMinima">Tamanho Mínimo da Senha</Label>
            <Input
              id="senhaMinima"
              type="number"
              value={config.seguranca.senhaMinima}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                seguranca: { ...prev.seguranca, senhaMinima: parseInt(e.target.value) }
              }))}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="backupAutomatico">Backup Automático</Label>
                <p className="text-sm text-muted-foreground">Realizar backup diário automaticamente</p>
              </div>
              <Switch
                id="backupAutomatico"
                checked={config.seguranca.backupAutomatico}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  seguranca: { ...prev.seguranca, backupAutomatico: checked }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="logAuditoria">Log de Auditoria</Label>
                <p className="text-sm text-muted-foreground">Registrar todas as ações do sistema</p>
              </div>
              <Switch
                id="logAuditoria"
                checked={config.seguranca.logAuditoria}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  seguranca: { ...prev.seguranca, logAuditoria: checked }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autenticacao2FA">Autenticação 2FA</Label>
                <p className="text-sm text-muted-foreground">Autenticação de dois fatores</p>
              </div>
              <Switch
                id="autenticacao2FA"
                checked={config.seguranca.autenticacao2FA}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  seguranca: { ...prev.seguranca, autenticacao2FA: checked }
                }))}
              />
            </div>
          </div>
          
          <Button onClick={() => handleSave("segurança")} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const IntegrationsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Integrações e APIs
          </CardTitle>
          <CardDescription>
            Configure integrações com serviços externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="biometriaEnabled">Sistema Biométrico</Label>
                <p className="text-sm text-muted-foreground">Habilitar registro de frequência por biometria</p>
              </div>
              <Switch
                id="biometriaEnabled"
                checked={config.integracoes.biometriaEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  integracoes: { ...prev.integracoes, biometriaEnabled: checked }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reconhecimentoFacial">Reconhecimento Facial</Label>
                <p className="text-sm text-muted-foreground">Habilitar reconhecimento facial para frequência</p>
              </div>
              <Switch
                id="reconhecimentoFacial"
                checked={config.integracoes.reconhecimentoFacial}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  integracoes: { ...prev.integracoes, reconhecimentoFacial: checked }
                }))}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiWhatsapp">API WhatsApp</Label>
              <div className="relative">
                <Input
                  id="apiWhatsapp"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Token da API do WhatsApp"
                  value={config.integracoes.apiWhatsapp}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    integracoes: { ...prev.integracoes, apiWhatsapp: e.target.value }
                  }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="apiEmail">API E-mail</Label>
              <Input
                id="apiEmail"
                type={showApiKey ? "text" : "password"}
                placeholder="Chave da API de e-mail"
                value={config.integracoes.apiEmail}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  integracoes: { ...prev.integracoes, apiEmail: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://seu-webhook.com/endpoint"
                value={config.integracoes.webhookUrl}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  integracoes: { ...prev.integracoes, webhookUrl: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <Button onClick={() => handleSave("integrações")} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const DataManagementTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerenciamento de Dados
          </CardTitle>
          <CardDescription>
            Backup, restauração e manutenção dos dados do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-center space-y-3">
                <Download className="h-12 w-12 mx-auto text-primary" />
                <h3 className="font-semibold">Backup do Sistema</h3>
                <p className="text-sm text-muted-foreground">
                  Faça download de um backup completo dos dados
                </p>
                <Button onClick={handleBackup} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Backup
                </Button>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center space-y-3">
                <Upload className="h-12 w-12 mx-auto text-secondary" />
                <h3 className="font-semibold">Importar Dados</h3>
                <p className="text-sm text-muted-foreground">
                  Importe dados de planilhas ou outros sistemas
                </p>
                <Button onClick={handleImportData} variant="secondary" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Dados
                </Button>
              </div>
            </Card>
          </div>
          
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis que podem afetar permanentemente o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-destructive">Limpar Cache do Sistema</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove todos os dados em cache para melhorar performance
                  </p>
                </div>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar Cache
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-destructive">Reset Completo do Sistema</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>ATENÇÃO:</strong> Esta ação remove TODOS os dados do sistema permanentemente
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset Completo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso removerá permanentemente todos os dados do sistema, incluindo:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Todos os registros de alunos</li>
                          <li>Dados financeiros</li>
                          <li>Histórico de frequência</li>
                          <li>Configurações personalizadas</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground">
                        Sim, resetar tudo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Configure e personalize o sistema MIEADI
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <CheckCircle className="w-4 h-4 mr-2" />
          Sistema Operacional
        </Badge>
      </div>

      <Tabs defaultValue="sistema" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sistema">
          <SystemConfigTab />
        </TabsContent>
        
        <TabsContent value="notificacoes">
          <NotificationsTab />
        </TabsContent>
        
        <TabsContent value="seguranca">
          <SecurityTab />
        </TabsContent>
        
        <TabsContent value="integracoes">
          <IntegrationsTab />
        </TabsContent>
        
        <TabsContent value="dados">
          <DataManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}