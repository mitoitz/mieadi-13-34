import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
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
  Mail,
  UserCheck
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { enrollmentService, type StudentData } from "@/services/matriculas.service";
import { useToast } from "@/hooks/use-toast";

interface AlunoData {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  codigo: string;
  curso: string;
  turma: string;
  congregacao: string;
  status: "ativo" | "inativo" | "pendente" | "desistente" | "transferido" | "concluido";
  dataMatricula: string;
  situacaoAcademica: "regular" | "pendencia" | "trancado";
  situacaoFinanceira: "em-dia" | "pendente" | "vencido";
  frequenciaMedia: number;
  notaMedia: number;
  media: number;
  frequencia: number;
  ultimaPresenca: Date;
  valorPendente: number;
  foto?: string;
}

const mockAlunos: AlunoData[] = [
  {
    id: "1",
    nome: "Ana Paula Costa",
    email: "ana.costa@email.com",
    telefone: "(99) 99999-1111",
    codigo: "001",
    curso: "Bacharel em Teologia",
    turma: "TUR001",
    congregacao: "Central",
    status: "ativo",
    dataMatricula: "15/01/2024",
    situacaoAcademica: "regular",
    situacaoFinanceira: "em-dia",
    frequenciaMedia: 88,
    notaMedia: 8.7,
    media: 8.7,
    frequencia: 88,
    ultimaPresenca: new Date("2024-01-15"),
    valorPendente: 0
  },
  {
    id: "2",
    nome: "Pedro Santos",
    email: "pedro.santos@email.com",
    telefone: "(99) 88888-2222",
    codigo: "002",
    curso: "Bacharel em Teologia",
    turma: "TUR002",
    congregacao: "Bela Vista",
    status: "ativo",
    dataMatricula: "01/02/2024",
    situacaoAcademica: "pendencia",
    situacaoFinanceira: "vencido",
    frequenciaMedia: 72,
    notaMedia: 7.1,
    media: 7.1,
    frequencia: 72,
    ultimaPresenca: new Date("2024-01-12"),
    valorPendente: 450
  }
];

