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

            const userMatch = (d.payment_arrangement_notes || '').match(/Username:\s*([a-zA-Z0-9_.-]+)/i);
            const extractedUsername = userMatch ? userMatch[1].trim() : d.phone;
            const passMatch = (d.payment_arrangement_notes || '').match(/Password:\s*([^|]+)/i);
            const extractedPassword = passMatch ? passMatch[1].trim() : '';
            const addressMatch = (d.payment_arrangement_notes || '').match(/Address:\s*([^|]+)/i);
            const extractedAddress = addressMatch ? addressMatch[1].trim() : (d.address || '');
            const vehicleMatch = (d.payment_arrangement_notes || '').match(/Vehicle:\s*([^|]+)/i);
            const extractedVehicle = vehicleMatch ? vehicleMatch[1].trim() : (d.assigned_vehicle_reg || d.vehicle_number || '');
            const photoMatch = (d.payment_arrangement_notes || '').match(/Photo:\s*([^|]+)/i);
            const extractedPhoto = photoMatch ? photoMatch[1].trim() : (d.photo_url || '');
            const isCompleted = (d.payment_arrangement_notes || '').includes('profile_completed:true') ||
              (Boolean(d.driving_licence_no) && d.driving_licence_no !== 'N/A' && d.driving_licence_no !== 'PENDING');
            const isFirstLogin = (d.payment_arrangement_notes || '').includes('first_login:true');

            return {
              id: d.id,
              user_id: d.profile_id || d.id,
              employee_id: d.driving_licence_no ? `DL-${d.driving_licence_no.substring(0, 6)}` : 'DRV',
              full_name: d.full_name,
              username: extractedUsername,
              password: extractedPassword,
              phone: d.phone,
              email: `${d.phone}@villalemon.pickup`,
              vehicle_number: extractedVehicle,
              address: extractedAddress,
              photo_url: extractedPhoto,
              driving_licence_no: d.driving_licence_no || '',
              licence_expiry: d.licence_expiry || '',
              employment_type: d.employment_type || 'Per-trip payment',
              monthly_salary: Number(d.monthly_salary) || 0,
              per_trip_payment: Number(d.per_trip_payment) || 0,
              payment_arrangement_notes: d.payment_arrangement_notes || '',
              status: d.status || 'Active',
              employment_status: d.status === 'Active' ? 'active' : 'inactive',
              is_first_login: isFirstLogin,
              is_profile_completed: isCompleted,
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
      const initialPass = _password ? _password.trim() : 'driver123';
      const passwordNote = `Password: ${initialPass}`;
      const combinedNotes = [usernameNote, passwordNote, notes].filter(Boolean).join(' | ') || null;

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

  async updateDriver(id: string, updates: Partial<DriverEmployee>): Promise<DriverEmployee> {
    if (isSupabaseConfigured) {
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.driving_licence_no !== undefined) dbUpdates.driving_licence_no = updates.driving_licence_no;
      if (updates.licence_expiry !== undefined) dbUpdates.licence_expiry = updates.licence_expiry || null;
      if (updates.employment_type !== undefined) dbUpdates.employment_type = updates.employment_type;
      if (updates.monthly_salary !== undefined) dbUpdates.monthly_salary = Number(updates.monthly_salary) || 0;
      if (updates.per_trip_payment !== undefined) dbUpdates.per_trip_payment = Number(updates.per_trip_payment) || 0;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      // Fetch existing notes first to preserve other metadata
      let existingNotes = '';
      try {
        const { data: curr } = await supabase.from('drivers').select('payment_arrangement_notes').eq('id', id).single();
        existingNotes = curr?.payment_arrangement_notes || '';
      } catch {}

      // Update metadata in payment_arrangement_notes while preserving existing parts
      let notes = existingNotes;
      if (updates.username) {
        const cleanUser = updates.username.trim().toLowerCase();
        if (/Username:\s*[^|]+/i.test(notes)) {
          notes = notes.replace(/Username:\s*[^|]+/i, `Username: ${cleanUser}`);
        } else {
          notes = `Username: ${cleanUser} | ${notes}`;
        }
      }
      if (updates.password) {
        const cleanPass = updates.password.trim();
        if (/Password:\s*[^|]+/i.test(notes)) {
          notes = notes.replace(/Password:\s*[^|]+/i, `Password: ${cleanPass}`);
        } else {
          notes = `${notes} | Password: ${cleanPass}`;
        }
      }
      if (updates.address) {
        const cleanAddr = updates.address.trim();
        if (/Address:\s*[^|]+/i.test(notes)) {
          notes = notes.replace(/Address:\s*[^|]+/i, `Address: ${cleanAddr}`);
        } else {
          notes = `${notes} | Address: ${cleanAddr}`;
        }
      }
      if (updates.vehicle_number) {
        const cleanVeh = updates.vehicle_number.trim().toUpperCase();
        if (/Vehicle:\s*[^|]+/i.test(notes)) {
          notes = notes.replace(/Vehicle:\s*[^|]+/i, `Vehicle: ${cleanVeh}`);
        } else {
          notes = `${notes} | Vehicle: ${cleanVeh}`;
        }
      }
      
      notes = notes.split('|').map(p => p.trim()).filter(Boolean).join(' | ');
      if (notes) {
        dbUpdates.payment_arrangement_notes = notes;
      }

      const { data, error } = await supabase
        .from('drivers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DriverEmployee;
    }

    const drivers = getStored('drivers', initialDrivers);
    const updated = drivers.map((d: DriverEmployee) => (d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d));
    setStored('drivers', updated);
    return updated.find((d: DriverEmployee) => d.id === id)!;
  },

  async setDriverCredentials(id: string, newPassword: string, newUsername?: string): Promise<{ success: boolean; error?: string }> {
    const cleanPassword = newPassword.trim();
    if (!cleanPassword) {
      return { success: false, error: 'Password cannot be empty' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data: curr, error: fetchErr } = await supabase
          .from('drivers')
          .select('id, payment_arrangement_notes, phone')
          .eq('id', id)
          .single();

        if (fetchErr || !curr) {
          return { success: false, error: fetchErr?.message || 'Driver record not found' };
        }

        let notes = curr.payment_arrangement_notes || '';
        const cleanUser = (newUsername || '').trim().toLowerCase();

        if (cleanUser) {
          if (/Username:\s*[^|]+/i.test(notes)) {
            notes = notes.replace(/Username:\s*[^|]+/i, `Username: ${cleanUser}`);
          } else {
            notes = `Username: ${cleanUser} | ${notes}`;
          }
        }

        if (/Password:\s*[^|]+/i.test(notes)) {
          notes = notes.replace(/Password:\s*[^|]+/i, `Password: ${cleanPassword}`);
        } else {
          notes = `${notes} | Password: ${cleanPassword}`;
        }

        // Clean up flags & empty segments
        notes = notes.replace(/\|\s*first_login:true/gi, '').replace(/first_login:true/gi, '').trim();
        notes = notes.split('|').map((p: string) => p.trim()).filter(Boolean).join(' | ');

        const { error: updateErr } = await supabase
          .from('drivers')
          .update({
            payment_arrangement_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateErr) {
          return { success: false, error: updateErr.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Also update localStorage
    const drivers = getStored('drivers', initialDrivers);
    const updated = drivers.map((d: DriverEmployee) => {
      if (d.id === id) {
        return {
          ...d,
          username: newUsername ? newUsername.trim().toLowerCase() : d.username,
          password: cleanPassword,
          payment_arrangement_notes: `Username: ${newUsername || d.username} | Password: ${cleanPassword}`,
          is_first_login: false,
          updated_at: new Date().toISOString(),
        };
      }
      return d;
    });
    setStored('drivers', updated);

    return { success: true };
  },

  async resetPassword(id: string, customPassword?: string): Promise<{ success: boolean; tempPassword?: string }> {
    const pass = customPassword ? customPassword.trim() : '1234';
    await this.setDriverCredentials(id, pass);
    return { success: true, tempPassword: pass };
  },
};
