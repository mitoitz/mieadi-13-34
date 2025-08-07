import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RelatorioAcompanhamento } from "@/components/pastor/RelatorioAcompanhamento";
import { Users, Church, Calendar, BookOpen, UserCheck, FileText, Clock, Heart, MapPin, Phone, Mail, Award, GraduationCap, TrendingUp, UserPlus, Star, BarChart3, QrCode } from "lucide-react";
import { QRCodeManager } from "@/components/profile/QRCodeManager";
interface PastorDashboardProps {
  user: {
    id: string;
    name: string;
    userType: string;
    congregacao?: string;
  };
}
export function PastorDashboard({
  user
}: PastorDashboardProps) {
  const {
    toast
  } = useToast();
  const [showIndicationDialog, setShowIndicationDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [profileData, setProfileData] = useState<any>({
    id: user.id,
    qr_code: null
  });
  const [indication, setIndication] = useState({
    member: "",
    course: "",
    justification: "",
    priority: "normal"
  });

  // Mock data para o dashboard do pastor
  const stats = [{
    title: "Obreiros Ativos",
    value: "24",
    description: "Membros em ministérios",
    icon: Users,
    color: "text-blue-600"
  }, {
    title: "Membros da Congregação",
    value: "156",
    description: "Total de membros",
    icon: Church,
    color: "text-green-600"
  }, {
    title: "Atividades do Mês",
    value: "12",
    description: "Cultos e eventos",
    icon: Calendar,
    color: "text-purple-600"
  }, {
    title: "Estudos Bíblicos",
    value: "8",
    description: "Classes ativas",
    icon: BookOpen,
    color: "text-orange-600"
  }];
  const obreiros = [{
    nome: "Maria Silva",
    cargo: "Secretária",
    telefone: "(11) 99999-9999",
    status: "Ativo"
  }, {
    nome: "João Santos",
    cargo: "Tesoureiro",
    telefone: "(11) 98888-8888",
    status: "Ativo"
  }, {
    nome: "Ana Costa",
    cargo: "Líder de Louvor",
    telefone: "(11) 97777-7777",
    status: "Ativo"
  }, {
    nome: "Pedro Lima",
    cargo: "Diácono",
    telefone: "(11) 96666-6666",
    status: "Ativo"
  }];
  const proximasAtividades = [{
    data: "2024-01-20",
    hora: "19:00",
    atividade: "Culto de Doutrina",
    local: "Santuário Principal"
  }, {
    data: "2024-01-22",
    hora: "20:00",
    atividade: "Ensaio do Coral",
    local: "Sala de Música"
  }, {
    data: "2024-01-24",
    hora: "19:30",
    atividade: "Estudo Bíblico",
    local: "Sala 1"
  }, {
    data: "2024-01-26",
    hora: "18:00",
    atividade: "Reunião de Obreiros",
    local: "Sala Pastoral"
  }];
  const ministerios = [{
    nome: "Ministério de Louvor",
    responsavel: "Ana Costa",
    membros: 8
  }, {
    nome: "Ministério Infantil",
    responsavel: "Carla Souza",
    membros: 12
  }, {
    nome: "Ministério de Jovens",
    responsavel: "Rafael Oliveira",
    membros: 18
  }, {
    nome: "Ministério de Casais",
    responsavel: "Roberto e Maria",
    membros: 24
  }];

  // Dados do curso pastoral
  const cursoData = {
    nome: "Curso de Capacitação Pastoral",
    modalidade: "Presencial",
    periodo: "2024",
    cargaHoraria: "80 horas",
    status: "Em andamento",
    progresso: 65,
    inicio: "15/03/2024",
    previsaoTermino: "15/12/2024"
  };

  // Obreiros matriculados no curso
  const obreirosNoCurso = [{
    nome: "Maria Silva",
    cargo: "Secretária",
    progresso: 85,
    media: 9.2,
    frequencia: 95,
    status: "Excelente",
    ultimaAula: "10/01/2024",
    proximaAvaliacao: "25/01/2024"
  }, {
    nome: "João Santos",
    cargo: "Tesoureiro",
    progresso: 70,
    media: 8.5,
    frequencia: 88,
    status: "Bom",
    ultimaAula: "10/01/2024",
    proximaAvaliacao: "25/01/2024"
  }, {
    nome: "Ana Costa",
    cargo: "Líder de Louvor",
    progresso: 90,
    media: 9.5,
    frequencia: 100,
    status: "Excelente",
    ultimaAula: "10/01/2024",
    proximaAvaliacao: "25/01/2024"
  }, {
    nome: "Pedro Lima",
    cargo: "Diácono",
    progresso: 60,
    media: 7.8,
    frequencia: 82,
    status: "Regular",
    ultimaAula: "08/01/2024",
    proximaAvaliacao: "25/01/2024"
  }];

  // Membros disponíveis para indicação
  const membrosDisponiveis = [{
    id: "1",
    nome: "Carlos Pereira",
    cargo: "Membro",
    tempo: "3 anos"
  }, {
    id: "2",
    nome: "Lucia Santos",
    cargo: "Membro",
    tempo: "2 anos"
  }, {
    id: "3",
    nome: "Roberto Silva",
    cargo: "Membro",
    tempo: "5 anos"
  }, {
    id: "4",
    nome: "Patricia Costa",
    cargo: "Membro",
    tempo: "4 anos"
  }];
  const cursosDisponiveis = [{
    id: "1",
    nome: "Curso de Capacitação Pastoral"
  }, {
    id: "2",
    nome: "Curso de Liderança Cristã"
  }, {
    id: "3",
    nome: "Curso de Evangelismo"
  }];
  const handleIndicateMember = () => {
    toast({
      title: "Indicação enviada!",
      description: `${indication.member} foi indicado para o curso com sucesso.`
    });
    setShowIndicationDialog(false);
    setIndication({
      member: "",
      course: "",
      justification: "",
      priority: "normal"
    });
  };
  return <div className="space-y-6 p-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => <Card key={index} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>)}
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="obreiros" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="obreiros">Obreiros</TabsTrigger>
          <TabsTrigger value="curso" className="mx-[16px] px-px">Curso</TabsTrigger>
          <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
          <TabsTrigger value="indicacoes">Indicações</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="congregacao">Congregação</TabsTrigger>
          <TabsTrigger value="ministerios">Ministérios</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="obreiros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Meus Obreiros
              </CardTitle>
              <CardDescription>
                Gerencie os obreiros da sua congregação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {obreiros.map((obreiro, index) => <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${obreiro.nome}`} />
                        <AvatarFallback>{obreiro.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{obreiro.nome}</p>
                        <p className="text-sm text-muted-foreground">{obreiro.cargo}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {obreiro.telefone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600">
                        {obreiro.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Contatar
                      </Button>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curso" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Dados do Curso
              </CardTitle>
              <CardDescription>
                Informações sobre o curso pastoral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Nome do Curso</h4>
                    <p className="text-sm text-muted-foreground">{cursoData.nome}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Modalidade</h4>
                    <p className="text-sm text-muted-foreground">{cursoData.modalidade}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Período</h4>
                    <p className="text-sm text-muted-foreground">{cursoData.periodo}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Carga Horária</h4>
                    <p className="text-sm text-muted-foreground">{cursoData.cargaHoraria}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Status</h4>
                    <Badge className="bg-green-100 text-green-800">{cursoData.status}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium">Progresso Geral</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{
                        width: `${cursoData.progresso}%`
                      }}></div>
                      </div>
                      <span className="text-sm font-medium">{cursoData.progresso}%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Data de Início</h4>
                    <p className="text-sm text-muted-foreground">{cursoData.inicio}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Previsão de Término</h4>
                    <p className="text-sm text-muted-foreground">{cursoData.previsaoTermino}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acompanhamento" className="space-y-4">
          <RelatorioAcompanhamento obreiros={obreirosNoCurso} />
        </TabsContent>

        <TabsContent value="indicacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Indicação de Membros para Cursos
              </CardTitle>
              <CardDescription>
                Indique membros da congregação para participar dos cursos disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Membros Disponíveis para Indicação</h4>
                  <Dialog open={showIndicationDialog} onOpenChange={setShowIndicationDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Nova Indicação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Indicar Membro para Curso</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para indicar um membro da congregação para um curso.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="member">Selecionar Membro</Label>
                          <Select value={indication.member} onValueChange={value => setIndication({
                          ...indication,
                          member: value
                        })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha um membro" />
                            </SelectTrigger>
                            <SelectContent>
                              {membrosDisponiveis.map(membro => <SelectItem key={membro.id} value={membro.nome}>
                                  {membro.nome} - {membro.cargo} ({membro.tempo})
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="course">Selecionar Curso</Label>
                          <Select value={indication.course} onValueChange={value => setIndication({
                          ...indication,
                          course: value
                        })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha um curso" />
                            </SelectTrigger>
                            <SelectContent>
                              {cursosDisponiveis.map(curso => <SelectItem key={curso.id} value={curso.nome}>
                                  {curso.nome}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="priority">Prioridade</Label>
                          <Select value={indication.priority} onValueChange={value => setIndication({
                          ...indication,
                          priority: value
                        })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="baixa">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="justification">Justificativa da Indicação</Label>
                          <Textarea id="justification" placeholder="Descreva os motivos da indicação..." value={indication.justification} onChange={e => setIndication({
                          ...indication,
                          justification: e.target.value
                        })} />
                        </div>
                        
                        <Button onClick={handleIndicateMember} className="w-full" disabled={!indication.member || !indication.course || !indication.justification}>
                          Enviar Indicação
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {membrosDisponiveis.map((membro, index) => <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{membro.nome}</p>
                          <p className="text-sm text-muted-foreground">{membro.cargo}</p>
                          <p className="text-sm text-muted-foreground">Na congregação há {membro.tempo}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                      setIndication({
                        ...indication,
                        member: membro.nome
                      });
                      setShowIndicationDialog(true);
                    }}>
                          Indicar
                        </Button>
                      </div>
                    </div>)}
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
              <CardDescription>
                Use este QR Code para marcar sua presença em eventos e cultos
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="congregacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="h-5 w-5" />
                Informações da Congregação
              </CardTitle>
              <CardDescription>
                Dados gerais da congregação {user.congregacao}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Localização
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Rua das Flores, 123 - Centro<br />
                      São Paulo - SP, 01234-567
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contato
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      (11) 1234-5678<br />
                      WhatsApp: (11) 99999-9999
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      contato@{user.congregacao?.toLowerCase().replace(' ', '')}.org.br
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horários de Culto
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Domingo: 9h e 19h<br />
                      Quarta: 20h<br />
                      Sexta: 20h
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atividades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Atividades
              </CardTitle>
              <CardDescription>
                Agenda de cultos e eventos da congregação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proximasAtividades.map((atividade, index) => <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{atividade.atividade}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(atividade.data).toLocaleDateString('pt-BR')} às {atividade.hora}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {atividade.local}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ministerios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Ministérios Ativos
              </CardTitle>
              <CardDescription>
                Ministérios da congregação e seus responsáveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {ministerios.map((ministerio, index) => <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h4 className="font-medium">{ministerio.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        Responsável: {ministerio.responsavel}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ministerio.membros} membros</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Gerenciar
                      </Button>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatórios Pastorais
              </CardTitle>
              <CardDescription>
                Relatórios e estatísticas da congregação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  Relatório de Membros
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <UserCheck className="h-6 w-6" />
                  Frequência de Cultos
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Heart className="h-6 w-6" />
                  Atividades dos Ministérios
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Award className="h-6 w-6" />
                  Crescimento da Igreja
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
}