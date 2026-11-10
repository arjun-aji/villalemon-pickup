import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Create driver account (Admin only)
router.post('/create', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const {
    full_name,
    employee_id,
    username,
    phone,
    email,
    vehicle_number,
    address,
    password,
  } = req.body;

  if (!full_name || !employee_id || !username || !phone || !password) {
    return res.status(400).json({
      error: 'Missing required fields: full_name, employee_id, username, phone, password',
    });
  }

  const driverEmail = email || `${username.toLowerCase()}@villalemon.pickup`;

  try {
    // Check if username already exists
    const { data: existing } = await supabaseAdmin
      .from('driver_employees')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: driverEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'driver',
        full_name,
        username: username.toLowerCase(),
      },
    });

    if (authError || !authData?.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create driver auth user' });
    }

    // Insert driver employee record
    const { data: driverData, error: driverError } = await supabaseAdmin
      .from('driver_employees')
      .insert({
        user_id: authData.user.id,
        employee_id,
        full_name,
        username: username.toLowerCase(),
        phone,
        email: driverEmail,
        vehicle_number,
        address,
        employment_status: 'active',
        is_first_login: true,
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (driverError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: driverError.message });
    }

    res.status(201).json({
      message: 'Driver employee account created successfully',
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
      .from('driver_employees')
      .select('user_id')
      .eq('id', driverId)
      .single();

    if (!driver?.user_id) {
      return res.status(404).json({ error: 'Driver user profile not found' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(driver.user_id, {
      password: new_password,
    });

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin
      .from('driver_employees')
      .update({ is_first_login: true })
      .eq('id', driverId);

    res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deactivate / Activate driver (Admin only)
router.patch('/:driverId/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { driverId } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid employment status' });
  }

  try {
    const { data: driver } = await supabaseAdmin
      .from('driver_employees')
      .select('user_id')
      .eq('id', driverId)
      .single();

    if (driver?.user_id) {
      await supabaseAdmin
        .from('profiles')
        .update({ is_active: status === 'active' })
        .eq('id', driver.user_id);
    }

    const { data, error } = await supabaseAdmin
      .from('driver_employees')
      .update({ employment_status: status })
      .eq('id', driverId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: `Driver status updated to ${status}`, driver: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List all drivers
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('driver_employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

