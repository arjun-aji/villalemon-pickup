import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all settlements (Admin)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  try {
    let query = supabaseAdmin
      .from('trip_settlements')
      .select(`
        *,
        trip:trips(id, trip_number, customer_name, pickup_date, pickup_location, destination),
        driver:drivers(id, full_name, phone)
      `)
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('settlement_status', status as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify settlement (Admin)
router.post('/:id/verify', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    const { data: settlement } = await supabaseAdmin
      .from('trip_settlements')
      .select('settlement_difference')
      .eq('id', id)
      .single();

    const diff = Number(settlement?.settlement_difference) || 0;
    const newStatus = diff === 0 ? 'settled' : diff > 0 ? 'difference' : 'excess';

    const { data, error } = await supabaseAdmin
      .from('trip_settlements')
      .update({
        settlement_status: newStatus,
        verified_by: req.user!.id,
        verified_at: new Date().toISOString(),
        admin_notes: notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Settlement verified and locked', settlement: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

