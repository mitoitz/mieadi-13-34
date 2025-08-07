import { supabase } from "@/integrations/supabase/client";
import { financialService, type TuitionFee } from "./financial.service";

export interface AutoBillingRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  billing_day: number; // Dia do mês para cobrança (1-31)
  amount: number;
  class_id?: string;
  subject_id?: string;
  student_ids?: string[]; // IDs específicos ou null para todos
  created_at: string;
  updated_at: string;
}

export interface AutoBillingExecution {
  id: string;
  rule_id: string;
  execution_date: string;
  fees_generated: number;
  total_amount: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
  created_at: string;
}

export const financialAutomationService = {
  // Gerenciamento de Regras de Cobrança
  async createBillingRule(rule: Omit<AutoBillingRule, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await supabase
      .from('auto_billing_rules')
      .insert(rule);

    if (error) throw error;
  },

  async getBillingRules(): Promise<AutoBillingRule[]> {
    const { data, error } = await supabase
      .from('auto_billing_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateBillingRule(ruleId: string, updates: Partial<AutoBillingRule>): Promise<void> {
    const { error } = await supabase
      .from('auto_billing_rules')
      .update(updates)
      .eq('id', ruleId);

    if (error) throw error;
  },

  async deleteBillingRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('auto_billing_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  },

  // Execução de Cobrança Automática
  async executeAutoBilling(): Promise<AutoBillingExecution[]> {
    const executions: AutoBillingExecution[] = [];
    
    try {
      // Buscar regras ativas
      const rules = await this.getBillingRules();
      const activeRules = rules.filter(rule => rule.active);
      
      const today = new Date();
      const currentDay = today.getDate();
      
      for (const rule of activeRules) {
        // Verificar se é o dia da cobrança
        if (rule.billing_day !== currentDay) {
          continue;
        }
        
        // Por enquanto, assumir que não foi executado hoje
        const existingExecution = null;
          
        if (existingExecution) {
          continue; // Já executado hoje
        }
        
        try {
          const execution = await this.executeRule(rule);
          executions.push(execution);
        } catch (error) {
          console.error(`Error executing rule ${rule.id}:`, error);
          // Registrar execução com erro
          const errorExecution: AutoBillingExecution = {
            id: crypto.randomUUID(),
            rule_id: rule.id,
            execution_date: today.toISOString().split('T')[0],
            fees_generated: 0,
            total_amount: 0,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            created_at: today.toISOString()
          };
          
          await this.saveExecution(errorExecution);
          executions.push(errorExecution);
        }
      }
      
      return executions;
    } catch (error) {
      console.error('Error in auto billing execution:', error);
      throw error;
    }
  },

  async executeRule(rule: AutoBillingRule): Promise<AutoBillingExecution> {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, rule.billing_day);
    
    let studentIds: string[] = [];
    
    if (rule.student_ids && rule.student_ids.length > 0) {
      studentIds = rule.student_ids;
    } else {
      // Buscar todos os alunos matriculados
      let query = supabase
        .from('enrollments')
        .select('student_id')
        .eq('status', 'active');
        
      if (rule.class_id) {
        query = query.eq('class_id', rule.class_id);
      }
      
      const { data: enrollments, error } = await query;
      if (error) throw error;
      
      studentIds = enrollments?.map(e => e.student_id) || [];
    }
    
    let feesGenerated = 0;
    let totalAmount = 0;
    
    // Criar cobranças para cada aluno
    for (const studentId of studentIds) {
      try {
        const fee: Omit<TuitionFee, 'id' | 'created_at' | 'updated_at'> = {
          student_id: studentId,
          class_id: rule.class_id || '',
          due_date: dueDate.toISOString().split('T')[0],
          amount: rule.amount,
          status: 'pending',
          notes: `Cobrança automática: ${rule.name}`
        };
        
        await financialService.createTuitionFee(fee);
        feesGenerated++;
        totalAmount += rule.amount;
      } catch (error) {
        console.error(`Error creating fee for student ${studentId}:`, error);
      }
    }
    
    const execution: AutoBillingExecution = {
      id: crypto.randomUUID(),
      rule_id: rule.id,
      execution_date: today.toISOString().split('T')[0],
      fees_generated: feesGenerated,
      total_amount: totalAmount,
      status: feesGenerated === studentIds.length ? 'success' : 'partial',
      created_at: today.toISOString()
    };
    
    await this.saveExecution(execution);
    return execution;
  },

  async saveExecution(execution: AutoBillingExecution): Promise<void> {
    const { error } = await supabase
      .from('auto_billing_executions')
      .insert(execution);

    if (error) throw error;
  },

  async getExecutionHistory(ruleId?: string): Promise<AutoBillingExecution[]> {
    let query = supabase
      .from('auto_billing_executions')
      .select('*')
      .order('created_at', { ascending: false });

    if (ruleId) {
      query = query.eq('rule_id', ruleId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Type assertion para garantir que o status está correto
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'success' | 'partial' | 'failed'
    }));
  },

  // Utilitários
  async scheduleAutoBilling(): Promise<void> {
    // Esta função seria chamada por um job scheduler (cron job)
    try {
      const executions = await this.executeAutoBilling();
      console.log(`Auto billing executed: ${executions.length} rules processed`);
    } catch (error) {
      console.error('Scheduled auto billing failed:', error);
    }
  }
};