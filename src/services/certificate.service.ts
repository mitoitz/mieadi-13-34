import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

export interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  workload: string;
  institution: string;
  instructor?: string;
  grade?: number;
}

export class CertificateService {
  static async generateCertificate(data: CertificateData): Promise<string> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações do documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Margens
    const margin = 20;
    const centerX = pageWidth / 2;

    // Cores
    const primaryColor = '#1a365d'; // Azul escuro
    const accentColor = '#3182ce'; // Azul médio
    const goldColor = '#d69e2e'; // Dourado

    // Adicionar fundo decorativo
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Borda decorativa
    doc.setDrawColor(58, 130, 206);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    doc.setLineWidth(1);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(primaryColor);
    doc.text('CERTIFICADO', centerX, 50, { align: 'center' });

    // Subtítulo
    doc.setFontSize(18);
    doc.setTextColor(accentColor);
    doc.text('DE CONCLUSÃO DE CURSO', centerX, 65, { align: 'center' });

    // Texto principal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    
    const certificateText = `Certificamos que`;
    doc.text(certificateText, centerX, 85, { align: 'center' });

    // Nome do estudante (destaque)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.text(data.studentName.toUpperCase(), centerX, 105, { align: 'center' });

    // Linha decorativa sob o nome
    doc.setDrawColor(goldColor);
    doc.setLineWidth(1);
    const nameWidth = doc.getTextWidth(data.studentName.toUpperCase());
    doc.line(centerX - nameWidth/2 - 10, 110, centerX + nameWidth/2 + 10, 110);

    // Texto do curso
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    
    const courseText = `concluiu com aproveitamento o curso de`;
    doc.text(courseText, centerX, 125, { align: 'center' });

    // Nome do curso
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(accentColor);
    doc.text(data.courseName, centerX, 140, { align: 'center' });

    // Detalhes do curso
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    
    let yPosition = 155;
    
    if (data.workload) {
      doc.text(`Carga horária: ${data.workload}`, centerX, yPosition, { align: 'center' });
      yPosition += 8;
    }
    
    if (data.grade && data.grade > 0) {
      doc.text(`Nota final: ${data.grade.toFixed(1)}`, centerX, yPosition, { align: 'center' });
      yPosition += 8;
    }

    doc.text(`Concluído em: ${data.completionDate}`, centerX, yPosition, { align: 'center' });

    // Área de assinaturas
    const signatureY = 180;
    const leftSignX = 80;
    const rightSignX = pageWidth - 80;

    // Instituição
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text(data.institution, leftSignX, signatureY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Instituição', leftSignX, signatureY + 6, { align: 'center' });
    
    // Linha de assinatura da instituição
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(leftSignX - 35, signatureY - 5, leftSignX + 35, signatureY - 5);

    // Instrutor (se fornecido)
    if (data.instructor) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text(data.instructor, rightSignX, signatureY, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text('Instrutor', rightSignX, signatureY + 6, { align: 'center' });
      
      // Linha de assinatura do instrutor
      doc.line(rightSignX - 35, signatureY - 5, rightSignX + 35, signatureY - 5);
    }

    // Código de validação
    const validationCode = generateValidationCode();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Código de validação: ${validationCode}`, margin, pageHeight - 15);

    // Data de emissão
    const issueDate = new Date().toLocaleDateString('pt-BR');
    doc.text(`Emitido em: ${issueDate}`, pageWidth - margin, pageHeight - 15, { align: 'right' });

    // Salvar no Supabase Storage
    const pdfBlob = doc.output('blob');
    const fileName = `certificates/${data.studentName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    
    const { data: uploadResult, error } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBlob);

    if (error) {
      throw new Error(`Erro ao salvar certificado: ${error.message}`);
    }

    // Obter URL público
    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  static async saveCertificateRecord(certificateData: {
    student_id: string;
    course_id?: string;
    class_id?: string;
    file_url: string;
    certificate_type: string;
    issued_by: string;
  }) {
    const { data, error } = await supabase
      .from('certificates')
      .insert(certificateData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar registro do certificado: ${error.message}`);
    }

    return data;
  }

  static async getCertificatesByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        course:courses(name),
        class:classes(name),
        issued_by_profile:profiles!issued_by(full_name)
      `)
      .eq('student_id', studentId)
      .eq('status', 'ativo')
      .order('issue_date', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar certificados: ${error.message}`);
    }

    return data;
  }

  static async validateCertificate(validationCode: string) {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        student:profiles!student_id(full_name),
        course:courses(name),
        class:classes(name)
      `)
      .eq('validation_code', validationCode)
      .eq('status', 'ativo')
      .single();

    if (error) {
      throw new Error(`Certificado não encontrado ou inválido`);
    }

    return data;
  }
}

function generateValidationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}