import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all enrollment requests
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trip_enrollments')
      .select(`
        *,
        trip:trips(id, trip_number, customer_name, pickup_date, pickup_location, destination),
        driver:driver_employees(id, full_name, username, vehicle_number, employee_id)
      `)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Driver submits enrollment request
router.post('/enroll', authenticate, async (req: AuthRequest, res: Response) => {
  const { trip_id, driver_id } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('trip_enrollments')
      .insert({
        trip_id,
        driver_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin approves enrollment
router.post('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { data: enrollment } = await supabaseAdmin
      .from('trip_enrollments')
      .select('*')
      .eq('id', id)
      .single();

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    await supabaseAdmin
      .from('trip_enrollments')
      .update({ status: 'approved', reviewed_by: req.user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    await supabaseAdmin
      .from('trips')
      .update({
        assigned_driver_id: enrollment.driver_id,
        trip_status: 'assigned',
        is_published_for_enrollment: false,
      })
      .eq('id', enrollment.trip_id);

    await supabaseAdmin
      .from('trip_settlements')
      .update({ driver_id: enrollment.driver_id })
      .eq('trip_id', enrollment.trip_id);

    // Reject others
    await supabaseAdmin
      .from('trip_enrollments')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('trip_id', enrollment.trip_id)
      .neq('id', id)
      .eq('status', 'pending');

    res.json({ message: 'Enrollment approved and trip assigned to driver' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin rejects enrollment
router.post('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('trip_enrollments')
      .update({
        status: 'rejected',
        reviewed_by: req.user!.id,
        reviewed_at: new Date().toISOString(),
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

