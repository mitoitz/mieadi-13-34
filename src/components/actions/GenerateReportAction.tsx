import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Calendar as CalendarIcon, FileText, Users, GraduationCap, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { feedback } from "@/components/ui/feedback";

interface GenerateReportActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateReportAction({ isOpen, onClose, onSuccess }: GenerateReportActionProps) {
  const [reportType, setReportType] = useState("");
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [includeGraphics, setIncludeGraphics] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [reportFormat, setReportFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      value: "students",
      label: "Relatório de Alunos",
      description: "Listagem e estatísticas de alunos",
      icon: Users
    },
    {
      value: "classes",
      label: "Relatório de Turmas",
      description: "Informações sobre turmas e matrículas",
      icon: GraduationCap
    },
    {
      value: "attendance",
      label: "Relatório de Frequência",
      description: "Controle de presença por turma/aluno",
      icon: FileText
    },
    {
      value: "financial",
      label: "Relatório Financeiro",
      description: "Pagamentos, inadimplência e receitas",
      icon: DollarSign
    },
    {
      value: "academic",
      label: "Relatório Acadêmico",
      description: "Notas, avaliações e desempenho",
      icon: GraduationCap
    }
  ];

  const formatOptions = [
    { value: "pdf", label: "PDF" },
    { value: "excel", label: "Excel" },
    { value: "csv", label: "CSV" }
  ];

  const handleSubmit = async () => {
    if (!reportType) {
      feedback.warning("Selecione o tipo de relatório");
      return;
    }

    if (!dateRange.from) {
      feedback.warning("Selecione a data inicial");
      return;
    }

    setLoading(true);
    try {
      // Simular geração do relatório
      await new Promise(resolve => setTimeout(resolve, 3000));
      feedback.success("Relatório gerado com sucesso!");
      onSuccess();
    } catch (error) {
      feedback.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReportType("");
    setDateRange({});
    setIncludeGraphics(true);
    setIncludeSummary(true);
    setReportFormat("pdf");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedReportType = reportTypes.find(type => type.value === reportType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Gerar Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Tipo de Relatório</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      reportType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setReportType(type.value)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium text-sm">{type.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedReportType && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final (Opcional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Até hoje"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        disabled={(date) => dateRange.from ? date < dateRange.from : false}
                        
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Formato</label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Opções do Relatório</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="summary"
                      checked={includeSummary}
                      onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                    />
                    <label
                      htmlFor="summary"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Incluir resumo executivo
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="graphics"
                      checked={includeGraphics}
                      onCheckedChange={(checked) => setIncludeGraphics(checked === true)}
                    />
                    <label
                      htmlFor="graphics"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Incluir gráficos e estatísticas
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !reportType} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}