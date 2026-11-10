import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DriverEmployee, CreateDriverInput } from '../types';
import { initialDrivers, getStored, setStored } from '../lib/mockData';

export const driverService = {
  async getAll(): Promise<DriverEmployee[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('driver_employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DriverEmployee[];
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
    
    // Check if username already exists
    if (drivers.some((d: DriverEmployee) => d.username.toLowerCase() === input.username.toLowerCase())) {
      throw new Error(`Username "${input.username}" is already taken.`);
    }

    const newDriver: DriverEmployee = {
      id: `d-${Date.now()}`,
      user_id: `u-${Date.now()}`,
      employee_id: input.employee_id,
      full_name: input.full_name,
      username: input.username.toLowerCase(),
      phone: input.phone,
      email: input.email || `${input.username.toLowerCase()}@villalemon.pickup`,
      vehicle_number: input.vehicle_number || '',
      address: input.address || '',
      employment_status: 'active',
      is_first_login: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_trips: 0,
      completed_trips: 0,
      pending_settlements: 0,
    };

    if (isSupabaseConfigured) {
      let authUserId: string | null = null;
      const cleanUsername = input.username.toLowerCase();
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
          }
        } catch (authErr) {
          console.warn('Driver auth registration note:', authErr);
        }
      }

      const payload: any = {
        user_id: authUserId,
        employee_id: input.employee_id,
        full_name: input.full_name,
        username: cleanUsername,
        phone: input.phone,
        email: driverEmail,
        vehicle_number: input.vehicle_number || '',
        address: input.address || '',
        employment_status: 'active',
        is_first_login: true,
      };
      const { data, error } = await supabase.from('driver_employees').insert(payload).select().single();
      if (error) throw error;
      return data as DriverEmployee;
    }

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
      await supabase.from('driver_employees').update({ employment_status: status }).eq('id', id);
    }

    return updated.find((d: DriverEmployee) => d.id === id)!;
  },

  async resetPassword(id: string): Promise<{ success: boolean; tempPassword?: string }> {
    const drivers = getStored('drivers', initialDrivers);
    const updated = drivers.map((d: DriverEmployee) => {
      if (d.id === id) {
        return { ...d, is_first_login: true, updated_at: new Date().toISOString() };
      }
      return d;
    });
    setStored('drivers', updated);

    return { success: true, tempPassword: `lemon${Math.floor(1000 + Math.random() * 9000)}` };
  },
};

