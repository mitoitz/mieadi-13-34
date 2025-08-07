import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GenerateReceiptRequest {
  attendance_record_id: string;
  template_id?: string;
  format?: 'thermal' | 'pdf' | 'html';
  auto_print?: boolean;
}

export interface ThermalPrintRequest {
  receipt_id?: string;
  content?: string;
  printer_name?: string;
  paper_size?: '58mm' | '80mm';
  copies?: number;
}

export const useAdvancedReceipts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReceipt = async (data: GenerateReceiptRequest) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-receipt', {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Recibo Gerado",
        description: `Recibo ${result.receipt.receipt_number} criado com sucesso`,
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar recibo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const printThermal = async (data: ThermalPrintRequest) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('thermal-print', {
        body: data,
      });

      if (error) throw error;

      if (result.success) {
        toast({
          title: "Impressão Realizada",
          description: result.message,
        });
      } else {
        toast({
          title: "Erro na Impressão",
          description: result.message,
          variant: "destructive",
        });
      }

      return result;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro na impressão",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTemplates = async (type?: string) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('receipt-templates', {
        body: { action: 'list', type },
      });

      if (error) throw error;
      return result.templates;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar templates",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateReceipt,
    printThermal,
    getTemplates,
  };
};