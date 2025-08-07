import { useState } from 'react';
import { receiptService, ReceiptData } from '@/services/receipt.service';
import { toast } from 'sonner';

export function useReceipts() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReceipt = async (data: ReceiptData) => {
    try {
      setIsGenerating(true);
      const validation = receiptService.validateReceiptData(data);
      
      if (!validation.valid) {
        toast.error(`Erro ao gerar recibo: ${validation.errors.join(', ')}`);
        return;
      }

      await receiptService.generateReceipt(data);
      toast.success('Recibo gerado com sucesso!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Erro ao gerar recibo');
    } finally {
      setIsGenerating(false);
    }
  };

  const previewReceipt = (data: ReceiptData): string => {
    const validation = receiptService.validateReceiptData(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    return receiptService.generateSimpleReceipt(data);
  };

  return {
    generateReceipt,
    previewReceipt,
    isGenerating
  };
}