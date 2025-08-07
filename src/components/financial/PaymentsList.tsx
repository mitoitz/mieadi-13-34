import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Printer, CreditCard, Edit, Trash2, Receipt, Loader2 } from "lucide-react";
import { receiptService } from '@/services/receipt.service';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTuitionFees, useRecordPayment, useUpdateTuitionFee, useMarkOverdueFees } from "@/hooks/useFinancial";
import { toast } from "sonner";

interface Payment {
  id: string;
  student: {
    id: string;
    name: string;
    code: string;
    congregation: string;
    avatar?: string;
  };
  type: "mensalidade" | "material" | "taxa" | "evento" | "certificado" | "outro";
  description: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: "pendente" | "pago" | "vencido" | "cancelado";
  paymentMethod?: "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "transferencia" | "boleto";
  observations?: string;
}

const mockPayments: Payment[] = [
  {
    id: "1",
    student: {
      id: "1",
      name: "João Silva",
      code: "001",
      congregation: "Central"
    },
    type: "mensalidade",
    description: "Mensalidade Janeiro 2024",
    amount: 150.00,
    dueDate: new Date("2024-01-10"),
    paymentDate: new Date("2024-01-08"),
    status: "pago",
    paymentMethod: "pix"
  },
  {
    id: "2",
    student: {
      id: "2",
      name: "Maria Santos",
      code: "002",
      congregation: "Bela Vista"
    },
    type: "mensalidade",
    description: "Mensalidade Janeiro 2024",
    amount: 150.00,
    dueDate: new Date("2024-01-10"),
    status: "vencido"
  },
  {
    id: "3",
    student: {
      id: "3",
      name: "Carlos Oliveira",
      code: "003",
      congregation: "Jardim Tropical"
    },
    type: "material",
    description: "Material Didático - Semestre 1",
    amount: 80.00,
    dueDate: new Date("2024-02-15"),
    status: "pendente"
  },
  {
    id: "4",
    student: {
      id: "4",
      name: "Ana Costa",
      code: "004",
      congregation: "Central"
    },
    type: "taxa",
    description: "Taxa de Matrícula 2024",
    amount: 200.00,
    dueDate: new Date("2024-01-05"),
    paymentDate: new Date("2024-01-03"),
    status: "pago",
    paymentMethod: "cartao_credito"
  }
];

export function PaymentsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // React Query hooks
  const { data: payments = [], isLoading, error } = useTuitionFees({
    status: statusFilter || undefined
  });
  const recordPayment = useRecordPayment();
  const updateTuitionFee = useUpdateTuitionFee();
  const markOverdueFees = useMarkOverdueFees();

  const filteredPayments = payments.filter(payment => {
    // Para dados mock, usar campos mock enquanto integração não está completa
    const studentName = 'Aluno ' + payment.student_id;
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handlePayment = async (feeId: string, paymentMethod: string) => {
    try {
      await recordPayment.mutateAsync({
        feeId,
        paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
      cancelled: "outline"
    };
    
    const labels = {
      paid: "Pago",
      pending: "Pendente",
      overdue: "Vencido",
      cancelled: "Cancelado"
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando lançamentos...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Erro ao carregar lançamentos financeiros.</p>
        </CardContent>
      </Card>
    );
  }

  const getPaymentMethodLabel = (method?: string) => {
    const labels = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      cartao_credito: "Cartão Crédito",
      cartao_debito: "Cartão Débito",
      transferencia: "Transferência",
      boleto: "Boleto"
    };
    
    return method ? labels[method as keyof typeof labels] : "-";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <CardTitle>Lançamentos Financeiros</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar aluno ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{getInitials('Aluno ' + payment.student_id)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">Aluno {payment.student_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.notes || 'Sem descrição'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {payment.payment_date ? (
                      <div className="text-sm">
                        <div>{format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                        <div className="text-muted-foreground">
                          {payment.payment_method || 'Não informado'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                    {payment.status === "paid" ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Gerar recibo"
                          onClick={() => {
                            const receiptData = {
                              id: payment.id,
                              studentName: 'Aluno ' + payment.student_id,
                              studentCode: payment.student_id,
                              amount: payment.amount,
                              description: payment.notes || '',
                              paymentDate: payment.payment_date || '',
                              paymentMethod: payment.payment_method || '',
                              dueDate: payment.due_date,
                              observations: '',
                            };
                            receiptService.generateReceipt(receiptData);
                          }}
                        >
                          <Receipt className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Registrar pagamento"
                          onClick={() => handlePayment(payment.id, 'pix')}
                          disabled={recordPayment.isPending}
                        >
                          <CreditCard className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum lançamento encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter
                ? "Tente ajustar os filtros de busca."
                : "Comece criando um novo lançamento financeiro."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}