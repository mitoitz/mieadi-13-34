import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Download, Eye } from "lucide-react";
import { receiptService, ReceiptData } from "@/services/receipt.service";
import { toast } from "sonner";

interface ReceiptGeneratorProps {
  paymentData?: Partial<ReceiptData>;
  trigger?: React.ReactNode;
}

export function ReceiptGenerator({ paymentData, trigger }: ReceiptGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ReceiptData>({
    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
    studentName: paymentData?.studentName || "",
    studentCode: paymentData?.studentCode || "",
    amount: paymentData?.amount || 0,
    description: paymentData?.description || "",
    paymentDate: paymentData?.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: paymentData?.paymentMethod || "",
    dueDate: paymentData?.dueDate || "",
    observations: paymentData?.observations || ""
  });
  
  const [previewMode, setPreviewMode] = useState(false);

  const handleGenerateReceipt = () => {
    const validation = receiptService.validateReceiptData(formData);
    
    if (!validation.valid) {
      toast.error(`Dados inválidos: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      receiptService.generateReceipt(formData);
      toast.success("Recibo gerado com sucesso!");
      setOpen(false);
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error("Erro ao gerar recibo");
    }
  };

  const handlePreview = () => {
    const validation = receiptService.validateReceiptData(formData);
    
    if (!validation.valid) {
      toast.error(`Dados inválidos: ${validation.errors.join(', ')}`);
      return;
    }

    setPreviewMode(true);
  };

  const previewContent = receiptService.generateSimpleReceipt(formData);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Receipt className="h-4 w-4 mr-2" />
            Gerar Recibo
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Gerador de Recibos
          </DialogTitle>
        </DialogHeader>

        {!previewMode ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiptId">Número do Recibo</Label>
                <Input
                  id="receiptId"
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="Ex: REC001"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Data do Pagamento</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Aluno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Nome do Aluno *</Label>
                    <Input
                      id="studentName"
                      value={formData.studentName}
                      onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="studentCode">Código do Aluno *</Label>
                    <Input
                      id="studentCode"
                      value={formData.studentCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, studentCode: e.target.value }))}
                      placeholder="Ex: 001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Mensalidade Janeiro 2024"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Data de Vencimento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Informações adicionais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button onClick={handleGenerateReceipt}>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visualização do Recibo</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                  {previewContent}
                </pre>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Voltar
              </Button>
              <Button onClick={handleGenerateReceipt}>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}