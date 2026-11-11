import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all trips
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, month, year, driver_id } = req.query;

    let query = supabaseAdmin
      .from('trips')
      .select(`
        *,
        driver:drivers(id, full_name, phone),
        settlement:trip_settlements(*),
        expenses:trip_expenses(petrol_expense, other_expense, actual_amount_returned)
      `)
      .order('pickup_date', { ascending: false });

    if (status) query = query.eq('trip_status', status as string);
    if (driver_id) query = query.eq('assigned_driver_id', driver_id as string);
    if (month && year) {
      const m = String(month).padStart(2, '0');
      query = query
        .gte('pickup_date', `${year}-${m}-01`)
        .lte('pickup_date', new Date(Number(year), Number(month), 0).toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create trip (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      customer_name,
      customer_phone,
      pickup_date,
      pickup_time,
      pickup_location,
      destination,
      flight_number,
      num_passengers,
      amount_to_collect,
      driver_charge,
      other_fixed_charges,
      placard_text,
      trip_notes,
      assigned_driver_id,
      is_published_for_enrollment,
    } = req.body;

    const { count } = await supabaseAdmin.from('trips').select('*', { count: 'exact', head: true });
    const tripNumber = `VH-${String((count || 0) + 1).padStart(3, '0')}`;
    const placard = placard_text || `VARKALA HOLIDAYS - ${customer_name.toUpperCase()}`;

    const tripStatus = assigned_driver_id
      ? 'assigned'
      : is_published_for_enrollment
      ? 'available_for_enrollment'
      : 'upcoming';

    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .insert({
        trip_number: tripNumber,
        customer_name,
        customer_phone,
        pickup_date,
        pickup_time,
        pickup_location,
        destination,
        flight_number,
        num_passengers: num_passengers || 1,
        amount_to_collect,
        driver_charge,
        other_fixed_charges: other_fixed_charges || 0,
        placard_text: placard,
        trip_notes,
        assigned_driver_id: assigned_driver_id || null,
        is_published_for_enrollment: Boolean(is_published_for_enrollment),
        trip_status: tripStatus,
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Create settlement record
    await supabaseAdmin.from('trip_settlements').insert({
      trip_id: trip.id,
      driver_id: assigned_driver_id || null,
      customer_collection: amount_to_collect,
      driver_charge,
      other_expenses: other_fixed_charges || 0,
      settlement_status: 'expense_pending',
    });

    res.status(201).json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update trip status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updates: any = { trip_status: status };
    if (status === 'in_progress') updates.started_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Assign driver to trip
router.post('/:id/assign', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { driver_id } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('trips')
      .update({
        assigned_driver_id: driver_id,
        trip_status: 'assigned',
        is_published_for_enrollment: false,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from('trip_settlements')
      .update({ driver_id })
      .eq('trip_id', id);

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

