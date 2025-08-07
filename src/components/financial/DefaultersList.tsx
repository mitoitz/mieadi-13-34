import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  DollarSign,
  Clock
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Defaulter {
  id: string;
  student: {
    id: string;
    name: string;
    code: string;
    congregation: string;
    phone: string;
    email: string;
    avatar?: string;
  };
  overdueAmount: number;
  overdueCount: number;
  daysSinceFirstOverdue: number;
  lastPaymentDate?: Date;
  totalOwed: number;
  oldestOverdueDate: Date;
  contactAttempts: number;
  lastContactDate?: Date;
}

const mockDefaulters: Defaulter[] = [
  {
    id: "1",
    student: {
      id: "2",
      name: "Maria Santos",
      code: "002",
      congregation: "Bela Vista",
      phone: "(11) 98765-4321",
      email: "maria.santos@email.com"
    },
    overdueAmount: 450.00,
    overdueCount: 3,
    daysSinceFirstOverdue: 45,
    lastPaymentDate: new Date("2023-11-15"),
    totalOwed: 450.00,
    oldestOverdueDate: new Date("2023-12-10"),
    contactAttempts: 2,
    lastContactDate: new Date("2024-01-15")
  },
  {
    id: "2",
    student: {
      id: "5",
      name: "Pedro Lima",
      code: "005",
      congregation: "Jardim Tropical",
      phone: "(11) 99888-7777",
      email: "pedro.lima@email.com"
    },
    overdueAmount: 300.00,
    overdueCount: 2,
    daysSinceFirstOverdue: 30,
    lastPaymentDate: new Date("2023-12-20"),
    totalOwed: 300.00,
    oldestOverdueDate: new Date("2024-01-10"),
    contactAttempts: 1,
    lastContactDate: new Date("2024-01-20")
  },
  {
    id: "3",
    student: {
      id: "8",
      name: "Lucas Ferreira",
      code: "008",
      congregation: "Central",
      phone: "(11) 97654-3210",
      email: "lucas.ferreira@email.com"
    },
    overdueAmount: 750.00,
    overdueCount: 5,
    daysSinceFirstOverdue: 60,
    lastPaymentDate: new Date("2023-10-25"),
    totalOwed: 750.00,
    oldestOverdueDate: new Date("2023-11-10"),
    contactAttempts: 4,
    lastContactDate: new Date("2024-01-10")
  }
];

export function DefaultersList() {
  const [defaulters] = useState<Defaulter[]>(mockDefaulters);
  const [sortBy, setSortBy] = useState("amount");
  const [filterBy, setFilterBy] = useState("all");

  const sortedDefaulters = [...defaulters].sort((a, b) => {
    switch (sortBy) {
      case "amount":
        return b.overdueAmount - a.overdueAmount;
      case "days":
        return b.daysSinceFirstOverdue - a.daysSinceFirstOverdue;
      case "count":
        return b.overdueCount - a.overdueCount;
      default:
        return 0;
    }
  });

  const filteredDefaulters = sortedDefaulters.filter(defaulter => {
    switch (filterBy) {
      case "critical":
        return defaulter.daysSinceFirstOverdue > 45 || defaulter.overdueAmount > 500;
      case "recent":
        return defaulter.daysSinceFirstOverdue <= 30;
      case "contacted":
        return defaulter.contactAttempts > 0;
      case "notContacted":
        return defaulter.contactAttempts === 0;
      default:
        return true;
    }
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSeverityBadge = (defaulter: Defaulter) => {
    if (defaulter.daysSinceFirstOverdue > 45 || defaulter.overdueAmount > 500) {
      return <Badge variant="destructive">Crítico</Badge>;
    }
    if (defaulter.daysSinceFirstOverdue > 30 || defaulter.overdueAmount > 300) {
      return <Badge variant="secondary">Alto</Badge>;
    }
    return <Badge variant="outline">Moderado</Badge>;
  };

  const handleContact = (defaulter: Defaulter, type: "phone" | "email" | "whatsapp") => {
    const messages = {
      phone: `Ligando para ${defaulter.student.name}...`,
      email: `Enviando e-mail para ${defaulter.student.name}...`,
      whatsapp: `Enviando WhatsApp para ${defaulter.student.name}...`
    };
    
    toast.info(messages[type]);
  };

  const sendBulkReminder = () => {
    toast.info("Enviando lembretes em lote...");
  };

  const exportDefaultersList = () => {
    toast.info("Exportando lista de inadimplentes...");
  };

  const totalOverdueAmount = defaulters.reduce((sum, d) => sum + d.overdueAmount, 0);
  const averageDaysOverdue = defaulters.reduce((sum, d) => sum + d.daysSinceFirstOverdue, 0) / defaulters.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inadimplentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{defaulters.length}</div>
            <div className="flex items-center mt-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600">Requer atenção</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total Vencido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOverdueAmount)}</div>
            <div className="flex items-center mt-2">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-sm text-muted-foreground">em atraso</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Dias em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageDaysOverdue)}</div>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {defaulters.filter(d => d.daysSinceFirstOverdue > 45 || d.overdueAmount > 500).length}
            </div>
            <div className="flex items-center mt-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600">alta prioridade</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Maior valor</SelectItem>
                  <SelectItem value="days">Mais dias em atraso</SelectItem>
                  <SelectItem value="count">Mais parcelas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="critical">Casos críticos</SelectItem>
                  <SelectItem value="recent">Recentes (≤30 dias)</SelectItem>
                  <SelectItem value="contacted">Já contatados</SelectItem>
                  <SelectItem value="notContacted">Não contatados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={sendBulkReminder}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Lembrete em Lote
              </Button>
              <Button variant="outline" onClick={exportDefaultersList}>
                <Calendar className="h-4 w-4 mr-2" />
                Exportar Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaulters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Inadimplentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor Vencido</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Dias em Atraso</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Último Contato</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDefaulters.map((defaulter) => (
                  <TableRow key={defaulter.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={defaulter.student.avatar} alt={defaulter.student.name} />
                          <AvatarFallback>{getInitials(defaulter.student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{defaulter.student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Cód: {defaulter.student.code} • {defaulter.student.congregation}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {defaulter.student.phone} • {defaulter.student.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-red-600">
                        {formatCurrency(defaulter.overdueAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total: {formatCurrency(defaulter.totalOwed)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {defaulter.overdueCount} parcelas
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {defaulter.daysSinceFirstOverdue} dias
                      </div>
                      <div className="text-sm text-muted-foreground">
                        desde {format(defaulter.oldestOverdueDate, "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(defaulter)}
                    </TableCell>
                    <TableCell>
                      {defaulter.lastContactDate ? (
                        <div className="text-sm">
                          <div>{format(defaulter.lastContactDate, "dd/MM/yyyy", { locale: ptBR })}</div>
                          <div className="text-muted-foreground">
                            {defaulter.contactAttempts} tentativas
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">Nunca contatado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContact(defaulter, "phone")}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContact(defaulter, "email")}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContact(defaulter, "whatsapp")}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDefaulters.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum inadimplente encontrado</h3>
              <p className="text-muted-foreground">
                {filterBy !== "all" 
                  ? "Tente ajustar os filtros aplicados."
                  : "Parabéns! Não há inadimplentes no momento."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}