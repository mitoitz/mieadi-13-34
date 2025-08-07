import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Loader2
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { PaymentForm } from "./PaymentForm";
import { PaymentsList } from "./PaymentsList";
import { FinancialReports } from "./FinancialReports";
import { DefaultersList } from "./DefaultersList";
import { AutoBillingManager } from "./AutoBillingManager";
import { useFinancialSummary } from "@/hooks/useFinancial";

interface FinancialDashboardProps {
  userType: string;
}

export function FinancialDashboard({ userType }: FinancialDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Using React Query hook
  const { data: summary, isLoading, error, refetch } = useFinancialSummary();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPaymentRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Erro ao carregar dados financeiros</p>
          <Button onClick={() => refetch()} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Controle completo das finanças do MIEADI
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Receipt className="h-4 w-4 mr-2" />
            Gerar Recibo
          </Button>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Recebido"
          value={formatCurrency(summary.totalReceived)}
          icon={CheckCircle}
          trend={{ value: 12.5, isPositive: true }}
          className="border-green-200 bg-green-50 dark:bg-green-950/20"
        />
        
        <DashboardCard
          title="Total Pendente"
          value={formatCurrency(summary.totalPending)}
          icon={Clock}
          trend={{ value: -3.2, isPositive: false }}
          className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
        />
        
        <DashboardCard
          title="Total Vencido"
          value={formatCurrency(summary.totalOverdue)}
          icon={AlertTriangle}
          trend={{ value: -8.1, isPositive: false }}
          className="border-red-200 bg-red-50 dark:bg-red-950/20"
        />
        
        <DashboardCard
          title="Receita Mensal"
          value={formatCurrency(summary.monthlyRevenue || 0)}
          icon={TrendingUp}
          trend={{ value: 15.8, isPositive: true }}
          className="border-blue-200 bg-blue-50 dark:bg-blue-950/20"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPaymentRateColor(85.2)}`}>
              85.2%
            </div>
            <div className="flex items-center mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `85.2%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.studentsWithPendingPayments}</div>
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                estudantes matriculados
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(365.50)}</div>
            <div className="flex items-center gap-2 mt-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                por estudante/mês
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="defaulters">Inadimplentes</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PaymentsList />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PaymentForm onSuccess={() => refetch()} />
            </div>
            <div className="lg:col-span-2">
              <PaymentsList />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="defaulters" className="space-y-4">
          <DefaultersList />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <AutoBillingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}