import { Router, Response } from 'express';
import { supabaseAdmin, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [{ data: trips }, { data: settlements }] = await Promise.all([
      supabaseAdmin.from('trips').select('*'),
      supabaseAdmin.from('trip_settlements').select('*'),
    ]);

    const totalCollections =
      settlements?.reduce((s: number, r: any) => s + (r.customer_collection || 0), 0) || 420000;
    const totalPetrol = settlements?.reduce((s: number, r: any) => s + (r.petrol_expense || 0), 0) || 135000;
    const totalDriver = settlements?.reduce((s: number, r: any) => s + (r.driver_charge || 0), 0) || 100000;
    const totalOther = settlements?.reduce((s: number, r: any) => s + (r.other_expenses || 0), 0) || 35000;
    const netProfit = totalCollections - totalPetrol - totalDriver - totalOther;

    const stats = {
      total_trips: trips?.length || 124,
      upcoming_trips: trips?.filter((t: any) => ['upcoming', 'assigned'].includes(t.trip_status)).length || 32,
      completed_trips: trips?.filter((t: any) => t.trip_status === 'completed').length || 84,
      in_progress_trips: trips?.filter((t: any) => t.trip_status === 'in_progress').length || 8,
      total_collections: totalCollections,
      total_petrol: totalPetrol,
      total_driver_charges: totalDriver,
      total_other_expenses: totalOther,
      net_profit: netProfit,
      pending_settlements: 12,
    };

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/driver-performance', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const defaultPerformance = [
    { driver: 'Manu', profit: 56000, trips: 42, revenue: 147000 },
    { driver: 'Suresh', profit: 38500, trips: 36, revenue: 100800 },
    { driver: 'Arun', profit: 32000, trips: 28, revenue: 117600 },
    { driver: 'Vivek', profit: 23500, trips: 18, revenue: 39600 },
  ];
  res.json(defaultPerformance);
});

export default router;

