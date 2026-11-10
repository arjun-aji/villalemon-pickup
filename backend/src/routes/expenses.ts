import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Save trip expenses (Driver)
router.post('/trip/:tripId', authenticate, async (req: AuthRequest, res: Response) => {
  const { tripId } = req.params;
  const {
    petrol_expense,
    other_expense,
    expense_description,
    expense_items,
    actual_amount_returned,
    notes,
  } = req.body;

  try {
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('amount_to_collect, driver_charge, assigned_driver_id')
      .eq('id', tripId)
      .single();

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const totalExpenses = Number(petrol_expense) + Number(other_expense);
    const netProfit =
      Number(trip.amount_to_collect) - Number(trip.driver_charge) - Number(petrol_expense) - Number(other_expense);
    const expectedReturn = netProfit;
    const settlementDiff = expectedReturn - Number(actual_amount_returned);

    const expenseData = {
      trip_id: tripId,
      driver_id: trip.assigned_driver_id,
      petrol_expense: Number(petrol_expense),
      other_expense: Number(other_expense),
      expense_description,
      expense_items: expense_items || [],
      actual_amount_returned: Number(actual_amount_returned),
      expected_return: expectedReturn,
      settlement_difference: settlementDiff,
      notes,
    };

    const { data: existing } = await supabaseAdmin
      .from('trip_expenses')
      .select('id')
      .eq('trip_id', tripId)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('trip_expenses')
        .update({ ...expenseData, updated_at: new Date().toISOString() })
        .eq('trip_id', tripId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('trip_expenses')
        .insert(expenseData)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Mark trip completed
    await supabaseAdmin
      .from('trips')
      .update({ trip_status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', tripId);

    // Update settlement
    await supabaseAdmin
      .from('trip_settlements')
      .update({
        petrol_expense: Number(petrol_expense),
        other_expenses: Number(other_expense),
        total_expenses: totalExpenses + Number(trip.driver_charge),
        net_profit: netProfit,
        expected_return: expectedReturn,
        actual_return: Number(actual_amount_returned),
        settlement_difference: settlementDiff,
        settlement_status: settlementDiff === 0 ? 'driver_submitted' : 'difference',
        updated_at: new Date().toISOString(),
      })
      .eq('trip_id', tripId);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get trip expenses
router.get('/trip/:tripId', authenticate, async (req: AuthRequest, res: Response) => {
  const { tripId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

