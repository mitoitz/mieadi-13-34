import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportViewer, ReportActions } from "@/components/ui/report-viewer";
import { AdvancedFinancialReports } from "./AdvancedFinancialReports";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  CalendarIcon,
  DollarSign,
  Users,
  Receipt,
  Eye,
  Printer
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FinancialReport {
  period: string;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  studentCount: number;
  averagePayment: number;
  paymentRate: number;
}

interface MonthlyData {
  month: string;
  received: number;
  pending: number;
  overdue: number;
}

const mockMonthlyData: MonthlyData[] = [
  { month: "Jan 2024", received: 12500, pending: 2300, overdue: 450 },
  { month: "Fev 2024", received: 13200, pending: 1800, overdue: 320 },
  { month: "Mar 2024", received: 14100, pending: 2100, overdue: 280 },
  { month: "Abr 2024", received: 13800, pending: 1900, overdue: 180 },
  { month: "Mai 2024", received: 15250, pending: 2200, overdue: 150 },
  { month: "Jun 2024", received: 14800, pending: 1700, overdue: 200 }
];

const mockReport: FinancialReport = {
  period: "Janeiro - Junho 2024",
  totalReceived: 83650,
  totalPending: 12000,
  totalOverdue: 1580,
  studentCount: 42,
  averagePayment: 332.29,
  paymentRate: 87.5
};

export function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("last6months");
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfMonth(subMonths(new Date(), 5))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    endOfMonth(new Date())
  );
  const [reportType, setReportType] = useState("summary");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentReportContent, setCurrentReportContent] = useState<React.ReactNode>(null);

  const exportToPDF = () => {
    toast.info("Exportação para PDF em desenvolvimento");
  };

  const exportToExcel = () => {
    toast.info("Exportação para Excel em desenvolvimento");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const viewReport = () => {
    const content = (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Total Arrecadado</h4>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(mockReport.totalReceived)}
            </div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Pendente</h4>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(mockReport.totalPending)}
            </div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Vencido</h4>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(mockReport.totalOverdue)}
            </div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Taxa de Adimplência</h4>
            <div className="text-2xl font-bold text-blue-600">
              {mockReport.paymentRate}%
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold">Evolução Mensal</h4>
          {mockMonthlyData.map((month, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="font-medium">{month.month}</div>
              <div className="text-green-600">{formatCurrency(month.received)}</div>
              <div className="text-yellow-600">{formatCurrency(month.pending)}</div>
              <div className="text-red-600">{formatCurrency(month.overdue)}</div>
            </div>
          ))}
        </div>
      </div>
    );
    
    setCurrentReportContent(content);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">
            Análises detalhadas de receitas, inadimplência e tendências
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">Este mês</SelectItem>
              <SelectItem value="last3months">Últimos 3 meses</SelectItem>
              <SelectItem value="last6months">Últimos 6 meses</SelectItem>
              <SelectItem value="thisYear">Este ano</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>

          <ReportActions
            reportTitle="Relatório Financeiro"
            onView={viewReport}
            onPrint={() => {
              viewReport();
              setTimeout(() => window.print(), 500);
            }}
            onDownload={exportToPDF}
          />
        </div>
      </div>

      {/* Custom date range */}
      {selectedPeriod === "custom" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button>Aplicar Filtro</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Arrecadado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(mockReport.totalReceived)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(mockReport.totalPending)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-yellow-600 mr-1" />
              <span className="text-sm text-yellow-600">-3.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(mockReport.totalOverdue)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600">-15.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Adimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockReport.paymentRate}%
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm text-blue-600">+2.1%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="students">Por Aluno</TabsTrigger>
          <TabsTrigger value="types">Por Tipo</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Indicadores Principais</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Receita Total:</span>
                      <span className="font-medium">{formatCurrency(mockReport.totalReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket Médio:</span>
                      <span className="font-medium">{formatCurrency(mockReport.averagePayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alunos Ativos:</span>
                      <span className="font-medium">{mockReport.studentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Adimplência:</span>
                      <span className="font-medium text-green-600">{mockReport.paymentRate}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Distribuição por Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span>Pago</span>
                      </div>
                      <Badge variant="default">{formatCurrency(mockReport.totalReceived)}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span>Pendente</span>
                      </div>
                      <Badge variant="secondary">{formatCurrency(mockReport.totalPending)}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span>Vencido</span>
                      </div>
                      <Badge variant="destructive">{formatCurrency(mockReport.totalOverdue)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMonthlyData.map((month, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{month.month}</h4>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Recebido</div>
                      <div className="font-medium text-green-600">{formatCurrency(month.received)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Pendente</div>
                      <div className="font-medium text-yellow-600">{formatCurrency(month.pending)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Vencido</div>
                      <div className="font-medium text-red-600">{formatCurrency(month.overdue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório por Aluno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Relatório em desenvolvimento</h3>
                <p className="text-muted-foreground">
                  Esta funcionalidade será implementada em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório por Tipo de Cobrança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Relatório em desenvolvimento</h3>
                <p className="text-muted-foreground">
                  Esta funcionalidade será implementada em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {currentReportContent && (
        <ReportViewer
          title="Relatório Financeiro"
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        >
          {currentReportContent}
        </ReportViewer>
      )}
    </div>
  );
}