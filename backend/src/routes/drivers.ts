import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Create driver account (Admin only)
router.post('/create', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const {
    full_name,
    phone,
    username,
    password,
    driving_licence_no,
    employment_type,
    monthly_salary,
    per_trip_payment,
  } = req.body;

  if (!full_name || !phone || !password) {
    return res.status(400).json({
      error: 'Missing required fields: full_name, phone, password',
    });
  }

  const cleanUsername = (username || phone).toLowerCase();
  const driverEmail = `${cleanUsername}@villalemon.pickup`;

  try {
    // Check if phone or driver already exists
    const { data: existing } = await supabaseAdmin
      .from('drivers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Driver with this phone number already exists' });
    }

    // Create Supabase Auth user
    let authUserId: string | null = null;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: driverEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'driver',
        full_name,
        username: cleanUsername,
      },
    });

    if (authError || !authData?.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create driver auth user' });
    }
    authUserId = authData.user.id;

    // Create profile
    await supabaseAdmin.from('profiles').upsert({
      id: authUserId,
      email: driverEmail,
      full_name,
      phone,
      role: 'driver',
      is_active: true,
    });

    // Insert driver record
    const { data: driverData, error: driverError } = await supabaseAdmin
      .from('drivers')
      .insert({
        profile_id: authUserId,
        full_name,
        phone,
        driving_licence_no: driving_licence_no || 'PENDING',
        employment_type: employment_type || 'Per-trip payment',
        monthly_salary: Number(monthly_salary) || 0.00,
        per_trip_payment: Number(per_trip_payment) || 500.00,
        status: 'Active',
      })
      .select()
      .single();

    if (driverError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return res.status(400).json({ error: driverError.message });
    }

    res.status(201).json({
      message: 'Driver account created successfully',
      driver: driverData,
      loginEmail: driverEmail,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset driver password (Admin only)
router.post('/:driverId/reset-password', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { driverId } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { data: driver } = await supabaseAdmin
      .from('drivers')
      .select('profile_id')
      .eq('id', driverId)
      .single();

    if (!driver?.profile_id) {
      return res.status(404).json({ error: 'Driver auth profile not found' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(driver.profile_id, {
      password: new_password,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deactivate / Activate driver (Admin only)
router.patch('/:driverId/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { driverId } = req.params;
  const { status } = req.body;

  const dbStatus = status === 'active' || status === 'Active' ? 'Active' : 'Inactive';

  try {
    const { data: driver } = await supabaseAdmin
      .from('drivers')
      .select('profile_id')
      .eq('id', driverId)
      .single();

    if (driver?.profile_id) {
      await supabaseAdmin
        .from('profiles')
        .update({ is_active: dbStatus === 'Active' })
        .eq('id', driver.profile_id);
    }

    const { data, error } = await supabaseAdmin
      .from('drivers')
      .update({ status: dbStatus })
      .eq('id', driverId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: `Driver status updated to ${dbStatus}`, driver: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List all drivers
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
