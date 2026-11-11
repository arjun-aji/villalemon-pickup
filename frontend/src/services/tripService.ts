import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Trip, CreateTripInput, TripStatus, DashboardStats } from '../types';
import { initialTrips, initialSettlements, getStored, setStored } from '../lib/mockData';

export const tripService = {
  async getAll(filters?: { status?: TripStatus; month?: number; year?: number; driverId?: string }): Promise<Trip[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('trips')
          .select(`
            *,
            driver:drivers(id, full_name, phone, driving_licence_no, monthly_salary, per_trip_payment, status),
            vehicle:vehicles(id, registration_number, vehicle_type, status),
            organization:organizations(id, name, type, contact_person, phone)
          `)
          .order('trip_date', { ascending: false });

        if (filters?.status) query = query.eq('trip_status', filters.status);
        if (filters?.driverId) query = query.eq('assigned_driver_id', filters.driverId);
        if (filters?.month && filters?.year) {
          const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
          const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
          query = query.gte('trip_date', start).lte('trip_date', end);
        }

        const { data, error } = await query;
        if (!error && data) return data as Trip[];
      } catch (e) {
        console.warn('Trip query fallback note:', e);
      }
    }

    // Mock storage
    let trips: Trip[] = getStored('trips', initialTrips);
    const settlements = getStored('settlements', initialSettlements);
    const drivers = getStored('drivers', []);

    trips = trips.map(t => ({
      ...t,
      driver: drivers.find((d: any) => d.id === t.assigned_driver_id) || t.driver,
      settlement: settlements.find((s: any) => s.trip_id === t.id) || t.settlement,
    }));

    if (filters?.status) {
      trips = trips.filter(t => t.trip_status === filters.status);
    }
    if (filters?.driverId) {
      trips = trips.filter(t => t.assigned_driver_id === filters.driverId);
    }
    if (filters?.month && filters?.year) {
      trips = trips.filter(t => {
        const d = new Date(t.pickup_date || t.trip_date || 0);
        return d.getMonth() + 1 === filters.month && d.getFullYear() === filters.year;
      });
    }

    return trips.sort((a, b) => new Date(b.pickup_date || b.trip_date || 0).getTime() - new Date(a.pickup_date || a.trip_date || 0).getTime());
  },

  async getById(id: string): Promise<Trip | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          driver:driver_employees(*),
          settlement:trip_settlements(*),
          expenses:trip_expenses(*),
          enrollments:trip_enrollments(*, driver:driver_employees(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Trip;
    }

    const trips: Trip[] = getStored('trips', initialTrips);
    const trip = trips.find(t => t.id === id);
    if (!trip) return null;

    const drivers = getStored('drivers', []);
    const settlements = getStored('settlements', initialSettlements);
    const expenses = getStored('expenses', []);

    return {
      ...trip,
      driver: drivers.find((d: any) => d.id === trip.assigned_driver_id) || trip.driver,
      settlement: settlements.find((s: any) => s.trip_id === trip.id) || trip.settlement,
      expenses: expenses.find((e: any) => e.trip_id === trip.id),
    };
  },

  async getAvailableForEnrollment(): Promise<Trip[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('trips')
        .select('*, driver:driver_employees(full_name)')
        .eq('is_published_for_enrollment', true)
        .in('trip_status', ['available_for_enrollment', 'upcoming'])
        .is('assigned_driver_id', null)
        .order('pickup_date', { ascending: true });

      if (error) throw error;
      return data as Trip[];
    }

    const trips: Trip[] = getStored('trips', initialTrips);
    return trips.filter(t => t.is_published_for_enrollment && !t.assigned_driver_id);
  },

  async getDriverTrips(driverId: string): Promise<Trip[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('trips')
        .select('*, settlement:trip_settlements(*), expenses:trip_expenses(*)')
        .eq('assigned_driver_id', driverId)
        .order('pickup_date', { ascending: false });

      if (error) throw error;
      return data as Trip[];
    }

    const trips: Trip[] = getStored('trips', initialTrips);
    const settlements = getStored('settlements', initialSettlements);
    const expenses = getStored('expenses', []);

    return trips
      .filter(t => t.assigned_driver_id === driverId)
      .map(t => ({
        ...t,
        settlement: settlements.find((s: any) => s.trip_id === t.id),
        expenses: expenses.find((e: any) => e.trip_id === t.id),
      }));
  },

  async create(input: CreateTripInput, createdBy: string = 'admin'): Promise<Trip> {
    const trips: Trip[] = getStored('trips', initialTrips);
    const tripCount = trips.length + 1;
    const tripNumber = `VH-${String(tripCount).padStart(3, '0')}`;
    const customerName = input.customer_name || input.guest_names || 'Guest';
    const placardText = input.placard_text || `VARKALA HOLIDAYS - ${customerName.toUpperCase()}`;

    const tripStatus: TripStatus = input.assigned_driver_id
      ? 'assigned'
      : input.is_published_for_enrollment
      ? 'available_for_enrollment'
      : 'upcoming';

    const newTrip: Trip = {
      id: `t-${Date.now()}`,
      trip_number: tripNumber,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      pickup_date: input.pickup_date,
      pickup_time: input.pickup_time,
      pickup_location: input.pickup_location,
      destination: input.destination,
      flight_number: input.flight_number,
      num_passengers: input.num_passengers || 1,
      amount_to_collect: Number(input.amount_to_collect),
      driver_charge: Number(input.driver_charge),
      other_fixed_charges: Number(input.other_fixed_charges || 0),
      placard_text: placardText,
      trip_notes: input.trip_notes,
      assigned_driver_id: input.assigned_driver_id,
      trip_status: tripStatus,
      is_published_for_enrollment: Boolean(input.is_published_for_enrollment),
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
      const tripPayload: any = {
        organization_id: isUuid(input.organization_id) ? input.organization_id : null,
        ordered_by: input.ordered_by || input.customer_name || 'Front Desk',
        trip_date: input.trip_date || input.pickup_date || new Date().toISOString().split('T')[0],
        pickup_time: input.pickup_time || '10:00',
        trip_category: input.trip_category || 'Airport Pick-up',
        guest_names: input.guest_names || input.customer_name || 'Guest',
        guest_contact_number: input.guest_contact_number || input.customer_phone || null,
        total_people: Number(input.total_people || input.num_passengers || 1),
        pickup_location: input.pickup_location,
        dropoff_location: input.dropoff_location || input.destination,
        final_dropoff: input.final_dropoff || null,
        flight_number_and_time: input.flight_number_and_time || input.flight_number || null,
        airport_terminal: input.airport_terminal || null,
        required_cab_type: input.required_cab_type || 'Sedan',
        special_instructions: input.special_instructions || input.trip_notes || null,
        assigned_driver_id: isUuid(input.assigned_driver_id) ? input.assigned_driver_id : null,
        assigned_vehicle_id: isUuid(input.assigned_vehicle_id) ? input.assigned_vehicle_id : null,
        trip_selling_price: Number(input.trip_selling_price || input.amount_to_collect || 0),
        amount_driver_must_collect: Number(input.amount_driver_must_collect || input.amount_to_collect || 0),
        collection_rule: input.collection_rule || 'Collect',
        driver_trip_pay_override: input.driver_trip_pay_override ? Number(input.driver_trip_pay_override) : (input.driver_charge ? Number(input.driver_charge) : null),
        trip_status: input.trip_status || (input.assigned_driver_id ? 'Assigned' : 'Confirmed'),
        is_published_for_enrollment: Boolean(input.is_published_for_enrollment),
        submitted_by_org: Boolean(input.submitted_by_org),
        created_by: isUuid(createdBy) ? createdBy : null,
      };

      const { data, error } = await supabase.from('trips').insert(tripPayload).select().single();
      if (error) {
        console.error('Supabase trip insert error:', error);
        // Fallback with base columns if extra columns differ
      } else if (data) {
        return data as Trip;
      }
    }

    // Save in local storage
    const updatedTrips = [newTrip, ...trips];
    setStored('trips', updatedTrips);

    // Create settlement record
    const settlements = getStored('settlements', initialSettlements);
    const amountToCollect = Number(newTrip.amount_to_collect || newTrip.amount_driver_must_collect || 0);
    const driverCharge = Number(newTrip.driver_charge || newTrip.driver_trip_pay_override || 0);
    const otherCharges = Number(newTrip.other_fixed_charges || 0);
    const totalExp = driverCharge + otherCharges;
    const diff = amountToCollect - totalExp;

    const newSettlement = {
      id: `s-${Date.now()}`,
      trip_id: newTrip.id,
      driver_id: input.assigned_driver_id,
      customer_collection: amountToCollect,
      petrol_expense: 0,
      driver_charge: driverCharge,
      other_expenses: otherCharges,
      total_expenses: totalExp,
      net_profit: diff,
      expected_return: diff,
      actual_return: 0,
      settlement_difference: diff,
      settlement_status: 'expense_pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStored('settlements', [newSettlement, ...settlements]);

    return newTrip;
  },

  async updateStatus(id: string, status: TripStatus): Promise<Trip> {
    const trips: Trip[] = getStored('trips', initialTrips);
    const updated = trips.map(t => {
      if (t.id === id) {
        return {
          ...t,
          trip_status: status,
          started_at: status === 'in_progress' ? new Date().toISOString() : t.started_at,
          completed_at: status === 'completed' ? new Date().toISOString() : t.completed_at,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setStored('trips', updated);

    if (isSupabaseConfigured) {
      await supabase.from('trips').update({ trip_status: status }).eq('id', id);
    }

    return updated.find(t => t.id === id)!;
  },

  async assignDriver(tripId: string, driverId: string): Promise<Trip> {
    const trips: Trip[] = getStored('trips', initialTrips);
    const drivers = getStored('drivers', []);
    const assignedDriver = drivers.find((d: any) => d.id === driverId);

    const updated = trips.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          assigned_driver_id: driverId,
          driver: assignedDriver || t.driver,
          trip_status: 'assigned' as TripStatus,
          is_published_for_enrollment: false,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setStored('trips', updated);

    // Update settlement
    const settlements = getStored('settlements', initialSettlements);
    const updatedSettlements = settlements.map((s: any) => {
      if (s.trip_id === tripId) {
        return { ...s, driver_id: driverId };
      }
      return s;
    });
    setStored('settlements', updatedSettlements);

    if (isSupabaseConfigured) {
      await supabase.from('trips').update({ assigned_driver_id: driverId, trip_status: 'assigned', is_published_for_enrollment: false }).eq('id', tripId);
      await supabase.from('trip_settlements').update({ driver_id: driverId }).eq('trip_id', tripId);
    }

    return updated.find(t => t.id === tripId)!;
  },

  async publishForEnrollment(tripId: string): Promise<Trip> {
    const trips: Trip[] = getStored('trips', initialTrips);
    const updated = trips.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          is_published_for_enrollment: true,
          trip_status: 'available_for_enrollment' as TripStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setStored('trips', updated);

    if (isSupabaseConfigured) {
      await supabase.from('trips').update({ is_published_for_enrollment: true, trip_status: 'available_for_enrollment' }).eq('id', tripId);
    }

    return updated.find(t => t.id === tripId)!;
  },

  async getDashboardStats(month?: number, year?: number): Promise<DashboardStats> {
    if (isSupabaseConfigured) {
      try {
        let tripsQuery = supabase.from('trips').select('*');
        if (month && year) {
          const start = `${year}-${String(month).padStart(2, '0')}-01`;
          const end = new Date(year, month, 0).toISOString().split('T')[0];
          tripsQuery = tripsQuery.gte('trip_date', start).lte('trip_date', end);
        }

        const [
          { data: trips },
          { data: financials },
          { data: clientSummaries },
          { data: driverBalances },
          { data: docAlerts },
          { data: expenses }
        ] = await Promise.all([
          tripsQuery,
          supabase.from('v_trip_financials').select('*'),
          supabase.from('v_client_summary').select('*'),
          supabase.from('v_driver_balances').select('*'),
          supabase.from('v_vehicle_document_alerts').select('*'),
          supabase.from('expenses').select('*')
        ]);

        const tripList = trips || [];
        const finList = financials || [];
        const clientList = clientSummaries || [];
        const driverList = driverBalances || [];
        const alertsList = docAlerts || [];
        const expenseList = expenses || [];

        // Real calculations matching Excel formulas
        const completedTrips = tripList.filter(t => 
          t.trip_status === 'Completed' || t.trip_status === 'completed'
        );
        const upcomingTrips = tripList.filter(t => 
          ['Confirmed', 'Assigned', 'upcoming', 'assigned', 'Pending Approval'].includes(t.trip_status)
        );
        const pendingApproval = tripList.filter(t => 
          t.trip_status === 'Pending Approval' || t.trip_status === 'available_for_enrollment'
        );

        // Revenue from completed trips
        const totalRevenue = completedTrips.reduce((sum, t) => 
          sum + (Number(t.trip_selling_price) || 0), 0
        );

        // Expenses: driver reports + office general expenses
        const tripExpenses = finList.reduce((sum, f) => 
          sum + (Number(f.total_trip_expenses) || 0), 0
        );
        const officeExpenses = expenseList.reduce((sum, e) => 
          sum + (Number(e.amount) || 0), 0
        );
        const totalExpenses = Math.max(tripExpenses, officeExpenses);
        const netProfit = totalRevenue - totalExpenses;

        // Client Outstanding & Over limit count
        const totalClientOutstanding = clientList.reduce((sum, c) => 
          sum + (Number(c.outstanding_amount) || 0), 0
        );
        const overLimitClientsCount = clientList.filter(c => c.credit_status === 'OVER LIMIT').length;

        // Driver Payable & Driver Cash held
        const totalDriverPayable = driverList.reduce((sum, d) => 
          sum + Math.max(Number(d.balance_payable_to_driver) || 0, 0), 0
        );
        const totalDriverCashHeld = driverList.reduce((sum, d) => 
          sum + Math.max(Number(d.cash_owed_to_office) || 0, 0), 0
        );

        // Vehicle Document alerts count
        const activeDocAlertsCount = alertsList.filter(a => a.document_alert && a.document_alert !== 'OK').length;

        return {
          total_trips: tripList.length,
          upcoming_trips: upcomingTrips.length,
          completed_trips: completedTrips.length,
          in_progress_trips: tripList.filter(t => t.trip_status === 'On Trip' || t.trip_status === 'in_progress').length,
          pending_approval_trips: pendingApproval.length,
          total_collections: totalRevenue,
          total_petrol: finList.reduce((s, f) => s + (Number(f.diesel_reported) || 0), 0),
          total_driver_charges: finList.reduce((s, f) => s + (Number(f.driver_trip_pay) || 0), 0),
          total_other_expenses: finList.reduce((s, f) => s + (Number(f.parking_toll_food_reported) || 0), 0),
          total_expenses: totalExpenses,
          net_profit: netProfit,
          total_revenue: totalRevenue,
          client_outstanding: totalClientOutstanding,
          over_limit_count: overLimitClientsCount,
          driver_payable: totalDriverPayable,
          driver_cash_held: totalDriverCashHeld,
          vehicle_alerts_count: activeDocAlertsCount,
          pending_settlements: driverList.filter(d => Number(d.net_settlement_amount) !== 0).length,
          pending_settlements_count: driverList.filter(d => Number(d.net_settlement_amount) !== 0).length,
          pending_settlement_amount: Math.abs(driverList.reduce((s, d) => s + (Number(d.net_settlement_amount) || 0), 0)),
        } as DashboardStats;
      } catch (e) {
        console.error('Error fetching Supabase stats from views:', e);
      }
    }

    const trips: Trip[] = getStored('trips', initialTrips);
    const settlements = getStored('settlements', initialSettlements);

    const totalCollections = settlements.reduce((sum: number, s: any) => sum + (Number(s.customer_collection) || 0), 0);
    const totalPetrol = settlements.reduce((sum: number, s: any) => sum + (Number(s.petrol_expense) || 0), 0);
    const totalDriverCharges = settlements.reduce((sum: number, s: any) => sum + (Number(s.driver_charge) || 0), 0);
    const totalOther = settlements.reduce((sum: number, s: any) => sum + (Number(s.other_expenses) || 0), 0);
    const totalExpenses = totalPetrol + totalDriverCharges + totalOther;
    const netProfit = totalCollections - totalExpenses;

    const pendingSettlements = settlements.filter((s: any) =>
      ['driver_submitted', 'pending_verification', 'expense_pending', 'difference'].includes(s.settlement_status)
    );
    const pendingAmount = pendingSettlements.reduce((sum: number, s: any) => sum + (Number(s.expected_return) || 0), 0);

    return {
      total_trips: trips.length,
      upcoming_trips: trips.filter(t => ['upcoming', 'assigned', 'available_for_enrollment'].includes(t.trip_status)).length,
      completed_trips: trips.filter(t => t.trip_status === 'completed' || t.trip_status === 'Completed').length,
      in_progress_trips: trips.filter(t => t.trip_status === 'in_progress' || t.trip_status === 'In Progress').length,
      total_collections: totalCollections,
      total_petrol: totalPetrol,
      total_driver_charges: totalDriverCharges,
      total_other_expenses: totalOther,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      pending_settlements: pendingSettlements.length,
      pending_settlements_count: pendingSettlements.length,
      pending_settlement_amount: pendingAmount,
    } as DashboardStats;
  },
};

