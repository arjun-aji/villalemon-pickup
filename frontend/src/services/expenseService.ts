import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TripExpense, ExpenseItem, SettlementStatus } from '../types';
import { initialExpenses, initialSettlements, getStored, setStored } from '../lib/mockData';
import { calculateFinancials } from '../utils/formatters';

export const expenseService = {
  async getByTrip(tripId: string): Promise<TripExpense | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('trip_expenses')
        .select('*')
        .eq('trip_id', tripId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as TripExpense | null;
    }

    const expenses: TripExpense[] = getStored('expenses', initialExpenses);
    return expenses.find(e => e.trip_id === tripId) || null;
  },

  async saveExpenses(input: {
    trip_id: string;
    driver_id: string;
    petrol_expense: number;
    other_expense: number;
    expense_description?: string;
    expense_items?: ExpenseItem[];
    actual_amount_returned: number;
    notes?: string;
    customer_collection: number;
    driver_charge: number;
  }): Promise<TripExpense> {
    const fin = calculateFinancials(
      input.customer_collection,
      input.petrol_expense,
      input.driver_charge,
      input.other_expense,
      input.actual_amount_returned
    );

    const expenseRecord: TripExpense = {
      id: `exp-${Date.now()}`,
      trip_id: input.trip_id,
      driver_id: input.driver_id,
      petrol_expense: Number(input.petrol_expense),
      other_expense: Number(input.other_expense),
      expense_description: input.expense_description || '',
      expense_items: input.expense_items || [],
      actual_amount_returned: Number(input.actual_amount_returned),
      total_expenses: Number(input.petrol_expense) + Number(input.other_expense),
      expected_return: fin.expectedReturn,
      settlement_difference: fin.settlementDifference,
      receipt_urls: [],
      notes: input.notes,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      await supabase.from('trip_expenses').upsert(expenseRecord, { onConflict: 'trip_id' });
      await supabase.from('trip_settlements').upsert({
        trip_id: input.trip_id,
        driver_id: input.driver_id,
        customer_collection: Number(input.customer_collection),
        petrol_expense: Number(input.petrol_expense),
        driver_charge: Number(input.driver_charge),
        other_expenses: Number(input.other_expense),
        total_expenses: fin.totalExpenses,
        net_profit: fin.netProfit,
        expected_return: fin.expectedReturn,
        actual_return: Number(input.actual_amount_returned),
        settlement_difference: fin.settlementDifference,
        settlement_status: (fin.settlementDifference === 0 ? 'driver_submitted' : 'difference') as SettlementStatus,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'trip_id' });
      return expenseRecord;
    }

    // Local Storage save
    const expenses: TripExpense[] = getStored('expenses', initialExpenses);
    const existingIndex = expenses.findIndex(e => e.trip_id === input.trip_id);
    let updatedExpenses: TripExpense[];
    if (existingIndex >= 0) {
      updatedExpenses = [...expenses];
      updatedExpenses[existingIndex] = { ...expenses[existingIndex], ...expenseRecord };
    } else {
      updatedExpenses = [expenseRecord, ...expenses];
    }
    setStored('expenses', updatedExpenses);

    // Update settlements
    const settlements = getStored('settlements', initialSettlements);
    const sIndex = settlements.findIndex((s: any) => s.trip_id === input.trip_id);
    const updatedSettlement = {
      id: sIndex >= 0 ? settlements[sIndex].id : `s-${Date.now()}`,
      trip_id: input.trip_id,
      driver_id: input.driver_id,
      customer_collection: Number(input.customer_collection),
      petrol_expense: Number(input.petrol_expense),
      driver_charge: Number(input.driver_charge),
      other_expenses: Number(input.other_expense),
      total_expenses: fin.totalExpenses,
      net_profit: fin.netProfit,
      expected_return: fin.expectedReturn,
      actual_return: Number(input.actual_amount_returned),
      settlement_difference: fin.settlementDifference,
      settlement_status: (fin.settlementDifference === 0 ? 'driver_submitted' : 'difference') as SettlementStatus,
      updated_at: new Date().toISOString(),
      created_at: sIndex >= 0 ? settlements[sIndex].created_at : new Date().toISOString(),
    };

    if (sIndex >= 0) {
      settlements[sIndex] = updatedSettlement;
      setStored('settlements', [...settlements]);
    } else {
      setStored('settlements', [updatedSettlement, ...settlements]);
    }

    return expenseRecord;
  },
};
