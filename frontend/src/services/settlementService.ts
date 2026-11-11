import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TripSettlement } from '../types';
import { initialSettlements, initialTrips, getStored, setStored } from '../lib/mockData';

export const settlementService = {
  async getAll(status?: string): Promise<(TripSettlement & { trip?: any; driver?: any })[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('trip_settlements')
        .select(`
          *,
          trip:trips(id, trip_number, guest_names, customer_name, trip_date, pickup_date, pickup_location, destination),
          driver:drivers(id, full_name, phone)
        `)
        .order('updated_at', { ascending: false });

      if (status) query = query.eq('settlement_status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data as (TripSettlement & { trip?: any; driver?: any })[];
    }

    let settlements: TripSettlement[] = getStored('settlements', initialSettlements);
    const trips = getStored('trips', initialTrips);
    const drivers = getStored('drivers', []);

    let enriched = settlements.map(s => ({
      ...s,
      trip: trips.find((t: any) => t.id === s.trip_id),
      driver: drivers.find((d: any) => d.id === s.driver_id),
    }));

    if (status && status !== 'all') {
      enriched = enriched.filter(s => s.settlement_status === status);
    }

    return enriched;
  },

  async verify(settlementId: string, _verifiedBy: string = 'admin', notes?: string): Promise<TripSettlement> {
    const settlements: TripSettlement[] = getStored('settlements', initialSettlements);
    const updated = settlements.map(s => {
      if (s.id === settlementId) {
        const diff = Number(s.settlement_difference) || 0;
        const newStatus = diff === 0 ? 'settled' : diff > 0 ? 'difference' : 'excess';
        return {
          ...s,
          settlement_status: newStatus as any,
          verified_at: new Date().toISOString(),
          admin_notes: notes || s.admin_notes || 'Verified by admin',
          updated_at: new Date().toISOString(),
        };
      }
      return s;
    });
    setStored('settlements', updated);

    if (isSupabaseConfigured) {
      const target = updated.find(s => s.id === settlementId);
      await supabase.from('trip_settlements').update({
        settlement_status: target?.settlement_status,
        verified_at: new Date().toISOString(),
        admin_notes: notes,
      }).eq('id', settlementId);
    }

    return updated.find(s => s.id === settlementId)!;
  },
};

