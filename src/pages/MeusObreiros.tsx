import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Users, 
  GraduationCap, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Phone,
  Mail
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

interface Obreiro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  codigo: string;
  curso: string;
  situacaoAcademica: "regular" | "pendencia" | "trancado";
  situacaoFinanceira: "em-dia" | "pendente" | "vencido";
  frequenciaMedia: number;
  notaMedia: number;
  ultimaPresenca: Date;
  valorPendente: number;
  foto?: string;
}

const mockObreiros: Obreiro[] = [
  {
    id: "1",
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(99) 99999-9999",
    codigo: "001",
    curso: "Bacharel em Teologia",
    situacaoAcademica: "regular",
    situacaoFinanceira: "em-dia",
    frequenciaMedia: 85,
    notaMedia: 8.5,
    ultimaPresenca: new Date("2024-01-15"),
    valorPendente: 0
  },
  {
    id: "2",
    nome: "Maria Santos",
    email: "maria.santos@email.com",
    telefone: "(99) 88888-8888",
    codigo: "002",
    curso: "Bacharel em Teologia",
    situacaoAcademica: "pendencia",
    situacaoFinanceira: "vencido",
    frequenciaMedia: 65,
    notaMedia: 6.8,
    ultimaPresenca: new Date("2024-01-10"),
    valorPendente: 300
  },
  {
    id: "3",
    nome: "Carlos Oliveira",
    email: "carlos.oliveira@email.com",
    telefone: "(99) 77777-7777",
    codigo: "003",
    curso: "Bacharel em Teologia",
    situacaoAcademica: "regular",
    situacaoFinanceira: "pendente",
    frequenciaMedia: 90,
    notaMedia: 9.2,
    ultimaPresenca: new Date("2024-01-14"),
    valorPendente: 150
  }
];

