// Serviço para exportação de dados em PDF e Excel
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export interface ExportableData {
  headers: string[];
  rows: any[][];
  title: string;
  subtitle?: string;
}

export interface FinancialReportData {
  summary: {
    totalReceived: number;
    totalPending: number;
    totalOverdue: number;
    paymentRate: number;
  };
  payments: any[];
  defaulters: any[];
}

export const exportService = {
  // Exporta dados genéricos para PDF com layout melhorado
  exportToPDF: (data: ExportableData) => {
    const doc = new jsPDF();
    const { title, subtitle, headers, rows } = data;
    
    // Header com logo (placeholder)
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MIEADI - Sistema de Gestão', 20, 16);
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 40);
    
    if (subtitle) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, 20, 50);
    }
    
    // Date and metadata
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, subtitle ? 60 : 50);
    doc.text(`Total de registros: ${rows.length}`, 120, subtitle ? 60 : 50);
    
    // Separator line
    const lineY = subtitle ? 65 : 55;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, lineY, 190, lineY);
    
    // Table
    const startY = lineY + 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    // Headers with background
    let y = startY;
    const colWidth = 170 / headers.length;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 5, 170, 8, 'F');
    
    headers.forEach((header, index) => {
      doc.text(header, 22 + (index * colWidth), y);
    });
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    
    // Rows with alternating background
    rows.forEach((row, rowIndex) => {
      if (y > 270) { // New page
        doc.addPage();
        y = 30;
        
        // Repeat headers on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y - 5, 170, 8, 'F');
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          doc.text(header, 22 + (index * colWidth), y);
        });
        y += 10;
        doc.setFont('helvetica', 'normal');
      }
      
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, y - 4, 170, 7, 'F');
      }
      
      row.forEach((cell: any, index: number) => {
        const cellText = String(cell || '').substring(0, 25);
        doc.text(cellText, 22 + (index * colWidth), y);
      });
      
      y += 7;
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${i} de ${pageCount}`, 170, 285);
      doc.text('Sistema MIEADI', 20, 285);
    }
    
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Exporta dados genéricos para Excel
  exportToExcel: (data: ExportableData) => {
    const { title, headers, rows } = data;
    
    const ws = XLSX.utils.aoa_to_sheet([
      [title],
      [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
      [],
      headers,
      ...rows
    ]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
  },

  // Exporta relatório financeiro completo
  exportFinancialReport: (data: FinancialReportData, format: 'pdf' | 'excel') => {
    const { summary, payments, defaulters } = data;
    
    const reportData: ExportableData = {
      title: 'Relatório Financeiro - MIEADI',
      subtitle: `Resumo Financeiro - ${new Date().toLocaleDateString('pt-BR')}`,
      headers: [
        'Descrição',
        'Valor',
        'Status',
        'Data Vencimento',
        'Data Pagamento',
        'Forma Pagamento'
      ],
      rows: [
        // Summary section
        ['=== RESUMO FINANCEIRO ===', '', '', '', '', ''],
        ['Total Recebido', `R$ ${summary.totalReceived.toFixed(2)}`, '', '', '', ''],
        ['Total Pendente', `R$ ${summary.totalPending.toFixed(2)}`, '', '', '', ''],
        ['Total Vencido', `R$ ${summary.totalOverdue.toFixed(2)}`, '', '', '', ''],
        ['Taxa de Pagamento', `${summary.paymentRate.toFixed(1)}%`, '', '', '', ''],
        ['', '', '', '', '', ''],
        
        // Payments section
        ['=== PAGAMENTOS ===', '', '', '', '', ''],
        ...payments.map(payment => [
          payment?.description || '',
          `R$ ${payment?.amount?.toFixed(2) || '0.00'}`,
          payment?.status || '',
          payment?.due_date || '',
          payment?.payment_date || '',
          payment?.payment_method || ''
        ]),
        
        ['', '', '', '', '', ''],
        
        // Defaulters section
        ['=== INADIMPLENTES ===', '', '', '', '', ''],
        ...defaulters.map(defaulter => [
          defaulter?.student?.name || '',
          `R$ ${defaulter?.overdueAmount?.toFixed(2) || '0.00'}`,
          'Vencido',
          '',
          '',
          ''
        ])
      ]
    };

    if (format === 'pdf') {
      exportService.exportToPDF(reportData);
    } else {
      exportService.exportToExcel(reportData);
    }
  },

  // Exporta lista de inadimplentes
  exportDefaultersList: (defaulters: any[], format: 'pdf' | 'excel') => {
    const reportData: ExportableData = {
      title: 'Lista de Inadimplentes - MIEADI',
      subtitle: `Total de inadimplentes: ${defaulters.length}`,
      headers: [
        'Aluno',
        'Código',
        'Congregação',
        'Telefone',
        'Email',
        'Valor Vencido',
        'Dias em Atraso',
        'Último Contato'
      ],
      rows: defaulters.map(defaulter => [
        defaulter?.student?.name || '',
        defaulter?.student?.code || '',
        defaulter?.student?.congregation || '',
        defaulter?.student?.phone || '',
        defaulter?.student?.email || '',
        `R$ ${defaulter?.overdueAmount?.toFixed(2) || '0.00'}`,
        `${defaulter?.daysSinceFirstOverdue || 0} dias`,
        defaulter?.lastContactDate ? new Date(defaulter.lastContactDate).toLocaleDateString('pt-BR') : 'Nunca'
      ])
    };

    if (format === 'pdf') {
      exportService.exportToPDF(reportData);
    } else {
      exportService.exportToExcel(reportData);
    }
  },

  // Exporta relatórios do professor
  exportProfessorReports: (alunos: any[], turmas: any[], format: 'pdf' | 'excel') => {
    const reportData: ExportableData = {
      title: 'Relatório do Professor - MIEADI',
      subtitle: `${turmas.length} turmas • ${alunos.length} alunos`,
      headers: [
        'Tipo',
        'Nome/Turma',
        'Frequência',
        'Nota Média',
        'Avaliações',
        'Observações'
      ],
      rows: [
        // Turmas section
        ['=== TURMAS ===', '', '', '', '', ''],
        ...turmas.map(turma => [
          'Turma',
          turma.nome || '',
          `${turma.frequencia_media}%`,
          `${turma.nota_media}`,
          `${turma.total_avaliacoes}`,
          `${turma.total_alunos} alunos`
        ]),
        
        ['', '', '', '', '', ''],
        
        // Alunos section
        ['=== ALUNOS ===', '', '', '', '', ''],
        ...alunos.map(aluno => [
          'Aluno',
          aluno.full_name || '',
          `${aluno.frequencia}%`,
          `${aluno.nota_media}`,
          `${aluno.avaliacoes_enviadas}/${aluno.total_avaliacoes}`,
          aluno.turma_nome || ''
        ])
      ]
    };

    if (format === 'pdf') {
      exportService.exportToPDF(reportData);
    } else {
      exportService.exportToExcel(reportData);
    }
  }
};