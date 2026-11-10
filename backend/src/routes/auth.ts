import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      return res.json({
        profile: {
          id: req.user!.id,
          role: req.user!.role,
          full_name: 'VillaLemon User',
          email: req.user!.email,
        },
      });
    }

    if (req.user!.role === 'driver') {
      const { data: driverData } = await supabaseAdmin
        .from('driver_employees')
        .select('*')
        .eq('user_id', req.user!.id)
        .single();

      return res.json({ profile: data, driver: driverData });
    }

    res.json({ profile: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify-role', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ role: req.user?.role, userId: req.user?.id });
});

export default router;