export function MeusObreiros() {
  const [obreiros] = useState<Obreiro[]>(mockObreiros);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const filteredObreiros = obreiros.filter(obreiro => {
    const matchesSearch = obreiro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obreiro.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obreiro.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || 
                         (statusFilter === "regulares" && obreiro.situacaoAcademica === "regular") ||
                         (statusFilter === "pendencias" && obreiro.situacaoAcademica === "pendencia") ||
                         (statusFilter === "financeiro" && obreiro.situacaoFinanceira !== "em-dia");
    
    return matchesSearch && matchesStatus;
  });

  const totalObreiros = obreiros.length;
  const obreirosRegulares = obreiros.filter(o => o.situacaoAcademica === "regular").length;
  const obreirosPendencias = obreiros.filter(o => o.situacaoAcademica === "pendencia").length;
  const obreirosInadimplentes = obreiros.filter(o => o.situacaoFinanceira !== "em-dia").length;

  const getSituacaoAcademicaBadge = (situacao: string) => {
    switch (situacao) {
      case "regular":
        return { variant: "default" as const, label: "Regular" };
      case "pendencia":
        return { variant: "destructive" as const, label: "Pendência" };
      case "trancado":
        return { variant: "secondary" as const, label: "Trancado" };
      default:
        return { variant: "secondary" as const, label: situacao };
    }
  };

  const getSituacaoFinanceiraBadge = (situacao: string) => {
    switch (situacao) {
      case "em-dia":
        return { variant: "default" as const, label: "Em Dia" };
      case "pendente":
        return { variant: "secondary" as const, label: "Pendente" };
      case "vencido":
        return { variant: "destructive" as const, label: "Vencido" };
      default:
        return { variant: "secondary" as const, label: situacao };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Meus Obreiros</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Acompanhe o desempenho dos obreiros da sua congregação</p>
        </div>
        <Button className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Cadastrar Obreiro</span>
          <span className="sm:hidden">Cadastrar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total de Obreiros"
          value={totalObreiros.toString()}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <DashboardCard
          title="Situação Regular"
          value={obreirosRegulares.toString()}
          icon={CheckCircle}
          trend={{ value: 3, isPositive: true }}
        />
        <DashboardCard
          title="Com Pendências"
          value={obreirosPendencias.toString()}
          icon={AlertTriangle}
          trend={{ value: 2, isPositive: false }}
        />
        <DashboardCard
          title="Inadimplentes"
          value={obreirosInadimplentes.toString()}
          icon={DollarSign}
          trend={{ value: 1, isPositive: false }}
        />
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="academico">Desempenho Acadêmico</TabsTrigger>
          <TabsTrigger value="financeiro">Situação Financeira</TabsTrigger>
          <TabsTrigger value="frequencia">Frequência</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Lista de Obreiros</CardTitle>
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar obreiros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredObreiros.map((obreiro) => {
                  const situacaoAcademica = getSituacaoAcademicaBadge(obreiro.situacaoAcademica);
                  const situacaoFinanceira = getSituacaoFinanceiraBadge(obreiro.situacaoFinanceira);
                  
                  return (
                    <Card key={obreiro.id} className="hover:shadow-md transition-shadow">
                       <CardContent className="p-4 sm:pt-6">
                         <div className="flex flex-col gap-4">
                           <div className="flex items-start sm:items-center gap-3">
                             <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                               <AvatarImage src={obreiro.foto} alt={obreiro.nome} />
                               <AvatarFallback className="text-xs sm:text-sm">{getInitials(obreiro.nome)}</AvatarFallback>
                             </Avatar>
                             <div className="flex-1 min-w-0">
                               <div className="font-medium text-sm sm:text-base truncate">{obreiro.nome}</div>
                               <div className="text-xs sm:text-sm text-muted-foreground">
                                 Cód: {obreiro.codigo} • {obreiro.curso}
                               </div>
                               <div className="flex items-center gap-1 mt-1">
                                 <Mail className="w-3 h-3 text-muted-foreground" />
                                 <span className="text-xs text-muted-foreground truncate">{obreiro.email}</span>
                               </div>
                             </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3 text-center">
                             <div className="space-y-1">
                               <div className="text-xs text-muted-foreground">Situação Acadêmica</div>
                               <Badge variant={situacaoAcademica.variant} className="text-xs">
                                 {situacaoAcademica.label}
                               </Badge>
                             </div>
                             <div className="space-y-1">
                               <div className="text-xs text-muted-foreground">Situação Financeira</div>
                               <Badge variant={situacaoFinanceira.variant} className="text-xs">
                                 {situacaoFinanceira.label}
                               </Badge>
                             </div>
                             <div className="space-y-1">
                               <div className="text-xs text-muted-foreground">Frequência</div>
                               <div className="text-sm font-medium">{obreiro.frequenciaMedia}%</div>
                             </div>
                             <div className="space-y-1">
                               <div className="text-xs text-muted-foreground">Nota Média</div>
                               <div className="text-sm font-medium">{obreiro.notaMedia}</div>
                             </div>
                           </div>

                           <div className="flex flex-col sm:flex-row gap-2">
                             <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                               <Phone className="w-4 h-4 sm:mr-1" />
                               <span className="hidden sm:inline ml-1">Contato</span>
                             </Button>
                             <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                               <span className="text-xs sm:text-sm">Ver Detalhes</span>
                             </Button>
                           </div>
                         </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredObreiros.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum obreiro encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Tente ajustar os filtros de busca." : "Nenhum obreiro cadastrado ainda."}
                  </p>
                  {!searchTerm && (
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Obreiro
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho Acadêmico</CardTitle>
              <p className="text-muted-foreground">
                Acompanhe as notas e aproveitamento dos seus obreiros
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Obreiro</th>
                      <th className="text-left p-4 font-medium">Curso</th>
                      <th className="text-left p-4 font-medium">Nota Média</th>
                      <th className="text-left p-4 font-medium">Situação</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obreiros.map((obreiro) => (
                      <tr key={obreiro.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={obreiro.foto} alt={obreiro.nome} />
                              <AvatarFallback>{getInitials(obreiro.nome)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{obreiro.nome}</div>
                              <div className="text-sm text-muted-foreground">Cód: {obreiro.codigo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{obreiro.curso}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{obreiro.notaMedia}</span>
                            {obreiro.notaMedia >= 8 && (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getSituacaoAcademicaBadge(obreiro.situacaoAcademica).variant}>
                            {getSituacaoAcademicaBadge(obreiro.situacaoAcademica).label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="outline" size="sm">
                            <BookOpen className="w-4 h-4 mr-1" />
                            Ver Notas
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Situação Financeira</CardTitle>
              <p className="text-muted-foreground">
                Controle os pagamentos e pendências dos seus obreiros
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {obreiros
                  .filter(o => o.situacaoFinanceira !== "em-dia")
                  .map((obreiro) => (
                    <Card key={obreiro.id} className="border-orange-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={obreiro.foto} alt={obreiro.nome} />
                              <AvatarFallback>{getInitials(obreiro.nome)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{obreiro.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                Valor pendente: {formatCurrency(obreiro.valorPendente)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSituacaoFinanceiraBadge(obreiro.situacaoFinanceira).variant}>
                              {getSituacaoFinanceiraBadge(obreiro.situacaoFinanceira).label}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Entrar em Contato
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {obreiros.filter(o => o.situacaoFinanceira !== "em-dia").length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Todos os obreiros estão em dia!</h3>
                    <p className="text-muted-foreground">
                      Nenhum obreiro possui pendências financeiras no momento.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frequencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Frequência</CardTitle>
              <p className="text-muted-foreground">
                Acompanhe a presença dos seus obreiros nas reuniões e aulas
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Obreiro</th>
                      <th className="text-left p-4 font-medium">Frequência Média</th>
                      <th className="text-left p-4 font-medium">Última Presença</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obreiros.map((obreiro) => (
                      <tr key={obreiro.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={obreiro.foto} alt={obreiro.nome} />
                              <AvatarFallback>{getInitials(obreiro.nome)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{obreiro.nome}</div>
                              <div className="text-sm text-muted-foreground">Cód: {obreiro.codigo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{obreiro.frequenciaMedia}%</span>
                            {obreiro.frequenciaMedia >= 80 ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {obreiro.ultimaPresenca.toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={obreiro.frequenciaMedia >= 80 ? "default" : "secondary"}>
                            {obreiro.frequenciaMedia >= 80 ? "Boa" : "Baixa"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="outline" size="sm">
                            <Clock className="w-4 h-4 mr-1" />
                            Ver Histórico
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}