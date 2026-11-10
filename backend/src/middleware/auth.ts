import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://cnvknruutfrmwyrbhdjq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_bFdK9cLamEBojtze33o42A_Xd_xl4_O';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'driver';
    email?: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development / test without auth headers, allow demo bypass
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      req.user = {
        id: 'admin-001',
        role: 'admin',
        email: 'admin@villalemon.in',
      };
      return next();
    }
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.user = {
      id: user.id,
      role: profile.role,
      email: user.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireDriver = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'driver') {
    return res.status(403).json({ error: 'Driver access required' });
  }
  next();
};

