// Serviço para geração de recibos
import jsPDF from 'jspdf';

export interface ReceiptData {
  id: string;
  studentName: string;
  studentCode: string;
  amount: number;
  description: string;
  paymentDate: string;
  paymentMethod: string;
  dueDate?: string;
  observations?: string;
}

export const receiptService = {
  // Gera recibo em PDF
  generateReceipt: (data: ReceiptData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.text('MIEADI', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Ministério de Educação Cristã', pageWidth / 2, 40, { align: 'center' });
    
    // Receipt title
    doc.setFontSize(16);
    doc.text('RECIBO DE PAGAMENTO', pageWidth / 2, 60, { align: 'center' });
    
    // Receipt number and date
    doc.setFontSize(10);
    doc.text(`Recibo Nº: ${data.id}`, 20, 80);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 60, 80);
    
    // Student info
    doc.setFontSize(12);
    doc.text('DADOS DO ALUNO', 20, 100);
    doc.setFontSize(10);
    doc.text(`Nome: ${data.studentName}`, 20, 115);
    doc.text(`Código: ${data.studentCode}`, 20, 125);
    
    // Payment info
    doc.setFontSize(12);
    doc.text('DADOS DO PAGAMENTO', 20, 145);
    doc.setFontSize(10);
    doc.text(`Descrição: ${data.description}`, 20, 160);
    doc.text(`Valor: R$ ${data.amount.toFixed(2)}`, 20, 170);
    doc.text(`Data do Pagamento: ${data.paymentDate}`, 20, 180);
    doc.text(`Forma de Pagamento: ${data.paymentMethod}`, 20, 190);
    
    if (data.dueDate) {
      doc.text(`Data de Vencimento: ${data.dueDate}`, 20, 200);
    }
    
    if (data.observations) {
      doc.text(`Observações: ${data.observations}`, 20, 210);
    }
    
    // Signature area
    doc.setFontSize(10);
    doc.text('_________________________________', 20, 250);
    doc.text('Assinatura do Responsável', 20, 260);
    doc.text('MIEADI - Ministério de Educação Cristã', 20, 270);
    
    // Footer
    doc.text(`Recibo gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`, 
             pageWidth / 2, 280, { align: 'center' });
    
    // Save PDF
    doc.save(`Recibo_${data.studentCode}_${data.id}.pdf`);
  },

  // Gera recibo simples para visualização
  generateSimpleReceipt: (data: ReceiptData): string => {
    return `
MIEADI - Ministério de Educação Cristã
RECIBO DE PAGAMENTO

Recibo Nº: ${data.id}
Data: ${new Date().toLocaleDateString('pt-BR')}

DADOS DO ALUNO
Nome: ${data.studentName}
Código: ${data.studentCode}

DADOS DO PAGAMENTO
Descrição: ${data.description}
Valor: R$ ${data.amount.toFixed(2)}
Data do Pagamento: ${data.paymentDate}
Forma de Pagamento: ${data.paymentMethod}
${data.dueDate ? `Data de Vencimento: ${data.dueDate}` : ''}
${data.observations ? `Observações: ${data.observations}` : ''}

_________________________________
Assinatura do Responsável
MIEADI - Ministério de Educação Cristã

Recibo gerado automaticamente em ${new Date().toLocaleString('pt-BR')}
    `;
  },

  // Valida dados do recibo
  validateReceiptData: (data: Partial<ReceiptData>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.studentName) errors.push('Nome do aluno é obrigatório');
    if (!data.studentCode) errors.push('Código do aluno é obrigatório');
    if (!data.amount || data.amount <= 0) errors.push('Valor deve ser maior que zero');
    if (!data.description) errors.push('Descrição é obrigatória');
    if (!data.paymentDate) errors.push('Data de pagamento é obrigatória');
    if (!data.paymentMethod) errors.push('Forma de pagamento é obrigatória');

    return {
      valid: errors.length === 0,
      errors
    };
  }
};