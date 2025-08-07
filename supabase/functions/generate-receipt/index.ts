import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateReceiptRequest {
  attendance_record_id: string;
  template_id?: string;
  format?: 'thermal' | 'pdf' | 'html';
  auto_print?: boolean;
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

    const { attendance_record_id, template_id, format = 'thermal', auto_print = false }: GenerateReceiptRequest = await req.json();

    // Validar dados de entrada
    if (!attendance_record_id) {
      return new Response(
        JSON.stringify({ error: 'attendance_record_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar registro de frequência
    const { data: attendanceRecord, error: attendanceError } = await supabaseClient
      .from('attendance_records')
      .select(`
        *,
        profiles!attendance_records_student_id_fkey(id, full_name, badge_number),
        classes(id, name, subject_id, subjects(name)),
        events(id, title, event_type)
      `)
      .eq('id', attendance_record_id)
      .single();

    if (attendanceError || !attendanceRecord) {
      return new Response(
        JSON.stringify({ error: 'Registro de frequência não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar template (usar padrão se não especificado)
    let template;
    if (template_id) {
      const { data: customTemplate } = await supabaseClient
        .from('receipt_templates')
        .select('*')
        .eq('id', template_id)
        .eq('is_active', true)
        .single();
      template = customTemplate;
    }

    if (!template) {
      const { data: defaultTemplate } = await supabaseClient
        .from('receipt_templates')
        .select('*')
        .eq('template_type', 'attendance')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();
      template = defaultTemplate;
    }

    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Template de recibo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar dados do recibo
    const receiptData = await generateReceiptData(attendanceRecord, template);

    // Gerar conteúdo do recibo baseado no formato
    let receiptContent;
    switch (format) {
      case 'thermal':
        receiptContent = generateThermalReceipt(receiptData, template);
        break;
      case 'pdf':
        receiptContent = await generatePDFReceipt(receiptData, template);
        break;
      case 'html':
        receiptContent = generateHTMLReceipt(receiptData, template);
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }

    // Salvar recibo no banco de dados
    const { data: savedReceipt, error: saveError } = await supabaseClient
      .from('attendance_receipts')
      .insert({
        attendance_record_id,
        student_id: attendanceRecord.student_id,
        class_id: attendanceRecord.class_id,
        event_id: attendanceRecord.event_id,
        receipt_data: receiptData,
        template_id: template.id,
        print_method: format,
        status: 'generated',
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    console.log(`Receipt generated - ID: ${savedReceipt.receipt_number}, Format: ${format}`);

    // Se auto_print estiver habilitado e for thermal, enviar para impressão
    if (auto_print && format === 'thermal') {
      try {
        const printResult = await printThermalReceipt(receiptContent);
        
        // Atualizar status do recibo
        await supabaseClient
          .from('attendance_receipts')
          .update({
            status: printResult.success ? 'printed' : 'failed',
            printed_at: printResult.success ? new Date().toISOString() : null,
            printer_info: printResult.printer_info,
          })
          .eq('id', savedReceipt.id);

        return new Response(
          JSON.stringify({
            success: true,
            receipt: {
              id: savedReceipt.id,
              receipt_number: savedReceipt.receipt_number,
              content: receiptContent,
              format,
              printed: printResult.success,
              printer_info: printResult.printer_info,
            },
            data: receiptData,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (printError) {
        console.error('Print error:', printError);
        
        await supabaseClient
          .from('attendance_receipts')
          .update({ status: 'failed' })
          .eq('id', savedReceipt.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt: {
          id: savedReceipt.id,
          receipt_number: savedReceipt.receipt_number,
          content: receiptContent,
          format,
          printed: false,
        },
        data: receiptData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-receipt function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateReceiptData(attendanceRecord: any, template: any) {
  const now = new Date();
  
  return {
    // Dados do cabeçalho
    institution_name: "MIEADI - Instituto Teológico",
    receipt_title: "COMPROVANTE DE FREQUÊNCIA",
    receipt_number: null, // Será gerado automaticamente
    issue_date: now.toISOString().split('T')[0],
    issue_time: now.toTimeString().split(' ')[0],
    
    // Dados do aluno
    student: {
      id: attendanceRecord.profiles.id,
      name: attendanceRecord.profiles.full_name,
      badge_number: attendanceRecord.profiles.badge_number,
    },
    
    // Dados da atividade
    activity: {
      type: attendanceRecord.event_id ? 'Evento' : 'Aula',
      name: attendanceRecord.event_id 
        ? attendanceRecord.events.title 
        : attendanceRecord.classes.name,
      subject: attendanceRecord.classes?.subjects?.name,
      date: attendanceRecord.check_in_time ? 
        new Date(attendanceRecord.check_in_time).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      check_in_time: attendanceRecord.check_in_time,
      check_out_time: attendanceRecord.check_out_time,
    },
    
    // Dados da frequência
    attendance: {
      status: attendanceRecord.status,
      status_label: getStatusLabel(attendanceRecord.status),
      verification_method: attendanceRecord.verification_method,
      verification_label: getVerificationLabel(attendanceRecord.verification_method),
      notes: attendanceRecord.notes,
    },
    
    // Dados do template
    template_info: {
      id: template.id,
      name: template.name,
      paper_size: template.paper_size,
    },
    
    // Footer
    footer_text: "Este documento comprova a presença do aluno na atividade especificada.",
    generated_at: now.toISOString(),
  };
}

function generateThermalReceipt(data: any, template: any): string {
  const width = template.paper_size === 'thermal_58mm' ? 32 : 48;
  
  let receipt = '';
  
  // Cabeçalho
  receipt += centerText(data.institution_name, width) + '\n';
  receipt += centerText(data.receipt_title, width) + '\n';
  receipt += '='.repeat(width) + '\n';
  
  // Número do recibo (será preenchido após salvar)
  receipt += `Recibo: [NÚMERO]\n`;
  receipt += `Data: ${data.issue_date} ${data.issue_time}\n`;
  receipt += '-'.repeat(width) + '\n';
  
  // Dados do aluno
  receipt += 'ALUNO:\n';
  receipt += `${data.student.name}\n`;
  receipt += `Matrícula: ${data.student.badge_number}\n`;
  receipt += '-'.repeat(width) + '\n';
  
  // Dados da atividade
  receipt += 'ATIVIDADE:\n';
  receipt += `${data.activity.type}: ${data.activity.name}\n`;
  if (data.activity.subject) {
    receipt += `Disciplina: ${data.activity.subject}\n`;
  }
  receipt += `Data: ${data.activity.date}\n`;
  
  if (data.activity.check_in_time) {
    const checkIn = new Date(data.activity.check_in_time);
    receipt += `Entrada: ${checkIn.toTimeString().split(' ')[0]}\n`;
  }
  
  if (data.activity.check_out_time) {
    const checkOut = new Date(data.activity.check_out_time);
    receipt += `Saída: ${checkOut.toTimeString().split(' ')[0]}\n`;
  }
  
  receipt += '-'.repeat(width) + '\n';
  
  // Status da frequência
  receipt += 'FREQUÊNCIA:\n';
  receipt += `Status: ${data.attendance.status_label}\n`;
  receipt += `Método: ${data.attendance.verification_label}\n`;
  
  if (data.attendance.notes) {
    receipt += `Obs: ${data.attendance.notes}\n`;
  }
  
  receipt += '='.repeat(width) + '\n';
  receipt += data.footer_text + '\n';
  receipt += '\n';
  receipt += centerText('*** FIM DO COMPROVANTE ***', width) + '\n';
  
  return receipt;
}

async function generatePDFReceipt(data: any, template: any): Promise<string> {
  // Simula geração de PDF
  // Em produção, usar biblioteca como jsPDF ou Puppeteer
  
  const pdfContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .field { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        ${generateHTMLReceipt(data, template)}
      </body>
    </html>
  `;
  
  // Retorna base64 simulado
  return btoa(pdfContent);
}

function generateHTMLReceipt(data: any, template: any): string {
  return `
    <div class="receipt">
      <div class="header">
        <h2>${data.institution_name}</h2>
        <h3>${data.receipt_title}</h3>
      </div>
      
      <div class="section">
        <strong>Recibo:</strong> [NÚMERO]<br>
        <strong>Data:</strong> ${data.issue_date} ${data.issue_time}
      </div>
      
      <div class="section">
        <h4>ALUNO</h4>
        <strong>Nome:</strong> ${data.student.name}<br>
        <strong>Matrícula:</strong> ${data.student.badge_number}
      </div>
      
      <div class="section">
        <h4>ATIVIDADE</h4>
        <strong>${data.activity.type}:</strong> ${data.activity.name}<br>
        ${data.activity.subject ? `<strong>Disciplina:</strong> ${data.activity.subject}<br>` : ''}
        <strong>Data:</strong> ${data.activity.date}<br>
        ${data.activity.check_in_time ? `<strong>Entrada:</strong> ${new Date(data.activity.check_in_time).toTimeString().split(' ')[0]}<br>` : ''}
        ${data.activity.check_out_time ? `<strong>Saída:</strong> ${new Date(data.activity.check_out_time).toTimeString().split(' ')[0]}<br>` : ''}
      </div>
      
      <div class="section">
        <h4>FREQUÊNCIA</h4>
        <strong>Status:</strong> ${data.attendance.status_label}<br>
        <strong>Método:</strong> ${data.attendance.verification_label}<br>
        ${data.attendance.notes ? `<strong>Observações:</strong> ${data.attendance.notes}<br>` : ''}
      </div>
      
      <div class="footer">
        <p>${data.footer_text}</p>
      </div>
    </div>
  `;
}

async function printThermalReceipt(content: string): Promise<{
  success: boolean;
  printer_info?: any;
  error?: string;
}> {
  try {
    // Simula envio para impressora térmica
    // Em produção, integrar com sistema de impressão específico
    
    console.log('Printing thermal receipt:', content);
    
    // Simula informações da impressora
    const printer_info = {
      printer_name: 'Thermal Printer POS-58',
      connection: 'USB',
      paper_width: '58mm',
      printed_at: new Date().toISOString(),
      lines_printed: content.split('\n').length,
    };
    
    // Simula sucesso/falha aleatório para testes
    const success = Math.random() > 0.1; // 90% chance de sucesso
    
    return {
      success,
      printer_info: success ? printer_info : undefined,
      error: success ? undefined : 'Impressora não disponível',
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function getStatusLabel(status: string): string {
  const labels = {
    'presente': 'PRESENTE',
    'ausente': 'AUSENTE',
    'atrasado': 'ATRASADO',
    'saida_antecipada': 'SAÍDA ANTECIPADA',
  };
  return labels[status] || status.toUpperCase();
}

function getVerificationLabel(method: string): string {
  const labels = {
    'manual': 'Manual',
    'biometric': 'Biométrico',
    'facial': 'Reconhecimento Facial',
    'qr_code': 'QR Code',
    'card': 'Cartão',
  };
  return labels[method] || method;
}