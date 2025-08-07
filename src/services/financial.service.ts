import { supabase } from "@/integrations/supabase/client";

export interface TuitionFee {
  id: string;
  student_id: string;
  class_id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  monthlyRevenue?: number;
  studentsWithPendingPayments: number;
}

export const financialService = {
  async getTuitionFees(filters?: { status?: string; student_id?: string; class_id?: string }): Promise<any[]> {
    let query = supabase
      .from('tuition_fees')
      .select(`
        *,
        student:profiles!tuition_fees_student_id_fkey(
          full_name,
          email,
          phone
        ),
        class:classes(
          name,
          subject:subjects(name)
        )
      `)
      .order('due_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id);
    }
    if (filters?.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTuitionFee(fee: Omit<TuitionFee, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await supabase
      .from('tuition_fees')
      .insert(fee);

    if (error) throw error;
  },

  async updateTuitionFee(feeId: string, updates: Partial<TuitionFee>): Promise<void> {
    const { error } = await supabase
      .from('tuition_fees')
      .update(updates)
      .eq('id', feeId);

    if (error) throw error;
  },

  async recordPayment(feeId: string, paymentMethod: string, paymentDate?: string): Promise<void> {
    const { error } = await supabase
      .from('tuition_fees')
      .update({
        status: 'paid',
        payment_method: paymentMethod,
        payment_date: paymentDate || new Date().toISOString().split('T')[0]
      })
      .eq('id', feeId);

    if (error) throw error;
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    const { data: fees, error } = await supabase
      .from('tuition_fees')
      .select('amount, status, student_id');

    if (error) throw error;

    if (!fees || fees.length === 0) {
      return {
        totalReceived: 0,
        totalPending: 0,
        totalOverdue: 0,
        monthlyRevenue: 0,
        studentsWithPendingPayments: 0
      };
    }

    const summary = fees.reduce((acc, fee) => {
      switch (fee.status) {
        case 'paid':
          acc.totalReceived += fee.amount;
          break;
        case 'pending':
          acc.totalPending += fee.amount;
          break;
        case 'overdue':
          acc.totalOverdue += fee.amount;
          break;
      }
      return acc;
    }, {
      totalReceived: 0,
      totalPending: 0,
      totalOverdue: 0,
      monthlyRevenue: 0,
      studentsWithPendingPayments: 0
    });

    // Count unique students with pending payments
    const studentsWithPending = new Set(
      fees.filter(f => f.status === 'pending' || f.status === 'overdue')
        .map(f => f.student_id)
    ).size;

    return {
      ...summary,
      studentsWithPendingPayments: studentsWithPending
    };
  },

  async markOverdueFees(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('tuition_fees')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today);

    if (error) throw error;
  }
};