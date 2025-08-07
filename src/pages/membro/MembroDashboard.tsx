import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Calendar, 
  Church, 
  Heart, 
  Award,
  FileText,
  Users,
  Settings,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  QrCode
} from "lucide-react";
import { QRCodeManager } from "@/components/profile/QRCodeManager";
import { useToast } from "@/hooks/use-toast";

interface MembroDashboardProps {
  user: {
    id: string;
    name: string;
    userType: string;
  };
}

export function MembroDashboard({ user }: MembroDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("perfil");
  const [dadosMembro, setDadosMembro] = useState<any>({});
  const [atividades, setAtividades] = useState<any[]>([]);
  const [ministerios, setMinisterios] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDadosMembro();
  }, [user.id]);

  const loadDadosMembro = async () => {
    try {
      // Simular dados do membro
      const membroMock = {
        id: user.id,
        nome: user.name,
        email: "membro@igreja.com",
        telefone: "(11) 99999-9999",
        endereco: "Rua das Flores, 123 - São Paulo, SP",
        dataNascimento: "1985-05-15",
        dataMembresia: "2010-03-20",
        congregacao: "Igreja Central",
        estadoCivil: "Casado",
        profissao: "Engenheiro"
      };

      const atividadesMock = [
        {
          id: '1',
          nome: 'Culto Dominical',
          data: '2024-01-21T10:00:00',
          tipo: 'Culto',
          local: 'Templo Principal'
        },
        {
          id: '2',
          nome: 'Estudo Bíblico',
          data: '2024-01-24T19:30:00',
          tipo: 'Estudo',
          local: 'Sala 1'
        },
        {
          id: '3',
          nome: 'Reunião de Oração',
          data: '2024-01-26T20:00:00',
          tipo: 'Oração',
          local: 'Templo Principal'
        }
      ];

      const ministeriosMock = [
        {
          id: '1',
          nome: 'Ministério de Louvor',
          cargo: 'Corista',
          dataInicio: '2015-06-01',
          status: 'Ativo'
        },
        {
          id: '2',
          nome: 'Escola Dominical',
          cargo: 'Professor',
          dataInicio: '2018-02-15',
          status: 'Ativo'
        }
      ];

      setDadosMembro(membroMock);
      setAtividades(atividadesMock);
      setMinisterios(ministeriosMock);
      
      // Simular dados do perfil para o QR Code
      setProfileData({
        id: user.id,
        qr_code: null // Será gerado pelo QRCodeManager se necessário
      });
      
    } catch (error) {
      console.error('Error loading member data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do membro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const editarPerfil = () => {
    toast({
      title: "Editando Perfil",
      description: "Redirecionando para edição de perfil"
    });
  };

  const confirmarPresenca = (atividade: any) => {
    toast({
      title: "Presença Confirmada",
      description: `Sua presença em ${atividade.nome} foi confirmada`
    });
  };

  const anosMembresia = new Date().getFullYear() - new Date(dadosMembro.dataMembresia).getFullYear();
  const proximasAtividades = atividades.filter(a => new Date(a.data) > new Date()).length;

  const stats = {
    anosMembresia,
    ministeriosAtivos: ministerios.filter(m => m.status === 'Ativo').length,
    proximasAtividades,
    congregacao: dadosMembro.congregacao
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel do membro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Bem-vindo, <span className="font-medium text-foreground">{dadosMembro.nome}</span> - Membro da {stats.congregacao}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
            <Heart className="h-4 w-4 mr-2" />
            Membro
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Anos de Membresia</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.anosMembresia}</div>
            <p className="text-xs text-muted-foreground mt-1">Desde {new Date(dadosMembro.dataMembresia).getFullYear()}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ministérios Ativos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.ministeriosAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1">Servindo atualmente</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximas Atividades</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
              <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.proximasAtividades}</div>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </CardContent>
        </Card>

        <Card className="hover-scale group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Congregação</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
              <Church className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.congregacao}</div>
            <p className="text-xs text-muted-foreground mt-1">Sua congregação</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-12">
            <TabsTrigger value="perfil" className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Meu Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="atividades" className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Atividades</span>
            </TabsTrigger>
            <TabsTrigger value="ministerios" className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Ministérios</span>
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="flex items-center gap-2 text-sm">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Meu QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Seus dados pessoais e informações de contato
                  </CardDescription>
                </div>
                <Button onClick={editarPerfil} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nome Completo</p>
                      <p className="font-medium">{dadosMembro.nome}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{dadosMembro.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{dadosMembro.telefone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{dadosMembro.endereco}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">{new Date(dadosMembro.dataNascimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Church className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data da Membresia</p>
                      <p className="font-medium">{new Date(dadosMembro.dataMembresia).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Estado Civil</p>
                      <p className="font-medium">{dadosMembro.estadoCivil}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Profissão</p>
                      <p className="font-medium">{dadosMembro.profissao}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atividades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Atividades</CardTitle>
              <CardDescription>
                Confirme sua presença nas atividades da igreja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {atividades.map((atividade) => (
                  <Card key={atividade.id} className="hover-scale">
                    <CardContent className="flex justify-between items-center p-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{atividade.nome}</h3>
                          <Badge variant="outline">{atividade.tipo}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(atividade.data).toLocaleDateString('pt-BR')} às {new Date(atividade.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-muted-foreground">Local: {atividade.local}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => confirmarPresenca(atividade)}
                      >
                        Confirmar Presença
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ministerios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meus Ministérios</CardTitle>
              <CardDescription>
                Ministérios e cargos que você exerce na igreja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ministerios.map((ministerio) => (
                  <Card key={ministerio.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{ministerio.nome}</h3>
                            <Badge variant={ministerio.status === 'Ativo' ? 'default' : 'secondary'}>
                              {ministerio.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Cargo: {ministerio.cargo}</p>
                          <p className="text-xs text-muted-foreground">
                            Desde: {new Date(ministerio.dataInicio).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Award className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              <CardDescription>
                Use este QR Code para marcar sua presença em eventos e cultos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <QRCodeManager 
                  userId={user.id}
                  userQRCode={profileData.qr_code}
                  onQRCodeGenerated={(qrCode) => {
                    setProfileData({...profileData, qr_code: qrCode});
                    toast({
                      title: "QR Code atualizado!",
                      description: "Seu QR Code foi gerado com sucesso."
                    });
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Carregando QR Code</h3>
                  <p className="text-muted-foreground">Aguarde enquanto carregamos seus dados...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos e Certificados</CardTitle>
              <CardDescription>
                Acesse seus documentos e certificados da igreja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Documentos Disponíveis</h3>
                <p className="text-muted-foreground mb-4">
                  Seus certificados e documentos estarão disponíveis aqui
                </p>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Solicitar Documento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}