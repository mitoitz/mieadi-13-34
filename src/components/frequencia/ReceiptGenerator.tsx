import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Receipt, Printer, Download, FileText } from 'lucide-react';
import { useAdvancedReceipts } from '@/hooks/useAdvancedReceipts';

interface ReceiptGeneratorProps {
  attendanceRecordId: string;
  studentName?: string;
  activityName?: string;
  onGenerated?: (receipt: any) => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  attendanceRecordId,
  studentName,
  activityName,
  onGenerated,
}) => {
  const [format, setFormat] = useState<'thermal' | 'pdf' | 'html'>('thermal');
  const [autoPrint, setAutoPrint] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);
  
  const { generateReceipt, printThermal, getTemplates, loading } = useAdvancedReceipts();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templateList = await getTemplates('attendance');
      setTemplates(templateList || []);
      
      // Selecionar template padrão
      const defaultTemplate = templateList?.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleGenerate = async () => {
    try {
      const result = await generateReceipt({
        attendance_record_id: attendanceRecordId,
        template_id: selectedTemplate || undefined,
        format,
        auto_print: autoPrint,
      });

      setGeneratedReceipt(result.receipt);
      onGenerated?.(result.receipt);
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
    }
  };

  const handlePrint = async () => {
    if (!generatedReceipt) return;

    try {
      await printThermal({
        receipt_id: generatedReceipt.id,
        paper_size: '58mm',
        copies: 1,
      });
    } catch (error) {
      console.error('Erro ao imprimir:', error);
    }
  };

  const handleDownload = () => {
    if (!generatedReceipt || !generatedReceipt.content) return;

    const element = document.createElement('a');
    const fileType = format === 'pdf' ? 'application/pdf' : 'text/html';
    const fileName = `recibo_${generatedReceipt.receipt_number}.${format}`;
    
    if (format === 'pdf') {
      // Para PDF, o conteúdo já está em base64
      element.href = `data:${fileType};base64,${generatedReceipt.content}`;
    } else {
      // Para HTML e texto
      const file = new Blob([generatedReceipt.content], { type: fileType });
      element.href = URL.createObjectURL(file);
    }
    
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case 'thermal': return <Printer className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'html': return <Download className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Gerar Recibo de Frequência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da frequência */}
        {(studentName || activityName) && (
          <div className="bg-muted p-3 rounded-lg space-y-1">
            {studentName && (
              <div className="text-sm">
                <span className="font-medium">Aluno:</span> {studentName}
              </div>
            )}
            {activityName && (
              <div className="text-sm">
                <span className="font-medium">Atividade:</span> {activityName}
              </div>
            )}
          </div>
        )}

        {/* Seleção de template */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Template:</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    {template.name}
                    {template.is_default && <Badge variant="secondary">Padrão</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Formato */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Formato:</label>
          <Select value={format} onValueChange={(value: any) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thermal">
                <div className="flex items-center gap-2">
                  {getFormatIcon('thermal')}
                  Impressão Térmica
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  {getFormatIcon('pdf')}
                  PDF
                </div>
              </SelectItem>
              <SelectItem value="html">
                <div className="flex items-center gap-2">
                  {getFormatIcon('html')}
                  HTML
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto impressão */}
        {format === 'thermal' && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Imprimir automaticamente:</label>
            <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !attendanceRecordId}
            className="flex-1"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Gerar Recibo
          </Button>
        </div>

        {/* Recibo gerado */}
        {generatedReceipt && (
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {generatedReceipt.receipt_number}
              </Badge>
              <Badge className={generatedReceipt.printed ? 'bg-green-500' : 'bg-yellow-500'}>
                {generatedReceipt.printed ? 'Impresso' : 'Gerado'}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {format === 'thermal' && !generatedReceipt.printed && (
                <Button size="sm" onClick={handlePrint} disabled={loading}>
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};