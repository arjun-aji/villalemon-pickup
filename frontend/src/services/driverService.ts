import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DriverEmployee, CreateDriverInput } from '../types';
import { initialDrivers, getStored, setStored } from '../lib/mockData';

export const driverService = {
  async getAll(): Promise<DriverEmployee[]> {
    if (isSupabaseConfigured) {
      try {
        const [{ data: driverRows }, { data: balanceRows }, { data: tripRows }] = await Promise.all([
          supabase.from('drivers').select('*').order('created_at', { ascending: false }),
          supabase.from('v_driver_balances').select('*'),
          supabase.from('trips').select('id, assigned_driver_id, trip_status'),
        ]);

        if (driverRows) {
          const trips = tripRows || [];
          const balances = balanceRows || [];

          return driverRows.map((d: any) => {
            const bal = balances.find((b: any) => b.driver_id === d.id);
            const myTrips = trips.filter((t: any) => t.assigned_driver_id === d.id);
            const completed = myTrips.filter((t: any) => t.trip_status === 'Completed' || t.trip_status === 'completed');

            const userMatch = (d.payment_arrangement_notes || '').match(/Username:\s*([a-zA-Z0-9_]+)/i);
            const extractedUsername = userMatch ? userMatch[1] : d.phone;

            return {
              id: d.id,
              user_id: d.profile_id || d.id,
              employee_id: d.driving_licence_no ? `DL-${d.driving_licence_no.substring(0, 6)}` : 'DRV',
              full_name: d.full_name,
              username: extractedUsername,
              phone: d.phone,
              email: `${d.phone}@villalemon.pickup`,
              vehicle_number: d.assigned_vehicle_reg || '',
              address: '',
              driving_licence_no: d.driving_licence_no || '',
              licence_expiry: d.licence_expiry || '',
              employment_type: d.employment_type || 'Per-trip payment',
              monthly_salary: Number(d.monthly_salary) || 0,
              per_trip_payment: Number(d.per_trip_payment) || 0,
              payment_arrangement_notes: d.payment_arrangement_notes || '',
              status: d.status || 'Active',
              employment_status: d.status === 'Active' ? 'active' : 'inactive',
              balance_payable_to_driver: Number(bal?.balance_payable_to_driver) || 0,
              cash_owed_to_office: Number(bal?.cash_owed_to_office) || 0,
              net_settlement_amount: Number(bal?.net_settlement_amount) || 0,
              total_trips: myTrips.length,
              completed_trips: completed.length,
              pending_settlements: myTrips.length - completed.length,
              created_at: d.created_at,
              updated_at: d.updated_at,
            } as DriverEmployee;
          });
        }
      } catch (err) {
        console.warn('Supabase driverService.getAll fallback:', err);
      }
    }

    const drivers: DriverEmployee[] = getStored('drivers', initialDrivers);
    const trips = getStored('trips', []);
    const settlements = getStored('settlements', []);

    return drivers.map(d => ({
      ...d,
      total_trips: trips.filter((t: any) => t.assigned_driver_id === d.id).length || d.total_trips || 0,
      completed_trips: trips.filter((t: any) => t.assigned_driver_id === d.id && t.trip_status === 'completed').length || d.completed_trips || 0,
      pending_settlements: settlements.filter((s: any) => s.driver_id === d.id && s.settlement_status !== 'settled').length || d.pending_settlements || 0,
    }));
  },

  async getById(id: string): Promise<DriverEmployee | null> {
    const drivers = await this.getAll();
    return drivers.find(d => d.id === id) || null;
  },

  async create(input: CreateDriverInput, _password?: string, _adminId: string = 'admin'): Promise<DriverEmployee> {
    const drivers = getStored('drivers', initialDrivers);
    const cleanUsername = (input.username || input.phone).trim().toLowerCase();

    if (isSupabaseConfigured) {
      let authUserId: string | null = null;
      const driverEmail = input.email || `${cleanUsername}@villalemon.pickup`;

      if (_password) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cnvknruutfrmwyrbhdjq.supabase.co';
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
          const authClient = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          });

          const { data: authData } = await authClient.auth.signUp({
            email: driverEmail,
            password: _password,
            options: {
              data: {
                role: 'driver',
                full_name: input.full_name,
                username: cleanUsername,
              },
            },
          });
          if (authData?.user) {
            authUserId = authData.user.id;

            // Also ensure profile exists in profiles table
            await supabase.from('profiles').upsert({
              id: authUserId,
              email: driverEmail,
              full_name: input.full_name,
              phone: input.phone,
              role: 'driver',
              is_active: true,
            });
          }
        } catch (authErr) {
          console.warn('Driver auth registration note:', authErr);
        }
      }

      const notes = input.payment_arrangement_notes || input.address || '';
      const usernameNote = cleanUsername ? `Username: ${cleanUsername}` : '';
      const combinedNotes = [notes, usernameNote].filter(Boolean).join(' | ') || null;

      const driverPayload: any = {
        profile_id: authUserId,
        full_name: input.full_name,
        phone: input.phone,
        driving_licence_no: input.driving_licence_no || input.employee_id || 'PENDING',
        licence_expiry: input.licence_expiry || null,
        employment_type: input.employment_type || 'Per-trip payment',
        monthly_salary: Number(input.monthly_salary) || 0.00,
        per_trip_payment: Number(input.per_trip_payment) || 500.00,
        payment_arrangement_notes: combinedNotes,
        status: 'Active',
      };

      const { data, error } = await supabase.from('drivers').insert(driverPayload).select().single();
      if (error) {
        console.error('Supabase driver insert error:', error);
        throw error;
      }

      return {
        id: data.id,
        user_id: data.profile_id || data.id,
        employee_id: data.driving_licence_no,
        full_name: data.full_name,
        username: cleanUsername,
        phone: data.phone,
        email: driverEmail,
        vehicle_number: input.vehicle_number || '',
        address: input.address || '',
        driving_licence_no: data.driving_licence_no,
        employment_type: data.employment_type,
        monthly_salary: Number(data.monthly_salary),
        per_trip_payment: Number(data.per_trip_payment),
        status: data.status,
        employment_status: 'active',
        is_first_login: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as DriverEmployee;
    }

    const newDriver: DriverEmployee = {
      id: `d-${Date.now()}`,
      user_id: `u-${Date.now()}`,
      employee_id: input.employee_id,
      full_name: input.full_name,
      username: cleanUsername,
      phone: input.phone,
      email: input.email || `${cleanUsername}@villalemon.pickup`,
      vehicle_number: input.vehicle_number || '',
      address: input.address || '',
      driving_licence_no: input.driving_licence_no || '',
      employment_type: input.employment_type || 'Per-trip payment',
      monthly_salary: Number(input.monthly_salary) || 0,
      per_trip_payment: Number(input.per_trip_payment) || 500,
      status: 'Active',
      employment_status: 'active',
      is_first_login: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_trips: 0,
      completed_trips: 0,
      pending_settlements: 0,
    };

    setStored('drivers', [newDriver, ...drivers]);
    return newDriver;
  },

  async updateStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<DriverEmployee> {
    const drivers = getStored('drivers', initialDrivers);
    const updated = drivers.map((d: DriverEmployee) => {
      if (d.id === id) {
        return { ...d, employment_status: status, updated_at: new Date().toISOString() };
      }
      return d;
    });
    setStored('drivers', updated);

    if (isSupabaseConfigured) {
      const dbStatus = status === 'active' ? 'Active' : 'Inactive';
      await supabase.from('drivers').update({ status: dbStatus }).eq('id', id);
    }

    return updated.find((d: DriverEmployee) => d.id === id)!;
  },

  async resetPassword(_id: string): Promise<{ success: boolean; tempPassword?: string }> {
    return { success: true, tempPassword: `lemon${Math.floor(1000 + Math.random() * 9000)}` };
  },
};
