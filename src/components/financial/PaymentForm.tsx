import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { financialService } from "@/services/financial.service";

interface PaymentFormProps {
  onSuccess?: () => void;
}

interface PaymentData {
  studentId: string;
  amount: number;
  description: string;
  dueDate: Date | undefined;
  paymentDate: Date | undefined;
  paymentMethod: string;
  type: string;
  observations: string;
}

export function PaymentForm({ onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    studentId: "",
    amount: 0,
    description: "",
    dueDate: undefined,
    paymentDate: undefined,
    paymentMethod: "",
    type: "",
    observations: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.studentId || !paymentData.amount || !paymentData.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      
      await financialService.createTuitionFee({
        student_id: paymentData.studentId,
        class_id: "", // Will be implemented when class selection is added
        amount: paymentData.amount,
        due_date: paymentData.dueDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        status: paymentData.paymentDate ? 'paid' : 'pending',
        payment_date: paymentData.paymentDate?.toISOString().split('T')[0],
        payment_method: paymentData.paymentMethod,
        notes: `${paymentData.description}${paymentData.observations ? ` - ${paymentData.observations}` : ''}`
      });

      toast.success("Lançamento financeiro registrado com sucesso!");
      
      // Reset form
      setPaymentData({
        studentId: "",
        amount: 0,
        description: "",
        dueDate: undefined,
        paymentDate: undefined,
        paymentMethod: "",
        type: "",
        observations: ""
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error("Erro ao registrar lançamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Novo Lançamento Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Aluno *</Label>
            <Select 
              value={paymentData.studentId} 
              onValueChange={(value) => setPaymentData(prev => ({ ...prev, studentId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">João Silva - 001</SelectItem>
                <SelectItem value="2">Maria Santos - 002</SelectItem>
                <SelectItem value="3">Carlos Oliveira - 003</SelectItem>
                <SelectItem value="4">Ana Costa - 004</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select 
                value={paymentData.type} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de cobrança" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="material">Material Didático</SelectItem>
                  <SelectItem value="taxa">Taxa de Matrícula</SelectItem>
                  <SelectItem value="evento">Evento/Seminário</SelectItem>
                  <SelectItem value="certificado">Certificado</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <CurrencyInput
                value={paymentData.amount}
                onChange={(value) => setPaymentData(prev => ({ ...prev, amount: value }))}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              placeholder="Ex: Mensalidade Janeiro 2024"
              value={paymentData.description}
              onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentData.dueDate ? (
                      format(paymentData.dueDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentData.dueDate}
                    onSelect={(date) => setPaymentData(prev => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentData.paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentData.paymentDate ? (
                      format(paymentData.paymentDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentData.paymentDate}
                    onSelect={(date) => setPaymentData(prev => ({ ...prev, paymentDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {paymentData.paymentDate && (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select 
                value={paymentData.paymentMethod} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Como foi pago?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              placeholder="Informações adicionais..."
              value={paymentData.observations}
              onChange={(e) => setPaymentData(prev => ({ ...prev, observations: e.target.value }))}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registrando..." : "Registrar Lançamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}