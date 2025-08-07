// Serviço para comunicação (email e WhatsApp)
import { toast } from "sonner";

export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  id: string;
}

export interface NotificationTemplate {
  type: 'payment_reminder' | 'overdue_notice' | 'general_notice';
  subject: string;
  message: string;
}

interface EmailTemplate {
  subject: string;
  body: (studentName: string, amount: number, dueDate: string) => string;
}

interface WhatsAppTemplate {
  message: (studentName: string, amount: number, dueDateOrDays: string | number) => string;
}

interface MessageTemplate {
  email: EmailTemplate;
  whatsapp: WhatsAppTemplate;
}

export const communicationService = {
  // Templates de mensagens
  templates: {
    payment_reminder: {
      email: {
        subject: 'Lembrete de Pagamento - MIEADI',
        body: (studentName: string, amount: number, dueDate: string) => `
Olá ${studentName},

Este é um lembrete amigável sobre o pagamento pendente de sua mensalidade.

Valor: R$ ${amount.toFixed(2)}
Vencimento: ${dueDate}

Por favor, efetue o pagamento o quanto antes para manter sua matrícula ativa.

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
MIEADI - Ministério de Educação Cristã
        `
      },
      whatsapp: {
        message: (studentName: string, amount: number, dueDate: string | number) => `
🔔 *MIEADI - Lembrete de Pagamento*

Olá ${studentName}! 

Você possui uma mensalidade pendente:
💰 Valor: R$ ${amount.toFixed(2)}
📅 Vencimento: ${dueDate}

Para manter sua matrícula ativa, efetue o pagamento o quanto antes.

Dúvidas? Entre em contato conosco! 📞
        `
      }
    },
    overdue_notice: {
      email: {
        subject: 'Aviso de Vencimento - MIEADI',
        body: (studentName: string, amount: number, overdueDays: string) => `
Olá ${studentName},

Informamos que sua mensalidade está em atraso há ${overdueDays} dias.

Valor em atraso: R$ ${amount.toFixed(2)}

É importante regularizar sua situação para manter sua matrícula ativa e continuar participando das aulas.

Entre em contato conosco para negociar uma forma de pagamento.

Atenciosamente,
MIEADI - Ministério de Educação Cristã
        `
      },
      whatsapp: {
        message: (studentName: string, amount: number, overdueDays: string | number) => `
🚨 *MIEADI - Aviso de Vencimento*

${studentName}, sua mensalidade está em atraso!

💰 Valor: R$ ${amount.toFixed(2)}
⏰ Atraso: ${overdueDays} dias

Regularize sua situação para manter sua matrícula ativa.

Entre em contato para negociarmos! 📞
        `
      }
    }
  } as Record<string, MessageTemplate>,

  // Envia email individual
  sendEmail: async (contact: ContactInfo, template: NotificationTemplate) => {
    try {
      // Em produção, aqui seria integrado com um serviço de email como SendGrid, Mailgun, etc.
      // Por enquanto, vamos simular o envio
      
      console.log('Sending email:', {
        to: contact.email,
        subject: template.subject,
        message: template.message
      });

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Email enviado para ${contact.name}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Erro ao enviar email para ${contact.name}`);
      return { success: false, error };
    }
  },

  // Envia WhatsApp individual
  sendWhatsApp: async (contact: ContactInfo, message: string) => {
    try {
      // Remove caracteres especiais do telefone
      const cleanPhone = contact.phone?.replace(/\D/g, '') || '';
      
      if (!cleanPhone) {
        toast.error(`Telefone inválido para ${contact.name}`);
        return { success: false, error: 'Telefone inválido' };
      }

      // Formata mensagem para URL do WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
      
      // Abre WhatsApp Web
      window.open(whatsappUrl, '_blank');
      
      toast.success(`WhatsApp aberto para ${contact.name}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error(`Erro ao abrir WhatsApp para ${contact.name}`);
      return { success: false, error };
    }
  },

  // Envia lembretes em lote
  sendBulkReminders: async function (contacts: ContactInfo[], type: 'email' | 'whatsapp', templateType: 'payment_reminder' | 'overdue_notice') {
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    toast.info(`Iniciando envio para ${contacts.length} contatos...`);

    for (const contact of contacts) {
      try {
        const templateData = this.templates[templateType] as MessageTemplate;
        
        if (type === 'email' && contact.email && templateData.email) {
          const notificationTemplate: NotificationTemplate = {
            type: templateType,
            subject: templateData.email.subject,
            message: templateData.email.body(contact.name, 350, '31/01/2024')
          };
          
          const result = await this.sendEmail(contact, notificationTemplate);
          if (result.success) successCount++;
          else errorCount++;
          
          results.push({ contact: contact.id, type: 'email', success: result.success });
        } else if (type === 'whatsapp' && contact.phone && templateData.whatsapp) {
          const message = templateData.whatsapp.message(contact.name, 350, '31/01/2024');
          
          const result = await this.sendWhatsApp(contact, message);
          if (result.success) successCount++;
          else errorCount++;
          
          results.push({ contact: contact.id, type: 'whatsapp', success: result.success });
        }

        // Delay entre envios para evitar spam
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sending to ${contact.name}:`, error);
        errorCount++;
        results.push({ contact: contact.id, type, success: false, error });
      }
    }

    toast.success(`Envio concluído: ${successCount} sucessos, ${errorCount} erros`);
    return { results, successCount, errorCount };
  },

  // Registra tentativa de contato
  logContactAttempt: async (studentId: string, type: 'email' | 'phone' | 'whatsapp', success: boolean) => {
    try {
      // Em produção, isso salvaria no banco de dados
      const logEntry = {
        student_id: studentId,
        contact_type: type,
        attempted_at: new Date().toISOString(),
        success,
        created_at: new Date().toISOString()
      };

      console.log('Contact attempt logged:', logEntry);
      return { success: true, logEntry };
    } catch (error) {
      console.error('Error logging contact attempt:', error);
      return { success: false, error };
    }
  },

  // Obtém preview de template
  getTemplatePreview: (templateType: 'payment_reminder' | 'overdue_notice', communicationType: 'email' | 'whatsapp') => {
    const template = communicationService.templates[templateType];
    
    if (communicationType === 'email') {
      return template && template.email ? template.email.body('João Silva', 350, '31/01/2024') : 'Template não encontrado';
    } else {
      return template && template.whatsapp ? template.whatsapp.message('João Silva', 350, '31/01/2024') : 'Template não encontrado';
    }
  }
};