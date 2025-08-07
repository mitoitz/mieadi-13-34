import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThermalPrintRequest {
  receipt_id?: string;
  content?: string;
  printer_name?: string;
  paper_size?: '58mm' | '80mm';
  copies?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { receipt_id, content, printer_name, paper_size = '58mm', copies = 1 }: ThermalPrintRequest = await req.json();

    let printContent = content;
    let receiptRecord = null;

    // Se receipt_id foi fornecido, buscar o recibo
    if (receipt_id) {
      const { data: receipt, error: receiptError } = await supabaseClient
        .from('attendance_receipts')
        .select('*')
        .eq('id', receipt_id)
        .single();

      if (receiptError || !receipt) {
        return new Response(
          JSON.stringify({ error: 'Recibo não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      receiptRecord = receipt;
      
      // Se não foi fornecido conteúdo, gerar a partir dos dados do recibo
      if (!printContent) {
        printContent = generateReceiptContent(receipt);
      }
    }

    if (!printContent) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo para impressão não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Descobrir impressoras disponíveis
    const availablePrinters = await getAvailablePrinters();
    
    let selectedPrinter = null;
    if (printer_name) {
      selectedPrinter = availablePrinters.find(p => p.name === printer_name);
    } else {
      // Usar impressora padrão ou primeira disponível
      selectedPrinter = availablePrinters.find(p => p.is_default) || availablePrinters[0];
    }

    if (!selectedPrinter) {
      return new Response(
        JSON.stringify({ 
          error: 'Nenhuma impressora térmica disponível',
          available_printers: availablePrinters.map(p => p.name)
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar conteúdo para impressão térmica
    const formattedContent = formatForThermalPrinter(printContent, paper_size);

    // Executar impressão
    const printResults = [];
    
    for (let copy = 1; copy <= copies; copy++) {
      const printResult = await sendToPrinter(selectedPrinter, formattedContent, {
        paper_size,
        copy_number: copy,
        total_copies: copies,
      });
      
      printResults.push(printResult);
      
      // Se falhou, parar tentativas
      if (!printResult.success) {
        break;
      }
      
      // Delay entre cópias se necessário
      if (copy < copies) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const allSuccessful = printResults.every(r => r.success);
    const successfulCopies = printResults.filter(r => r.success).length;

    // Atualizar registro do recibo se fornecido
    if (receiptRecord) {
      const updateData = {
        status: allSuccessful ? 'printed' : (successfulCopies > 0 ? 'partially_printed' : 'failed'),
        printed_at: allSuccessful ? new Date().toISOString() : null,
        printer_info: {
          printer_name: selectedPrinter.name,
          paper_size,
          copies_requested: copies,
          copies_printed: successfulCopies,
          print_results: printResults,
        },
      };

      await supabaseClient
        .from('attendance_receipts')
        .update(updateData)
        .eq('id', receipt_id);
    }

    console.log(`Thermal print completed - Printer: ${selectedPrinter.name}, Copies: ${successfulCopies}/${copies}`);

    return new Response(
      JSON.stringify({
        success: allSuccessful,
        message: allSuccessful 
          ? `Impressão realizada com sucesso (${successfulCopies} cópias)`
          : `Impressão parcialmente realizada (${successfulCopies}/${copies} cópias)`,
        printer: {
          name: selectedPrinter.name,
          model: selectedPrinter.model,
          connection: selectedPrinter.connection,
        },
        copies_printed: successfulCopies,
        copies_requested: copies,
        print_results: printResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in thermal-print function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAvailablePrinters(): Promise<Array<{
  name: string;
  model: string;
  connection: string;
  is_default: boolean;
  is_online: boolean;
  capabilities: string[];
}>> {
  // Simula descoberta de impressoras
  // Em produção, integrar com sistema específico (CUPS, Windows Print Spooler, etc.)
  
  return [
    {
      name: 'Thermal_POS_58',
      model: 'Epson TM-T20II',
      connection: 'USB',
      is_default: true,
      is_online: true,
      capabilities: ['thermal', '58mm', 'receipt', 'barcode'],
    },
    {
      name: 'Thermal_POS_80',
      model: 'Bematech MP-4200 TH',
      connection: 'Serial',
      is_default: false,
      is_online: Math.random() > 0.3, // Simula disponibilidade
      capabilities: ['thermal', '80mm', 'receipt', 'barcode', 'logo'],
    },
    {
      name: 'Network_Thermal',
      model: 'Daruma DR-800',
      connection: 'Network',
      is_default: false,
      is_online: Math.random() > 0.5,
      capabilities: ['thermal', '58mm', '80mm', 'receipt', 'barcode'],
    },
  ].filter(printer => printer.is_online);
}

function formatForThermalPrinter(content: string, paperSize: string): string {
  const width = paperSize === '58mm' ? 32 : 48;
  
  // Comandos ESC/POS básicos
  const ESC = '\x1B';
  const GS = '\x1D';
  
  let formatted = '';
  
  // Inicializar impressora
  formatted += ESC + '@'; // Reset
  formatted += ESC + 'a' + '\x01'; // Centralizar
  
  // Processar cada linha do conteúdo
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.trim() === '') {
      formatted += '\n';
      continue;
    }
    
    // Detectar tipos de linha e aplicar formatação
    if (line.includes('***') || line.includes('===')) {
      // Linha de separação - negrito
      formatted += ESC + 'E' + '\x01'; // Negrito ON
      formatted += fitLineToWidth(line, width) + '\n';
      formatted += ESC + 'E' + '\x00'; // Negrito OFF
    } else if (line.includes('COMPROVANTE') || line.includes('MIEADI')) {
      // Título - negrito e centralizado
      formatted += ESC + 'a' + '\x01'; // Centralizar
      formatted += ESC + 'E' + '\x01'; // Negrito ON
      formatted += fitLineToWidth(line, width) + '\n';
      formatted += ESC + 'E' + '\x00'; // Negrito OFF
      formatted += ESC + 'a' + '\x00'; // Alinhar à esquerda
    } else if (line.includes(':')) {
      // Linha com dados - fonte pequena
      formatted += fitLineToWidth(line, width) + '\n';
    } else {
      // Linha normal
      formatted += fitLineToWidth(line, width) + '\n';
    }
  }
  
  // Finalizar
  formatted += '\n\n\n'; // Espaços para corte
  formatted += GS + 'V' + '\x42' + '\x00'; // Corte parcial
  
  return formatted;
}

function fitLineToWidth(line: string, width: number): string {
  if (line.length <= width) {
    return line;
  }
  
  // Quebrar linha longa em múltiplas linhas
  const words = line.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Palavra muito longa - truncar
        lines.push(word.substring(0, width));
        currentLine = '';
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

async function sendToPrinter(printer: any, content: string, options: any): Promise<{
  success: boolean;
  error?: string;
  print_info?: any;
}> {
  try {
    // Simula envio para impressora real
    // Em produção, usar biblioteca específica ou API do sistema
    
    console.log(`Sending to printer ${printer.name}:`, content.substring(0, 100) + '...');
    
    // Simula tempo de impressão
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simula falha ocasional
    if (Math.random() < 0.05) { // 5% chance de falha
      throw new Error('Papel acabou na impressora');
    }
    
    const print_info = {
      printer_name: printer.name,
      printer_model: printer.model,
      paper_size: options.paper_size,
      copy_number: options.copy_number,
      total_copies: options.total_copies,
      lines_printed: content.split('\n').length,
      characters_printed: content.length,
      print_time: new Date().toISOString(),
      connection_type: printer.connection,
    };
    
    return {
      success: true,
      print_info,
    };
    
  } catch (error) {
    console.error(`Print error on ${printer.name}:`, error);
    
    return {
      success: false,
      error: error.message,
    };
  }
}

function generateReceiptContent(receipt: any): string {
  // Gerar conteúdo básico se não estiver nos dados do recibo
  if (!receipt.receipt_data) {
    return `
MIEADI - Instituto Teológico
COMPROVANTE DE FREQUÊNCIA
===============================

Recibo: ${receipt.receipt_number}
Data: ${new Date().toLocaleDateString()}

ALUNO: [Nome não disponível]
Matrícula: [Não disponível]

ATIVIDADE: [Não especificada]
Data: ${new Date().toLocaleDateString()}

STATUS: ${receipt.status || 'Gerado'}

===============================
Este documento comprova a 
presença do aluno na atividade
especificada.

*** FIM DO COMPROVANTE ***
    `.trim();
  }
  
  // Usar dados completos do recibo
  const data = receipt.receipt_data;
  
  return `
${data.institution_name}
${data.receipt_title}
===============================

Recibo: ${receipt.receipt_number}
Data: ${data.issue_date} ${data.issue_time}

ALUNO:
${data.student.name}
Matrícula: ${data.student.badge_number}

ATIVIDADE:
${data.activity.type}: ${data.activity.name}
${data.activity.subject ? `Disciplina: ${data.activity.subject}` : ''}
Data: ${data.activity.date}

STATUS: ${data.attendance.status_label}
Método: ${data.attendance.verification_label}

===============================
${data.footer_text}

*** FIM DO COMPROVANTE ***
  `.trim();
}