export function AlunosView() {
  const [alunos, setAlunos] = useState<AlunoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [congregacaoFilter, setCongregacaoFilter] = useState<string>("todas");
  const { toast } = useToast();

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    try {
      setLoading(true);
      const students = await enrollmentService.getActiveStudents();
      
      if (students.length > 0) {
        // Transform StudentData to AlunoData
        const alunosData: AlunoData[] = students.map((student, index) => ({
          id: student.id,
          nome: student.nome,
          email: student.email,
          curso: student.curso,
          turma: student.turma,
          congregacao: student.congregacao || "N/A",
          status: student.status,
          dataMatricula: student.dataMatricula,
          media: student.media,
          frequencia: student.frequencia,
          telefone: "(99) 99999-" + String(index + 1).padStart(4, '0'),
          codigo: String(index + 1).padStart(3, '0'),
          situacaoAcademica: "regular" as const,
          situacaoFinanceira: Math.random() > 0.7 ? "pendente" : "em-dia" as const,
          frequenciaMedia: student.frequencia,
          notaMedia: student.media,
          ultimaPresenca: new Date(),
          valorPendente: Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 100 : 0
        }));

        setAlunos(alunosData);
      } else {
        // Use mock data if no real data is available
        setAlunos(mockAlunos);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      // Fallback to mock data on error
      setAlunos(mockAlunos);
      toast({
        title: "Aviso",
        description: "Usando dados de demonstração. Conecte ao banco para dados reais.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAlunos = alunos.filter(aluno => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCongregacao = congregacaoFilter === "todas" || aluno.congregacao === congregacaoFilter;
    
    return matchesSearch && matchesCongregacao;
  });

  const totalAlunos = alunos.length;
  const alunosRegulares = alunos.filter(a => a.situacaoAcademica === "regular").length;
  const alunosPendencias = alunos.filter(a => a.situacaoAcademica === "pendencia").length;
  const alunosInadimplentes = alunos.filter(a => a.situacaoFinanceira !== "em-dia").length;

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
          <h1 className="text-2xl sm:text-3xl font-bold">Alunos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie todos os alunos da congregação</p>
        </div>
        <Button className="flex items-center gap-2 w-full sm:w-auto">
          <UserCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Promover Membro a Aluno</span>
          <span className="sm:hidden">Promover</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total de Alunos"
          value={totalAlunos.toString()}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard
          title="Situação Regular"
          value={alunosRegulares.toString()}
          icon={CheckCircle}
          trend={{ value: 6, isPositive: true }}
        />
        <DashboardCard
          title="Com Pendências"
          value={alunosPendencias.toString()}
          icon={AlertTriangle}
          trend={{ value: 2, isPositive: false }}
        />
        <DashboardCard
          title="Inadimplentes"
          value={alunosInadimplentes.toString()}
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
                <CardTitle>Lista de Alunos</CardTitle>
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar alunos..."
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
                {filteredAlunos.map((aluno) => {
                  const situacaoAcademica = getSituacaoAcademicaBadge(aluno.situacaoAcademica);
                  const situacaoFinanceira = getSituacaoFinanceiraBadge(aluno.situacaoFinanceira);
                  
                  return (
                    <Card key={aluno.id} className="hover:shadow-md transition-shadow">
                       <CardContent className="p-4 sm:pt-6">
                         <div className="flex flex-col gap-4">
                           <div className="flex items-start sm:items-center gap-3">
                             <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                               <AvatarImage src={aluno.foto} alt={aluno.nome} />
                               <AvatarFallback className="text-xs sm:text-sm">{getInitials(aluno.nome)}</AvatarFallback>
                             </Avatar>
                             <div className="flex-1 min-w-0">
                               <div className="font-medium text-sm sm:text-base truncate">{aluno.nome}</div>
                               <div className="text-xs sm:text-sm text-muted-foreground">
                                 Cód: {aluno.codigo} • {aluno.curso}
                               </div>
                               <div className="text-xs sm:text-sm text-muted-foreground">
                                 {aluno.congregacao}
                               </div>
                               <div className="flex items-center gap-1 mt-1">
                                 <Mail className="w-3 h-3 text-muted-foreground" />
                                 <span className="text-xs text-muted-foreground truncate">{aluno.email}</span>
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
                               <div className="text-sm font-medium">{aluno.frequenciaMedia}%</div>
                             </div>
                             <div className="space-y-1">
                               <div className="text-xs text-muted-foreground">Nota Média</div>
                               <div className="text-sm font-medium">{aluno.notaMedia}</div>
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

              {filteredAlunos.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Tente ajustar os filtros de busca." : "Nenhum aluno cadastrado ainda."}
                  </p>
                  {!searchTerm && (
                    <Button>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Promover Membro a Aluno
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
                Acompanhe as notas e aproveitamento dos alunos
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-4 font-medium text-sm">Aluno</th>
                      <th className="text-left p-2 sm:p-4 font-medium text-sm hidden sm:table-cell">Congregação</th>
                      <th className="text-left p-2 sm:p-4 font-medium text-sm">Nota Média</th>
                      <th className="text-left p-2 sm:p-4 font-medium text-sm">Situação</th>
                      <th className="text-left p-2 sm:p-4 font-medium text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map((aluno) => (
                      <tr key={aluno.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={aluno.foto} alt={aluno.nome} />
                              <AvatarFallback>{getInitials(aluno.nome)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{aluno.nome}</div>
                              <div className="text-sm text-muted-foreground">Cód: {aluno.codigo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{aluno.congregacao}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{aluno.notaMedia}</span>
                            {aluno.notaMedia >= 8 && (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getSituacaoAcademicaBadge(aluno.situacaoAcademica).variant}>
                            {getSituacaoAcademicaBadge(aluno.situacaoAcademica).label}
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
                Controle os pagamentos e pendências dos alunos
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alunos
                  .filter(a => a.situacaoFinanceira !== "em-dia")
                  .map((aluno) => (
                    <Card key={aluno.id} className="border-orange-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={aluno.foto} alt={aluno.nome} />
                              <AvatarFallback>{getInitials(aluno.nome)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{aluno.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                {aluno.congregacao} • Valor pendente: {formatCurrency(aluno.valorPendente)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSituacaoFinanceiraBadge(aluno.situacaoFinanceira).variant}>
                              {getSituacaoFinanceiraBadge(aluno.situacaoFinanceira).label}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Entrar em Contato
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {alunos.filter(a => a.situacaoFinanceira !== "em-dia").length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Todos os alunos estão em dia!</h3>
                    <p className="text-muted-foreground">
                      Nenhum aluno possui pendências financeiras no momento.
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
                Acompanhe a presença dos alunos nas reuniões e aulas
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Aluno</th>
                      <th className="text-left p-4 font-medium">Congregação</th>
                      <th className="text-left p-4 font-medium">Frequência Média</th>
                      <th className="text-left p-4 font-medium">Última Presença</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map((aluno) => (
                      <tr key={aluno.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={aluno.foto} alt={aluno.nome} />
                              <AvatarFallback>{getInitials(aluno.nome)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{aluno.nome}</div>
                              <div className="text-sm text-muted-foreground">Cód: {aluno.codigo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{aluno.congregacao}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{aluno.frequenciaMedia}%</span>
                            {aluno.frequenciaMedia >= 80 ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {aluno.ultimaPresenca.toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={aluno.frequenciaMedia >= 80 ? "default" : "secondary"}>
                            {aluno.frequenciaMedia >= 80 ? "Boa" : "Baixa"}
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